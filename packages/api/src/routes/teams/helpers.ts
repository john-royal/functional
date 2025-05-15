import { and, eq, or, schema } from "@functional/db";
import type { Context } from "hono";
import { APIError, type HonoEnv } from "../common";
import type { Database, DatabaseTransaction } from "@functional/db/client";

export const validateTeam = async (
  c: Context<HonoEnv, "/teams/:team">,
  tx: Database | DatabaseTransaction = c.env.DB
) => {
  const [team] = await tx
    .select({
      id: schema.teams.id,
      role: schema.teamMembers.role,
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
  if (!team) {
    throw new APIError({ code: "NOT_FOUND", message: "Team not found" });
  }
  return team;
};
