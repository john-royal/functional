import { and, eq, or, schema } from "@functional/db";
import type { Context } from "hono";
import { APIError, type HonoEnv } from "../common";
import type { Database, DatabaseTransaction } from "@functional/db/client";
import { validateTeam } from "../teams/helpers";

export const validateProject = async (
  c: Context<HonoEnv, "/teams/:team/projects/:project">,
  tx: Database | DatabaseTransaction = c.env.DB
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

export const validateGitInstallation = async (
  c: Context<HonoEnv, "/teams/:team/projects/:project">,
  input: {
    teamId: string;
    installationId: number;
  },
  tx: Database | DatabaseTransaction = c.env.DB
) => {
  const count = await tx.$count(
    tx
      .select()
      .from(schema.gitInstallations)
      .where(
        and(
          eq(schema.gitInstallations.id, input.installationId),
          eq(schema.gitInstallations.teamId, input.teamId)
        )
      )
  );
  if (count === 0) {
    throw new APIError({
      code: "NOT_FOUND",
      message: "Git installation not found",
    });
  }
};
