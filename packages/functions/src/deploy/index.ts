import { Hono } from "hono";
import type { GitHubEvent } from "../webhook/event";
import type { Env } from "./lib/env";
import { EventProcessor } from "./lib/event-processor";
import { JWT } from "./lib/jwt";
import { GitHubClient } from "../api/lib/github";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { BuildManifest } from "@functional/lib/build";

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
} satisfies ExportedHandler<Env, GitHubEvent>;

export { DeployCoordinator } from "./durable-objects/deploy-coordinator";
export { DeploymentWorkflow } from "./durable-objects/deployment-workflow";
