import { and, eq, or, schema } from "@functional/db";
import { isUniqueViolation } from "@functional/db/utils";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";
import type { HonoEnv } from "../lib/env";
import { APIError } from "../lib/error";
import {
  validateGitInstallation,
  validateProject,
  validateTeam,
} from "../lib/helpers";

const projectParams = z.object({
  team: z.string(),
  project: z.string(),
});

export const projectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    teamId: z.string(),
    githubRepositoryId: z.number(),
    githubInstallationId: z.number(),
    githubRepositoryName: z.string(),
    githubRepositoryUrl: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Project");

const projectsRouter = new OpenAPIHono<HonoEnv>();

projectsRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    request: {
      params: z.object({
        team: z.string(),
      }),
    },
    responses: {
      200: {
        description: "Projects",
        content: {
          "application/json": {
            schema: z.array(projectSchema),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json([]);
  }
);

projectsRouter.openapi(
  createRoute({
    method: "post",
    path: "/",
    request: {
      params: z.object({
        team: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: projectSchema.omit({
              id: true,
              teamId: true,
              createdAt: true,
              updatedAt: true,
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Project created",
        content: {
          "application/json": { schema: z.object({ id: z.string() }) },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const body = c.req.valid("json");
    const projectId = createId();
    await db.transaction(async (tx) => {
      const [team, installation] = await Promise.all([
        validateTeam(c, tx),
        tx
          .select()
          .from(schema.githubInstallations)
          .where(eq(schema.githubInstallations.id, body.githubInstallationId))
          .limit(1)
          .then(([installation]) => installation),
      ]);
      if (!installation || installation.teamId !== team.id) {
        throw new APIError({
          code: "NOT_FOUND",
          message: "GitHub installation not found",
        });
      }
      await tx
        .insert(schema.projects)
        .values({
          id: projectId,
          name: body.name,
          slug: body.slug,
          teamId: team.id,
          githubRepositoryId: body.githubRepositoryId,
          githubInstallationId: body.githubInstallationId,
          githubRepositoryName: body.githubRepositoryName,
          githubRepositoryUrl: body.githubRepositoryUrl,
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
    return c.json({ id: projectId }, 201);
  }
);

projectsRouter.openapi(
  createRoute({
    method: "get",
    path: "/{project}",
    request: {
      params: projectParams,
    },
    responses: {
      200: {
        description: "Project",
        content: {
          "application/json": { schema: projectSchema },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const [project, team] = await Promise.all([
      db
        .select()
        .from(schema.projects)
        .where(
          or(
            eq(schema.projects.id, c.req.param("project")),
            eq(schema.projects.slug, c.req.param("project"))
          )
        )
        .limit(1)
        .then(([project]) => project),
      validateTeam(c, db),
    ]);
    if (!project || project.teamId !== team.id) {
      throw new APIError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }
    return c.json(project);
  }
);

projectsRouter.openapi(
  createRoute({
    method: "delete",
    path: "/{project}",
    request: {
      params: projectParams,
    },
    responses: {
      200: {
        description: "Project deleted",
        content: {
          "application/json": { schema: z.object({ id: z.string() }) },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const { project, team } = await validateProject(c);
    if (!["admin", "owner"].includes(team.role)) {
      throw new APIError({
        code: "FORBIDDEN",
        message: "You are not allowed to delete this project",
      });
    }
    await db.delete(schema.projects).where(eq(schema.projects.id, project.id));
    return c.json({ id: project.id });
  }
);
export default projectsRouter;
