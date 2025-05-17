import { and, eq, getTableColumns, ne, or, schema } from "@functional/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { HonoEnv } from "../lib/env";
import { APIError } from "../lib/error";
import { createId } from "@paralleldrive/cuid2";
import { isUniqueViolation } from "@functional/db/utils";
import { validateTeam } from "../lib/helpers";

const teamParams = z.object({
  team: z.string(),
});

const teamSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(["personal", "organization"]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Team");

const teamsRouter = new OpenAPIHono<HonoEnv>();

teamsRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Teams",
        content: {
          "application/json": { schema: z.array(teamSchema) },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const data = await db
      .select(getTableColumns(schema.teams))
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.userId, c.get("subject").properties.id))
      .innerJoin(schema.teams, eq(schema.teamMembers.teamId, schema.teams.id));
    return c.json(data, 200);
  }
);

teamsRouter.openapi(
  createRoute({
    method: "post",
    path: "/",
    request: {
      body: {
        content: {
          "application/json": {
            schema: teamSchema.omit({
              id: true,
              createdAt: true,
              updatedAt: true,
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Team",
        content: {
          "application/json": { schema: z.object({ id: z.string() }) },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const body = c.req.valid("json");
    const teamId = createId();
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.teams)
        .values({
          id: teamId,
          name: body.name,
          slug: body.slug,
          type: body.type,
        })
        .catch((error) => {
          if (isUniqueViolation(error)) {
            throw new APIError({
              code: "CONFLICT",
              message: "Team already exists",
            });
          }
          throw error;
        });
      await tx.insert(schema.teamMembers).values({
        teamId,
        userId: c.get("subject").properties.id,
        role: "owner",
      });
    });
    return c.json({ id: teamId }, 201);
  }
);

teamsRouter.openapi(
  createRoute({
    method: "get",
    path: "/{team}",
    request: {
      params: teamParams,
    },
    responses: {
      200: {
        description: "Team",
        content: { "application/json": { schema: teamSchema } },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const [team] = await db
      .select(getTableColumns(schema.teams))
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
      )
      .limit(1);
    if (!team) {
      throw new APIError({ code: "NOT_FOUND", message: "Team not found" });
    }
    return c.json(team, 200);
  }
);

teamsRouter.openapi(
  createRoute({
    method: "delete",
    path: "/{team}",
    request: {
      params: teamParams,
    },
    responses: {
      200: {
        description: "Team deleted",
        content: {
          "application/json": { schema: z.object({ id: z.string() }) },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const team = await db.transaction(async (tx) => {
      const team = await validateTeam(c, tx);
      if (team.type === "personal") {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You cannot delete your personal team",
        });
      }
      if (team.role !== "admin" && team.id !== "owner") {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You cannot delete this team",
        });
      }
      const projectCount = await tx.$count(
        tx
          .select({ id: schema.projects.id })
          .from(schema.projects)
          .where(eq(schema.projects.teamId, team.id))
      );
      if (projectCount > 0) {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You cannot delete a team with projects",
        });
      }
      await tx.delete(schema.teams).where(eq(schema.teams.id, team.id));
      return team;
    });
    return c.json({ id: team.id }, 200);
  }
);

export default teamsRouter;
