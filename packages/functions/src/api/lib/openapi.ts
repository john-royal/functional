import { createRoute, z } from "@hono/zod-openapi";

export const ErrorResponsePayload = z
  .object({
    message: z.string(),
    code: z.string(),
    details: z.record(z.string(), z.any()).optional(),
  })
  .openapi("ErrorResponsePayload");

export const describeRoute: typeof createRoute = (route) => {
  return createRoute({
    ...route,
    responses: {
      ...route.responses,
      default: {
        description: "An error response",
        content: {
          "application/json": {
            schema: ErrorResponsePayload,
          },
        },
      },
    },
  });
};
