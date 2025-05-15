import { OpenAPIHono, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { APIError, type HonoEnv } from "./common";
import { authMiddleware } from "./middleware";
import { registerProjectRoutes } from "./projects/handlers";
import { registerTeamRoutes } from "./teams/handlers";

const app = new OpenAPIHono<HonoEnv>();

app.openAPIRegistry.register(
  "ErrorResponse",
  z.object({
    error: z.object({
      message: z.string(),
      code: z.string(),
      details: z.record(z.string(), z.any()).optional(),
    }),
  })
);
app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.use(
  cors({
    origin: (_, c) => {
      if (c.env.LOCAL) {
        return "http://localhost:3000";
      }
      return "https://web.johnroyal.workers.dev";
    },
  })
);
app.use(authMiddleware);

registerTeamRoutes(app);
registerProjectRoutes(app);

app.onError((err, c) => {
  const error = APIError.fromUnknown(err);

  return c.json(
    {
      error: error.toJSON(),
    },
    error.status
  );
});
app.notFound((c) => {
  return c.json(
    {
      error: new APIError({
        code: "NOT_FOUND",
        message: `Cannot ${c.req.method} ${c.req.path}`,
      }).toJSON(),
    },
    404
  );
});

app.doc("/docs", {
  openapi: "3.1.0",
  info: {
    title: "API",
    version: "0.0.1",
  },
  security: [{ bearerAuth: [] }],
});

export { app };
