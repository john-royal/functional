import { z } from "@hono/zod-openapi";
import { defineRoute } from "../common";
import { gitRepositorySchema } from "../git-installations/schema";

export const projectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    teamId: z.string(),
    gitRepository: gitRepositorySchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Project");

export const listProjectsRoute = defineRoute({
  method: "get",
  path: "/teams/:team/projects",
  responses: {
    200: {
      description: "Projects",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(projectSchema),
          }),
        },
      },
    },
  },
});

export const createProjectRoute = defineRoute({
  method: "post",
  path: "/teams/:team/projects",
  request: {
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
        "application/json": {
          schema: z.object({
            data: z.object({
              id: z.string(),
            }),
          }),
        },
      },
    },
  },
});

export const getProjectRoute = defineRoute({
  method: "get",
  path: "/teams/:team/projects/:project",
  responses: {
    200: {
      description: "Project",
      content: {
        "application/json": {
          schema: z.object({
            data: projectSchema,
          }),
        },
      },
    },
  },
});

export const deleteProjectRoute = defineRoute({
  method: "delete",
  path: "/teams/:team/projects/:project",
  responses: {
    200: {
      description: "Project deleted",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              id: z.string(),
            }),
          }),
        },
      },
    },
  },
});
