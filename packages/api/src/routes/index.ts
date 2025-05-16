import { OpenAPIHono, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { APIError, type HonoEnv } from "./common";
import { authMiddleware } from "./middleware";
import { registerProjectRoutes } from "./projects/handlers";
import { registerTeamRoutes } from "./teams/handlers";
import { registerGitInstallationsRoutes } from "./git-installations/handlers";
import { App } from "octokit";

const app = new OpenAPIHono<HonoEnv>();

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.use(
  cors({
    origin: (_, c) => {
      return c.env.FRONTEND_URL;
    },
  })
);

app.use(authMiddleware);
app.use(async (c, next) => {
  c.set(
    "github",
    new App({
      appId: c.env.GITHUB_APP_ID,
      privateKey: c.env.GITHUB_PRIVATE_KEY,
    })
  );
  await next();
});

registerTeamRoutes(app);
registerProjectRoutes(app);
registerGitInstallationsRoutes(app);

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
