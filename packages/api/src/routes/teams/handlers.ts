import { and, eq, getTableColumns, ne, schema } from "@functional/db";
import { isUniqueViolation } from "@functional/db/utils";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";
import { APIError, type HonoEnv } from "../common";
import { validateTeam } from "./helpers";
import {
  createTeamRoute,
  deleteTeamRoute,
  getTeamRoute,
  listTeamsRoute,
} from "./schema";

export const registerTeamRoutes = (app: OpenAPIHono<HonoEnv>) => {
  app.openapi(listTeamsRoute, async (c) => {
    const data = await c.env.DB.select(getTableColumns(schema.teams))
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.userId, c.get("subject").properties.id))
      .innerJoin(schema.teams, eq(schema.teamMembers.teamId, schema.teams.id));

    return c.json(data, 200);
  });

  app.openapi(getTeamRoute, async (c) => {
    const [data] = await c.env.DB.select(getTableColumns(schema.teams))
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.userId, c.get("subject").properties.id))
      .innerJoin(schema.teams, eq(schema.teamMembers.teamId, schema.teams.id))
      .limit(1);

    if (!data) {
      throw new APIError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }

    return c.json(data, 200);
  });

  app.openapi(createTeamRoute, async (c) => {
    const body = c.req.valid("json");
    const db = c.env.DB;
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
              message: `Team "${body.slug}" already exists`,
              details: {
                error: error.message,
              },
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
  });

  app.openapi(deleteTeamRoute, async (c) => {
    const team = await c.env.DB.transaction(async (tx) => {
      const team = await validateTeam(c, tx);
      if (team.role !== "admin" && team.id !== "owner") {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You cannot delete this team",
        });
      }
      const [projectCount, teamMemberCount] = await Promise.all([
        tx.$count(
          tx
            .select({ id: schema.projects.id })
            .from(schema.projects)
            .where(eq(schema.projects.teamId, team.id))
        ),
        tx.$count(
          tx
            .select()
            .from(schema.teamMembers)
            .where(
              and(
                eq(schema.teamMembers.teamId, team.id),
                ne(schema.teamMembers.userId, c.get("subject").properties.id)
              )
            )
        ),
      ]);
      if (projectCount > 0) {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You cannot delete a team with projects",
        });
      }
      if (teamMemberCount > 0) {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You cannot delete your only team",
        });
      }
      await tx.delete(schema.teams).where(eq(schema.teams.id, team.id));
      return team;
    });
    return c.json({ id: team.id }, 200);
  });
};
