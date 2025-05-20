import { BuildManifest } from "@functional/lib/build";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { GitHubClient } from "../api/lib/github";
import type { QueueMessage } from "../event";
import type { Env } from "./lib/env";
import { EventProcessor } from "./lib/event-processor";
import { JWT } from "./lib/jwt";

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
      .post(
        "/deploy",
        zValidator(
          "json",
          z.object({
            manifest: BuildManifest,
          })
        ),
        async (c) => {
          const token = await c.get("jwt").verify("complete-deployment");
          const workflow = await env.DEPLOYMENT_WORKFLOW.get(
            token.properties.deploymentId
          );
          const coordinatorId = env.DEPLOYMENT_COORDINATOR.idFromName(
            token.properties.teamId
          );
          const coordinator = env.DEPLOYMENT_COORDINATOR.get(coordinatorId);
          await coordinator.deploying(
            token.properties.teamId,
            token.properties.deploymentId
          );
          await workflow.sendEvent({
            type: "complete-deployment",
            payload: c.req.valid("json"),
          });
          return c.json({ success: true });
        }
      );
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
} satisfies ExportedHandler<Env, QueueMessage>;

export { DeployCoordinator } from "./durable-objects/deploy-coordinator";
export { DeploymentWorkflow } from "./durable-objects/deployment-workflow";
