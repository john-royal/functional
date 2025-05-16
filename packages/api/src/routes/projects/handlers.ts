import { eq, or, schema } from "@functional/db";
import { isUniqueViolation } from "@functional/db/utils";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";
import { APIError, type HonoEnv } from "../common";
import { validateTeam } from "../teams/helpers";
import {
  createProjectRoute,
  deleteProjectRoute,
  getProjectRoute,
  listProjectsRoute,
} from "./schema";
import { validateGitInstallation, validateProject } from "./helpers";

export const registerProjectRoutes = (app: OpenAPIHono<HonoEnv>) => {
  app.openapi(listProjectsRoute, async (c) => {
    const team = await validateTeam(c);
    const data = await c.env.DB.select({
      id: schema.projects.id,
      name: schema.projects.name,
      slug: schema.projects.slug,
      gitRepository: {
        id: schema.gitRepositories.id,
        name: schema.gitRepositories.name,
        url: schema.gitRepositories.url,
        installationId: schema.gitRepositories.installationId,
      },
      teamId: schema.projects.teamId,
      createdAt: schema.projects.createdAt,
      updatedAt: schema.projects.updatedAt,
    })
      .from(schema.projects)
      .where(eq(schema.projects.teamId, team.id))
      .innerJoin(
        schema.gitRepositories,
        eq(schema.projects.gitRepositoryId, schema.gitRepositories.id)
      );
    return c.json(data, 200);
  });

  app.openapi(createProjectRoute, async (c) => {
    const body = c.req.valid("json");
    const id = createId();
    await c.env.DB.transaction(async (tx) => {
      const team = await validateTeam(c, tx);
      await validateGitInstallation(
        c,
        {
          teamId: team.id,
          installationId: body.gitRepository.installationId,
        },
        tx
      );
      await tx
        .insert(schema.gitRepositories)
        .values({
          id: body.gitRepository.id,
          name: body.gitRepository.name,
          url: body.gitRepository.url,
          installationId: body.gitRepository.installationId,
        })
        .onConflictDoNothing();
      await tx
        .insert(schema.projects)
        .values({
          id,
          name: body.name,
          slug: body.slug,
          teamId: team.id,
          gitRepositoryId: body.gitRepository.id,
        })
        .catch((error) => {
          if (isUniqueViolation(error)) {
            throw new APIError({
              code: "CONFLICT",
              message: "Project with this slug already exists",
            });
          }
          throw error;
        });
    });
    return c.json({ id }, 201);
  });

  app.openapi(getProjectRoute, async (c) => {
    const projectPromise = c.env.DB.select({
      id: schema.projects.id,
      name: schema.projects.name,
      slug: schema.projects.slug,
      gitRepository: {
        id: schema.gitRepositories.id,
        name: schema.gitRepositories.name,
        url: schema.gitRepositories.url,
        installationId: schema.gitRepositories.installationId,
      },
      teamId: schema.projects.teamId,
      createdAt: schema.projects.createdAt,
      updatedAt: schema.projects.updatedAt,
    })
      .from(schema.projects)
      .where(
        or(
          eq(schema.projects.id, c.req.param("project")),
          eq(schema.projects.slug, c.req.param("project"))
        )
      )
      .innerJoin(
        schema.gitRepositories,
        eq(schema.projects.gitRepositoryId, schema.gitRepositories.id)
      )
      .limit(1);
    const [project, team] = await Promise.all([
      projectPromise.then(([project]) => project),
      validateTeam(c),
    ]);
    if (!project || project.teamId !== team.id) {
      throw new APIError({ code: "NOT_FOUND", message: "Project not found" });
    }
    return c.json(project, 200);
  });

  app.openapi(deleteProjectRoute, async (c) => {
    const project = await c.env.DB.transaction(async (tx) => {
      const { team, project } = await validateProject(c, tx);
      if (!["admin", "owner"].includes(team.role)) {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You are not allowed to delete this project",
        });
      }
      await tx
        .delete(schema.projects)
        .where(eq(schema.projects.id, project.id))
        .returning({ id: schema.projects.id });
      return project;
    });
    return c.json({ id: project.id }, 200);
  });
};
