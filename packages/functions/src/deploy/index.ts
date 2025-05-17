import { Hono } from "hono";
import type { GitHubEvent } from "../webhook/event";
import type { Env } from "./lib/env";
import { EventProcessor } from "./lib/event-processor";
import { JWT } from "./lib/jwt";
import { GitHubClient } from "../api/lib/github";

export default {
  async fetch(request, env, ctx) {
    const github = new GitHubClient({
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_PRIVATE_KEY,
    });
    const app = new Hono()
      .use(JWT.middleware())
      .get("/repository-download", async (c) => {
        const token = await c.get("jwt").verify("repository-download");
        const { installationId, owner, repo, ref } = token.properties;
        return await github.getRepositoryTarball(
          installationId,
          owner,
          repo,
          ref
        );
      })
      .post("/artifact-upload", async (c) => {
        const token = await c.get("jwt").verify("artifact-upload");
        const data = await c.req.parseBody();
        await Promise.all(
          Object.entries(data).map(async ([key, value]) => {
            await c.env.DEPLOYMENT_ARTIFACT_BUCKET.put(
              `${token.properties.projectId}/${token.properties.deploymentId}/${key}`,
              value instanceof File ? value.stream() : value
            );
          })
        );
        return c.json({ success: true });
      })
      .post("/complete-deployment", async (c) => {
        const token = await c.get("jwt").verify("complete-deployment");
        const coordinatorId = c.env.DEPLOYMENT_COORDINATOR.idFromName(
          token.properties.teamId
        );
        const coordinator = c.env.DEPLOYMENT_COORDINATOR.get(coordinatorId);
        await coordinator.succeed(token.properties.deploymentId, {
          workerName: "",
        });
        return c.json({ success: true });
      });
    return app.fetch(request, env, ctx);
  },
  async queue(batch, env, ctx) {
    const processor = new EventProcessor(env);

    await Promise.all(
      batch.messages.map(async (message) => {
        await processor.handle(message.body);
        message.ack();
      })
    );
  },
} satisfies ExportedHandler<Env, GitHubEvent>;

export { DeployCoordinator } from "./durable-objects/deploy-coordinator";
export { DeployRunner } from "./durable-objects/deploy-runner";
