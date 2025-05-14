import { AuthClient, type Subject } from "@functional/auth/client";
import {
  and,
  eq,
  getTableColumns,
  or,
  schema,
  type Select,
} from "@functional/db";
import { type Database } from "@functional/db/client";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

interface Bindings {
  DB: Database;
  AUTH: Fetcher;
  HYPERDRIVE: Hyperdrive;
}

interface Variables {
  subject: Subject;
}

const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const auth = new AuthClient({
    issuer: "https://auth.johnroyal.workers.dev",
    clientID: "api",
    fetch: (input, init) =>
      c.env.AUTH.fetch(input, {
        ...init,
        cf: { cacheEverything: input.includes("/.well-known/") },
      }),
  });
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
  const res = await auth.verify({ access: token });
  if (res.err) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
  c.set("subject", res.subject);
  return next();
});

const teamMiddleware = createMiddleware<
  {
    Bindings: Bindings;
    Variables: Variables & {
      team: Select["teams"];
      member: Select["teamMembers"];
    };
  },
  "/teams/:team"
>(async (c, next) => {
  const db = c.env.DB;
  const [item] = await db
    .select({
      team: getTableColumns(schema.teams),
      member: getTableColumns(schema.teamMembers),
    })
    .from(schema.teams)
    .where(
      or(
        eq(schema.teams.id, c.req.param("team")),
        eq(schema.teams.slug, c.req.param("team"))
      )
    )
    .innerJoin(
      schema.teamMembers,
      and(
        eq(schema.teamMembers.teamId, schema.teams.id),
        eq(schema.teamMembers.userId, c.get("subject").properties.id)
      )
    );
  if (!item) {
    throw new HTTPException(403, {
      message: "Forbidden",
    });
  }
  c.set("team", item.team);
  c.set("member", item.member);
  return next();
});

export const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use(authMiddleware)
  .use(async (c, next) => {
    return next();
  })
  .get("/teams", async (c) => {
    const db = c.env.DB;
    const teams = await db
      .select(getTableColumns(schema.teams))
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.userId, c.get("subject").properties.id))
      .innerJoin(schema.teams, eq(schema.teams.id, schema.teamMembers.teamId));
    return c.json(teams);
  })
  .use("/teams/:team/*", teamMiddleware)
  .get("/teams/:team", (c) => {
    return c.json(c.get("team"));
  })
  .get("/teams/:team/projects", async (c) => {
    const db = c.env.DB;
    const projects = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.teamId, c.get("team").id));
    return c.json(projects);
  })
  .get("/teams/:team/projects/:project", async (c) => {
    const db = c.env.DB;
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(
        or(
          eq(schema.projects.id, c.req.param("project")),
          eq(schema.projects.slug, c.req.param("project"))
        )
      );
    if (!project || project.teamId !== c.get("team").id) {
      throw new HTTPException(404, {
        message: "Project not found",
      });
    }
    return c.json(project);
  })
  .onError((err, c) => {
    return c.json(
      { error: err.message },
      err instanceof HTTPException ? err.status : 500
    );
  });
