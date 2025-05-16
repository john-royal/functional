import { Hono } from "hono";
import type { Env } from "./types";

const app = new Hono();
app.get("/", (c) => c.text("test"));

export default {
  async fetch(req, env, ctx) {
    const id = env.BUILD_LIMITER.idFromName("test");
    const buildLimiter = env.BUILD_LIMITER.get(id);
    return Response.json({
      buildLimiter: await buildLimiter.getDeployments(),
    });
    return app.fetch(req, env, ctx);
  },
} satisfies ExportedHandler<Env>;

export { BuildLimiter } from "./build-limiter";
export { BuildCoordinator } from "./build-coordinator";
