import alchemy from "alchemy";
import {
  DurableObjectNamespace,
  Hyperdrive,
  KVNamespace,
  Queue,
  R2Bucket,
  TanStackStart,
  Worker,
  Workflow,
} from "alchemy/cloudflare";
import { NeonProject } from "alchemy/neon";
import { Exec } from "alchemy/os";

const app = await alchemy("functional", {
  password: process.env.ALCHEMY_PASSWORD,
  phase: "up",
});

const db = await app.run(async (scope) => {
  const db = await NeonProject("neon", {
    name: "functional-db",
    region_id: "aws-us-east-2",
    pg_version: 17,
  });
  const hyperdrive = await Hyperdrive("neon-hyperdrive", {
    name: `functional-hyperdrive-${scope.stage}`,
    origin: {
      host: db.connection_uris[0].connection_parameters.host,
      port: db.connection_uris[0].connection_parameters.port,
      database: db.connection_uris[0].connection_parameters.database,
      user: db.connection_uris[0].connection_parameters.user,
      password: db.connection_uris[0].connection_parameters.password,
    },
  });
  const pooledConnectionString =
    db.connection_uris[0].connection_uri.unencrypted.replace(
      db.endpoints[0].id,
      `${db.endpoints[0].id}-pooler`
    );
  await Bun.write(".env.local", `DATABASE_URL=${pooledConnectionString}`);
  await Exec("neon-db-push", {
    command: "bun run push",
    cwd: "./packages/db",
    env: {
      DATABASE_URL: db.connection_uris[0].connection_uri.unencrypted,
    },
    memoize: {
      patterns: ["drizzle.config.ts", "src/**"],
    },
  });
  return {
    db,
    hyperdrive,
  };
});

const auth = await app.run(async (scope) => {
  const authKv = await KVNamespace("auth-kv", {
    title: `functional-auth-kv-${scope.stage}`,
  });
  return await Worker("auth-issuer", {
    name: "auth",
    entrypoint: "./packages/functions/src/auth/index.ts",
    bindings: {
      AUTH_KV: authKv,
      HYPERDRIVE: db.hyperdrive,
      GITHUB_CLIENT_ID: alchemy.secret(process.env.GITHUB_CLIENT_ID),
      GITHUB_CLIENT_SECRET: alchemy.secret(process.env.GITHUB_CLIENT_SECRET),
    },
    observability: { enabled: true },
    compatibilityFlags: ["nodejs_compat"],
    url: true,
  });
});

const githubQueue = await Queue("github-queue", {
  name: `functional-github-queue-${app.stage}`,
});

const api = await Worker("api", {
  name: "api",
  entrypoint: "./packages/functions/src/api/index.ts",
  bindings: {
    AUTH: auth,
    AUTH_ISSUER: auth.url!,
    HYPERDRIVE: db.hyperdrive,
    GITHUB_APP_ID: alchemy.secret(process.env.GITHUB_APP_ID),
    GITHUB_PRIVATE_KEY: alchemy.secret(process.env.GITHUB_PRIVATE_KEY),
    GITHUB_QUEUE: githubQueue,
    FRONTEND_URL: "https://web.johnroyal.workers.dev",
  },
  observability: { enabled: true },
  compatibilityFlags: ["nodejs_compat"],
  url: true,
});

const webhook = await Worker("webhook", {
  name: "webhook",
  entrypoint: "./packages/functions/src/webhook/index.ts",
  bindings: {
    GITHUB_WEBHOOK_SECRET: alchemy.secret(process.env.GITHUB_WEBHOOK_SECRET),
    GITHUB_QUEUE: githubQueue,
  },
  observability: { enabled: true },
  compatibilityFlags: ["nodejs_compat"],
  url: true,
});

const deployCoordinator = new DurableObjectNamespace("deploy-coordinator", {
  className: "DeployCoordinator",
  sqlite: true,
});

const deploymentWorkflow = new Workflow("deployment-workflow", {
  className: "DeploymentWorkflow",
});

const deployArtifactBucket = await R2Bucket("deploy-artifact-bucket", {
  name: `functional-deploy-artifact-bucket-${app.stage}`,
});

const deploy = await Worker("deploy", {
  name: "deploy",
  entrypoint: "./packages/functions/src/deploy/index.ts",
  bindings: {
    API_URL: "https://deploy.johnroyal.workers.dev",
    FLY_API_TOKEN: alchemy.secret(process.env.FLY_API_TOKEN),
    FLY_APP_NAME: "functional",
    FLY_CONTAINER_IMAGE: process.env.FLY_CONTAINER_IMAGE!,
    CF_ACCOUNT_ID: alchemy.secret(process.env.CF_ACCOUNT_ID),
    CF_R2_PARENT_ACCESS_KEY_ID: alchemy.secret(
      process.env.CF_R2_PARENT_ACCESS_KEY_ID
    ),
    CF_API_TOKEN: alchemy.secret(process.env.CF_API_TOKEN),
    CF_DISPATCH_NAMESPACE: "functional-staging",
    DEPLOYMENT_JWT_SECRET: alchemy.secret(process.env.DEPLOYMENT_JWT_SECRET),
    DEPLOYMENT_ARTIFACT_BUCKET_NAME: deployArtifactBucket.name,
    DEPLOYMENT_ARTIFACT_BUCKET: deployArtifactBucket,
    DEPLOYMENT_COORDINATOR: deployCoordinator,
    DEPLOYMENT_WORKFLOW: deploymentWorkflow,
    GITHUB_APP_ID: alchemy.secret(process.env.GITHUB_APP_ID),
    GITHUB_PRIVATE_KEY: alchemy.secret(process.env.GITHUB_PRIVATE_KEY),
    HYPERDRIVE: db.hyperdrive,
  },
  observability: { enabled: true },
  compatibilityFlags: ["nodejs_compat"],
  url: true,
  eventSources: [githubQueue],
});

await TanStackStart("web", {
  cwd: "./packages/web",
  command: "turbo run build",
  assets: "./packages/web/.output/public",
  main: "./packages/web/.output/server/index.mjs",
  url: true,
  bindings: {
    AUTH_URL: "https://auth.johnroyal.workers.dev",
    API_URL: "https://api.johnroyal.workers.dev",
    FRONTEND_URL: "https://web.johnroyal.workers.dev",
    AUTH: auth,
    API: api,
    SESSION_SECRET: alchemy.secret(process.env.SESSION_SECRET),
  },
  observability: {
    enabled: true,
  },
  env: {
    VITE_API_URL: "https://api.johnroyal.workers.dev",
  },
});

await app.finalize();
