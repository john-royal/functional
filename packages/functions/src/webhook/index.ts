import { Webhooks, type WebhookError } from "@octokit/webhooks";
import type { QueueMessage } from "../event";

interface Env {
  GITHUB_WEBHOOK_SECRET: string;
  MESSAGE_QUEUE: Queue<QueueMessage>;
}

export default {
  async fetch(request: Request, env: Env) {
    const id = request.headers.get("x-github-delivery");
    const name = request.headers.get("x-github-event");
    const signature = request.headers.get("x-hub-signature-256");

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (!id || !name || !signature) {
      return new Response("Missing headers", { status: 400 });
    }

    const payload = await request.text().catch(() => null);

    if (!payload) {
      return new Response("Missing payload", { status: 400 });
    }

    try {
      const webhooks = createWebhookHandler(env);
      await webhooks.verifyAndReceive({
        id,
        name,
        signature,
        payload,
      });
      return new Response("OK", { status: 200 });
    } catch (error) {
      if (isWebhookError(error)) {
        return new Response(error.message, {
          status: error.status ?? 500,
        });
      }
      const message = error instanceof Error ? error.message : String(error);
      return new Response(message, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

function createWebhookHandler(env: Env) {
  const webhooks = new Webhooks({
    secret: env.GITHUB_WEBHOOK_SECRET,
  });

  webhooks.on("installation.deleted", async (event) => {
    await env.MESSAGE_QUEUE.send({
      type: "github.installation.deleted",
      payload: {
        installationId: event.payload.installation.id,
      },
    });
  });

  webhooks.on("push", async (event) => {
    await env.MESSAGE_QUEUE.send({
      type: "github.push",
      payload: {
        installationId: event.payload.installation!.id,
        repositoryId: event.payload.repository.id,
        ref: event.payload.ref,
        sha: event.payload.head_commit!.id,
        message: event.payload.head_commit!.message,
        timestamp: new Date(event.payload.head_commit!.timestamp).getTime(),
      },
    });
  });

  return webhooks;
}

function isWebhookError(e: unknown): e is WebhookError {
  return e instanceof Error && "status" in e;
}
