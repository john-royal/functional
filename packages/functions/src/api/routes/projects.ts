import { eq, getTableColumns, or, schema } from "@functional/db";
import { isUniqueViolation } from "@functional/db/utils";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";
import type { HonoEnv } from "../lib/env";
import { APIError } from "../lib/error";
import {
  validateGitHubInstallation,
  validateProject,
  validateTeam,
} from "../lib/helpers";
import { describeRoute } from "../lib/openapi";
import { githubRepositorySchema } from "./github-installations";

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
    githubRepository: githubRepositorySchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Project");

const queryColumns = () => {
  const { githubRepositoryId: _, ...columns } = getTableColumns(
    schema.projects
  );
  return {
    ...columns,
    githubRepository: {
      id: schema.githubRepositories.id,
      name: schema.githubRepositories.name,
      owner: schema.githubRepositories.owner,
      url: schema.githubRepositories.url,
      private: schema.githubRepositories.private,
      defaultBranch: schema.githubRepositories.defaultBranch,
      installationId: schema.githubRepositories.installationId,
    },
  } as const;
};

const projectsRouter = new OpenAPIHono<HonoEnv>();

projectsRouter.openapi(
  describeRoute({
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
  async (c) => {
    const db = c.get("db");
    const team = await validateTeam(c);
    const projects = await db
      .select(queryColumns())
      .from(schema.projects)
      .where(eq(schema.projects.teamId, team.id))
      .innerJoin(
        schema.githubRepositories,
        eq(schema.projects.githubRepositoryId, schema.githubRepositories.id)
      );
    return c.json(projects);
  }
);

projectsRouter.openapi(
  describeRoute({
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
    const { team } = await validateGitHubInstallation(
      c,
      body.githubRepository.installationId
    );
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.githubRepositories)
        .values(body.githubRepository)
        .onConflictDoNothing();
      await tx
        .insert(schema.projects)
        .values({
          id: projectId,
          name: body.name,
          slug: body.slug,
          teamId: team.id,
          githubRepositoryId: body.githubRepository.id,
          gitProductionBranch: body.githubRepository.defaultBranch,
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
    await c.env.MESSAGE_QUEUE.send({
      type: "project.created",
      payload: {
        githubRepositoryId: body.githubRepository.id,
        projectId,
        githubInstallationId: body.githubRepository.installationId,
      },
    });
    return c.json({ id: projectId }, 201);
  }
);

projectsRouter.openapi(
  describeRoute({
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
        .select(queryColumns())
        .from(schema.projects)
        .where(
          or(
            eq(schema.projects.id, c.req.param("project")),
            eq(schema.projects.slug, c.req.param("project"))
          )
        )
        .innerJoin(
          schema.githubRepositories,
          eq(schema.projects.githubRepositoryId, schema.githubRepositories.id)
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
  describeRoute({
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
    return await db.transaction(async (tx) => {
      const { project, team } = await validateProject(c, tx);
      if (!["admin", "owner"].includes(team.role)) {
        throw new APIError({
          code: "FORBIDDEN",
          message: "You are not allowed to delete this project",
        });
      }
      await tx
        .delete(schema.deployments)
        .where(eq(schema.deployments.projectId, project.id));
      await tx
        .delete(schema.projects)
        .where(eq(schema.projects.id, project.id));
      return c.json({ id: project.id });
    });
  }
);
export default projectsRouter;
