/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "functional",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        cloudflare: "6.2.0",
        random: "4.18.2",
        docker: "4.6.2",
        command: "1.0.5",
        neon: "0.9.0",
      },
    };
  },
  async run() {
    const { createWorker } = await import("./infra/rpc/resources/worker");
    const { WorkerAssets } = await import(
      "./infra/rpc/resources/worker-assets"
    );
    const { hyperdrive } = await import("./infra/neon");
    const githubClientId = new sst.Secret("GITHUB_CLIENT_ID");
    const githubClientSecret = new sst.Secret("GITHUB_CLIENT_SECRET");
    const githubAppId = new sst.Secret("GITHUB_APP_ID");
    const githubPrivateKey = new sst.Secret("GITHUB_PRIVATE_KEY");
    const dispatchNamespace =
      new cloudflare.WorkersForPlatformsDispatchNamespace("DispatchNamespace", {
        accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
        name: `dispatch-namespace-${$app.stage}`,
      });
    const dispatch = createWorker("Dispatch", {
      scriptName: "dispatch",
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-20",
      handler: {
        path: "src/dispatch/index.ts",
        cwd: "packages/functions",
      },
      subdomain: true,
      bindings: {
        HYPERDRIVE: hyperdrive,
        DISPATCH_NAMESPACE: dispatchNamespace,
      },
    });
    const authKv = new cloudflare.WorkersKvNamespace("AuthKV", {
      title: `auth-kv-${$app.stage}`,
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
    });
    const auth = createWorker("Auth", {
      scriptName: "auth",
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-20",
      bindings: {
        HYPERDRIVE: hyperdrive,
        AUTH_KV: authKv,
        GITHUB_CLIENT_ID: githubClientId,
        GITHUB_CLIENT_SECRET: githubClientSecret,
      },
      handler: {
        path: "src/auth/index.ts",
        cwd: "packages/functions",
      },
      subdomain: true,
      dev: true,
    });
    const messageQueue = new cloudflare.Queue("MessageQueue", {
      queueName: `message-queue-${$app.stage}`,
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
    });
    const api = createWorker("Api", {
      scriptName: "api",
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-20",
      handler: {
        path: "src/api/index.ts",
        cwd: "packages/functions",
      },
      bindings: {
        AUTH: auth.worker,
        GITHUB_APP_ID: githubAppId,
        GITHUB_PRIVATE_KEY: githubPrivateKey,
        HYPERDRIVE: hyperdrive,
        MESSAGE_QUEUE: messageQueue,
        FRONTEND_URL: "https://web.johnroyal.workers.dev",
      },
      subdomain: true,
      dev: true,
    });
    const deploy = createWorker("Deploy", {
      scriptName: "deploy",
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-20",
      handler: {
        path: "src/deploy/index.ts",
        cwd: "packages/functions",
      },
      subdomain: true,
      bindings: {
        FLY_APP_NAME: "functional",
        FLY_CONTAINER_IMAGE:
          "registry.fly.io/functional:deployment-01JVJFNR1S3WKGY4ASNW1WMZ4D",
        FLY_API_TOKEN: new sst.Secret("FLY_API_TOKEN"),
        GITHUB_APP_ID: githubAppId,
        GITHUB_PRIVATE_KEY: githubPrivateKey,
        HYPERDRIVE: hyperdrive,
        CF_ACCOUNT_ID: sst.cloudflare.DEFAULT_ACCOUNT_ID,
      },
      dev: true,
    });
    new cloudflare.QueueConsumer("WebhookConsumer", {
      queueId: messageQueue.queueId,
      scriptName: deploy.worker.scriptName,
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
      type: "worker",
    });
    const webhook = createWorker("Webhook", {
      scriptName: "webhook",
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-20",
      handler: {
        path: "src/webhook/index.ts",
        cwd: "packages/functions",
      },
      subdomain: true,
      dev: true,
      bindings: {
        GITHUB_WEBHOOK_SECRET: new sst.Secret("GITHUB_WEBHOOK_SECRET"),
        MESSAGE_QUEUE: messageQueue,
      },
    });
    const assets = new WorkerAssets("WebAssets", {
      path: "packages/web/.output/public",
      scriptName: "web",
    });
    const web = createWorker("Web", {
      scriptName: "web",
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-20",
      handler: {
        path: ".output/server/index.mjs",
        cwd: "packages/web",
      },
      bindings: {
        AUTH_URL: "https://auth.johnroyal.workers.dev",
        AUTH: auth.worker,
        API: api.worker,
        VITE_API_URL: "https://api.johnroyal.workers.dev",
        SESSION_SECRET: new random.RandomPassword("SessionSecret", {
          length: 32,
        }),
        FRONTEND_URL: "https://web.johnroyal.workers.dev",
        VITE_ZERO_URL: "https://jnt7z2q4qh.execute-api.us-east-1.amazonaws.com",
      },
      subdomain: true,
      dev: true,
      assets: assets.assets,
    });
  },
});
