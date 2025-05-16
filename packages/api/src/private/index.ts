import { Hono } from "hono";
import type { Env } from "./types";
import { githubRouter } from "./github";

const app = new Hono();
app.get("/", (c) => c.text("test"));
app.route("/github", githubRouter);

export default {
  async fetch(req, env, ctx) {
    return app.fetch(req, env, ctx);
  },
  async queue(msg, env, ctx) {},
} satisfies ExportedHandler<Env>;

export { BuildLimiter } from "./build-limiter";
export { BuildCoordinator } from "./build-coordinator";
