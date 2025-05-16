import { Webhooks } from "@octokit/webhooks";

interface InstallationDeletedEvent {
  type: "installation.deleted";
  data: {
    installationId: number;
  };
}

interface PushEvent {
  type: "push";
  data: {
    installationId: number;
    repositoryId: number;
    ref: string;
    sha: string;
    message: string;
  };
}

export type GitHubEvent = InstallationDeletedEvent | PushEvent;

interface Env {
  GITHUB_WEBHOOK_SECRET: string;
  GITHUB_QUEUE: Queue<GitHubEvent>;
}

const createWebhookHandler = (env: Env) => {
  const webhooks = new Webhooks({ secret: env.GITHUB_WEBHOOK_SECRET });

  webhooks.on("installation.deleted", async (event) => {
    await env.GITHUB_QUEUE.send({
      type: "installation.deleted",
      data: {
        installationId: event.payload.installation.id,
      },
    });
  });

  webhooks.on("push", async (event) => {
    await env.GITHUB_QUEUE.send({
      type: "push",
      data: {
        installationId: event.payload.installation!.id,
        repositoryId: event.payload.repository.id,
        ref: event.payload.ref,
        sha: event.payload.after,
        message: event.payload.head_commit!.message,
      },
    });
  });

  return webhooks;
};

type ValidationResult =
  | {
      success: false;
      status: number;
      errors: string[];
    }
  | {
      success: true;
      id: string;
      name: string;
      signature: string;
      payload: string;
    };

const validateRequest = async (request: Request): Promise<ValidationResult> => {
  if (request.method !== "POST") {
    return {
      success: false,
      status: 405,
      errors: ["Method not allowed"],
    };
  }

  const id = request.headers.get("x-github-delivery");
  const name = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");
  const payload = await request.text().catch(() => null);

  if (!id || !name || !signature || !payload) {
    const errors = [];
    if (!id) {
      errors.push("Missing x-github-delivery header");
    }
    if (!name) {
      errors.push("Missing x-github-event header");
    }
    if (!signature) {
      errors.push("Missing x-hub-signature-256 header");
    }
    if (!payload) {
      errors.push("Missing payload");
    }
    return {
      success: false,
      status: 400,
      errors,
    };
  }

  return {
    success: true,
    id,
    name,
    signature,
    payload,
  };
};

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const webhooks = createWebhookHandler(env);
    const input = await validateRequest(request);

    if (!input.success) {
      return Response.json(input, { status: input.status });
    }

    await webhooks.verifyAndReceive({
      id: input.id,
      name: input.name,
      payload: input.payload,
      signature: input.signature,
    });

    return Response.json({ success: true }, { status: 200 });
  },
} satisfies ExportedHandler<Env>;
