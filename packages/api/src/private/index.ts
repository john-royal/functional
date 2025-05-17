import type { GitHubEvent } from "../github";
import { app } from "./hono";
import { QueueProcessor } from "./queue-processor";
import type { Env } from "./types";

export default {
  async fetch(req, env, ctx) {
    return app.fetch(req, env, ctx);
  },
  async queue(msg, env, ctx) {
    const processor = new QueueProcessor(env);
    await Promise.all(
      msg.messages.map(async (message) => {
        await processor.process(message.body);
        message.ack();
      })
    );
  },
} satisfies ExportedHandler<Env, GitHubEvent>;

export { BuildCoordinator } from "./build-coordinator";
export { DeploymentCoordinator } from "./deployment-coordinator";
