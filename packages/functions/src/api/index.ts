import { OpenAPIHono } from "@hono/zod-openapi";
import teamsRouter from "./routes/teams";
import { Auth } from "./lib/auth";
import projectsRouter from "./routes/projects";
import { APIError } from "./lib/error";
import githubInstallationsRouter from "./routes/github-installations";
import { GitHubClient } from "./lib/github";
import type { HonoEnv } from "./lib/env";
import { createDatabaseClient } from "@functional/db/client";
import { cors } from "hono/cors";
import deploymentsRouter from "./routes/deployments";

const app = new OpenAPIHono<HonoEnv>();

app.use(
  cors({
    origin: (_, c) => c.env.FRONTEND_URL,
  })
);
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
app.route("/teams/:team/projects/:project/deployments", deploymentsRouter);

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Functional API",
    version: "0.0.1",
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
