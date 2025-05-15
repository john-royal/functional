import { z } from "@hono/zod-openapi";
import { defineRoute } from "../common";

const teamParamsSchema = z
  .object({
    team: z.string(),
  })
  .openapi("TeamParams", {
    description: "Team ID or slug",
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

export const listTeamsRoute = defineRoute({
  method: "get",
  path: "/teams",
  description: "List all teams available to the current user",
  responses: {
    200: {
      description: "Teams",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(teamSchema),
          }),
        },
      },
    },
  },
});

export const getTeamRoute = defineRoute({
  method: "get",
  path: "/teams/{team}",
  request: {
    params: teamParamsSchema,
  },
  responses: {
    200: {
      description: "Team",
      content: {
        "application/json": {
          schema: z.object({
            data: teamSchema,
          }),
        },
      },
    },
  },
});

export const createTeamRoute = defineRoute({
  method: "post",
  path: "/teams",
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
        "application/json": {
          schema: z.object({
            data: z.object({
              id: z.string(),
            }),
          }),
        },
      },
    },
    409: {
      description: "Team already exists",
      $ref: "#/components/responses/ErrorResponse",
    },
  },
});

export const deleteTeamRoute = defineRoute({
  method: "delete",
  path: "/teams/{team}",
  request: {
    params: teamParamsSchema,
  },
  responses: {
    200: {
      description: "Team deleted",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({ id: z.string() }),
          }),
        },
      },
    },
  },
});
