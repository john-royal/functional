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
import { sValidator } from "@hono/standard-validator";
import { createId } from "@paralleldrive/cuid2";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { App, Octokit } from "octokit";
import z from "zod";

interface Bindings {
  DB: Database;
  AUTH: Fetcher;
  HYPERDRIVE: Hyperdrive;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
}

interface Variables {
  subject: Subject;
  github: App;
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

const projectMiddleware = createMiddleware<
  {
    Bindings: Bindings;
    Variables: Variables & {
      project: Select["projects"];
    };
  },
  "/teams/:team/projects/:project"
>(async (c, next) => {
  const db = c.env.DB;
  const [item] = await db
    .select(getTableColumns(schema.projects))
    .from(schema.projects)
    .where(
      or(
        eq(schema.projects.id, c.req.param("project")),
        eq(schema.projects.slug, c.req.param("project"))
      )
    );
  if (!item) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }
  c.set("project", item);
  return next();
});

export const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use(
    cors({
      origin: ["https://web.johnroyal.workers.dev", "http://localhost:3000"],
    })
  )
  .use(authMiddleware)
  .use(async (c, next) => {
    c.set(
      "github",
      new App({
        appId: c.env.GITHUB_APP_ID,
        privateKey: c.env.GITHUB_PRIVATE_KEY,
      })
    );
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
  .get("/teams/:team/git-namespaces", async (c) => {
    const db = c.env.DB;
    const namespaces = await db
      .select()
      .from(schema.gitNamespaces)
      .where(eq(schema.gitNamespaces.teamId, c.get("team").id));
    return c.json(namespaces);
  })
  .get("/teams/:team/git-namespaces/redirect", async (c) => {
    const url = await c.get("github").getInstallationUrl();
    return c.json({ url });
  })
  .post(
    "/teams/:team/git-namespaces",
    sValidator(
      "json",
      z.object({
        installationId: z.number(),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const app = c.get("github");
      const db = c.env.DB;
      const installation = await app.octokit.rest.apps.getInstallation({
        installation_id: body.installationId,
      });
      if (!installation.data.account) {
        throw new HTTPException(400, {
          message: "Invalid installation",
        });
      }
      const [gitNamespace] = await db
        .insert(schema.gitNamespaces)
        .values({
          teamId: c.get("team").id,
          installationId: body.installationId,
          targetType:
            installation.data.target_type === "Organization"
              ? "organization"
              : "user",
          targetId: installation.data.target_id,
          targetName:
            "login" in installation.data.account
              ? installation.data.account.login
              : installation.data.account.slug,
        })
        .returning();
      if (!gitNamespace) {
        throw new HTTPException(500, {
          message: "Failed to create git namespace",
        });
      }
      return c.json(gitNamespace);
    }
  )
  .get("/teams/:team/git-namespaces/:gitNamespaceId", async (c) => {
    const db = c.env.DB;
    const app = c.get("github");
    const [gitNamespace] = await db
      .select()
      .from(schema.gitNamespaces)
      .where(eq(schema.gitNamespaces.id, c.req.param("gitNamespaceId")));
    if (!gitNamespace || gitNamespace.teamId !== c.get("team").id) {
      throw new HTTPException(404, {
        message: "Git namespace not found",
      });
    }
    let octokit: Octokit;
    if (
      !gitNamespace.token ||
      !gitNamespace.expiresAt ||
      gitNamespace.expiresAt < new Date()
    ) {
      const token = await app.octokit.rest.apps.createInstallationAccessToken({
        installation_id: Number(gitNamespace.installationId),
      });
      await db
        .update(schema.gitNamespaces)
        .set({
          token: token.data.token,
          expiresAt: new Date(token.data.expires_at),
        })
        .where(eq(schema.gitNamespaces.id, gitNamespace.id));
      octokit = new Octokit({
        auth: token.data.token,
      });
    } else {
      octokit = new Octokit({
        auth: gitNamespace.token,
      });
    }
    const repositories =
      await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });
    return c.json({
      namespace: {
        id: gitNamespace.id,
        installationId: gitNamespace.installationId,
        targetType: gitNamespace.targetType,
        targetId: gitNamespace.targetId,
        targetName: gitNamespace.targetName,
      },
      repositories: repositories.data.repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      })),
    });
  })
  .post(
    "/teams/:team/projects",
    sValidator(
      "json",
      z.object({
        name: z.string(),
        slug: z.string(),
        gitRepository: z.object({
          name: z.string(),
          githubRepositoryId: z.number(),
          namespaceId: z.string(),
        }),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const db = c.env.DB;
      const projectId = createId();
      const gitRepositoryId = createId();
      await db.transaction(async (tx) => {
        await tx.insert(schema.gitRepositories).values({
          id: gitRepositoryId,
          name: body.gitRepository.name,
          githubRepositoryId: body.gitRepository.githubRepositoryId,
          namespaceId: body.gitRepository.namespaceId,
        });
        await tx.insert(schema.projects).values({
          id: projectId,
          name: body.name,
          slug: body.slug,
          teamId: c.get("team").id,
          gitRepositoryId,
        });
      });
      return c.json({ id: projectId });
    }
  )
  .use("/teams/:team/projects/:project/*", projectMiddleware)
  .get("/teams/:team/projects/:project", (c) => {
    return c.json(c.get("project"));
  })
  .onError((err, c) => {
    return c.json(
      { error: err.message },
      err instanceof HTTPException ? err.status : 500
    );
  });
