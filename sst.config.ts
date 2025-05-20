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
    const { createWorker } = await import("./infra/worker");
    const neonProject = new neon.Project("NeonProject", {});
    const hyperdrive = new cloudflare.HyperdriveConfig("Hyperdrive", {
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
      name: `neon-${$app.stage}`,
      origin: {
        host: neonProject.databaseHost,
        database: neonProject.databaseName,
        password: neonProject.databasePassword,
        scheme: "postgresql",
        user: neonProject.databaseUser,
        port: 5432,
      },
    });
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
      },
      subdomain: true,
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
    });
  },
});
