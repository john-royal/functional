import { and, eq, or, schema } from "@functional/db";
import type { Context } from "hono";
import type { HonoEnv } from "./env";
import type { Database, DatabaseTransaction } from "@functional/db/client";
import { APIError } from "./error";

export const validateTeam = async (
  c: Context<HonoEnv, "/teams/:team">,
  tx: Database | DatabaseTransaction = c.get("db")
) => {
  const [team] = await tx
    .select({
      id: schema.teams.id,
      role: schema.teamMembers.role,
      type: schema.teams.type,
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

export const validateProject = async (
  c: Context<HonoEnv, "/teams/:team/projects/:project">,
  tx: Database | DatabaseTransaction = c.get("db")
) => {
  const [team, project] = await Promise.all([
    validateTeam(c, tx),
    tx
      .select({ id: schema.projects.id, teamId: schema.projects.teamId })
      .from(schema.projects)
      .where(
        or(
          eq(schema.projects.id, c.req.param("project")),
          eq(schema.projects.slug, c.req.param("project"))
        )
      )
      .limit(1)
      .then(([project]) => project),
  ]);
  if (!project || project.teamId !== team.id) {
    throw new APIError({ code: "NOT_FOUND", message: "Project not found" });
  }
  return {
    team,
    project,
  };
};

export const validateGitHubInstallation = async (
  c: Context<HonoEnv, "/teams/:team">,
  installationId: number,
  tx: Database | DatabaseTransaction = c.get("db")
) => {
  const [team, installation] = await Promise.all([
    validateTeam(c, tx),
    tx
      .select()
      .from(schema.githubInstallations)
      .where(eq(schema.githubInstallations.id, installationId))
      .limit(1)
      .then(([installation]) => installation),
  ]);
  if (!installation || installation.teamId !== team.id) {
    throw new APIError({
      code: "NOT_FOUND",
      message: "GitHub installation not found",
    });
  }
  return {
    team,
    installation,
  };
};
