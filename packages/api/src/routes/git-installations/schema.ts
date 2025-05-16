import { z } from "@hono/zod-openapi";
import { defineRoute } from "../common";
import { teamParamsSchema } from "../teams/schema";

export const gitInstallationParamSchema = teamParamsSchema
  .extend({
    id: z.coerce.number(),
  })
  .openapi("GitInstallationParams");

export const gitInstallationSchema = z
  .object({
    id: z.number(),
    teamId: z.string(),
    targetType: z.enum(["organization", "user"]),
    targetId: z.number(),
    targetName: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("GitInstallation");

export const gitRepositorySchema = z
  .object({
    id: z.number(),
    name: z.string(),
    url: z.string(),
    installationId: z.number(),
  })
  .openapi("GitRepository");

export const listGitInstallationsRoute = defineRoute({
  method: "get",
  path: "/teams/{team}/git-installations",
  request: {
    params: teamParamsSchema,
  },
  responses: {
    200: {
      description: "List of git installations",
      content: {
        "application/json": {
          schema: z.array(gitInstallationSchema),
        },
      },
    },
  },
});

export const getGitInstallationRedirectRoute = defineRoute({
  method: "get",
  path: "/teams/{team}/git-installations/redirect",
  request: {
    params: teamParamsSchema,
  },
  responses: {
    200: {
      description: "Git installation redirect",
      content: {
        "application/json": {
          schema: z.object({
            url: z.string(),
          }),
        },
      },
    },
  },
});

export const createGitInstallationRoute = defineRoute({
  method: "post",
  path: "/teams/{team}/git-installations",
  request: {
    params: teamParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: gitInstallationParamSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Git installation created",
      content: {
        "application/json": {
          schema: z.object({
            id: z.number(),
          }),
        },
      },
    },
  },
});

export const getGitInstallationRoute = defineRoute({
  method: "get",
  path: "/teams/{team}/git-installations/{id}",
  request: {
    params: gitInstallationParamSchema,
  },
  responses: {
    200: {
      description: "Git installation",
      content: {
        "application/json": {
          schema: gitInstallationSchema,
        },
      },
    },
  },
});

export const deleteGitInstallationRoute = defineRoute({
  method: "delete",
  path: "/teams/{team}/git-installations/{id}",
  request: {
    params: gitInstallationParamSchema,
  },
  responses: {
    200: {
      description: "Git installation deleted",
      content: {
        "application/json": {
          schema: z.object({
            id: z.number(),
          }),
        },
      },
    },
  },
});

export const listGitRepositoriesRoute = defineRoute({
  method: "get",
  path: "/teams/{team}/git-installations/{id}/repositories",
  request: {
    params: gitInstallationParamSchema,
  },
  responses: {
    200: {
      description: "List of git repositories",
      content: {
        "application/json": {
          schema: z.array(gitRepositorySchema),
        },
      },
    },
  },
});
