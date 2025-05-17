import { OpenAPIHono } from "@hono/zod-openapi";
import teamsRouter from "./routes/teams";
import { Auth } from "./lib/auth";
import projectsRouter from "./routes/projects";
import { APIError } from "./lib/error";
import githubInstallationsRouter from "./routes/github-installations";
import { GitHubClient } from "./lib/github";
import type { HonoEnv } from "./lib/env";
import { createDatabaseClient } from "@functional/db/client";

const app = new OpenAPIHono<HonoEnv>();

app.use(async (c, next) => {
  const db = createDatabaseClient(c.env.HYPERDRIVE.connectionString);
  const github = new GitHubClient({
    appId: c.env.GITHUB_APP_ID,
    privateKey: c.env.GITHUB_PRIVATE_KEY,
    db,
  });
  c.set("db", db);
  c.set("github", github);
  await next();
});
app.use("/teams/*", Auth.middleware());

app.route("/teams", teamsRouter);
app.route("/teams/:team/projects", projectsRouter);
app.route("/teams/:team/github-installations", githubInstallationsRouter);

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Team API",
    version: "1.0.0",
  },
  security: [{ bearerAuth: [] }],
});

app.notFound((c) => {
  throw new APIError({
    code: "NOT_FOUND",
    message: `Cannot ${c.req.method} ${c.req.path}`,
  });
});
app.onError((err, c) => {
  const error = APIError.fromUnknown(err);
  return c.json(error.toJSON(), error.status);
});

export default app;
