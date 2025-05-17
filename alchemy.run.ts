import alchemy from "alchemy";
import {
  DurableObjectNamespace,
  Hyperdrive,
  KVNamespace,
  Queue,
  TanStackStart,
  Worker,
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
    entrypoint: "./packages/auth/src/worker.ts",
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

const api = await Worker("api", {
  name: "api",
  entrypoint: "./packages/api/src/index.ts",
  bindings: {
    AUTH: auth,
    HYPERDRIVE: db.hyperdrive,
    GITHUB_APP_ID: alchemy.secret(process.env.GITHUB_APP_ID),
    GITHUB_PRIVATE_KEY: alchemy.secret(process.env.GITHUB_PRIVATE_KEY),
    FRONTEND_URL: "https://web.johnroyal.workers.dev",
  },
  observability: { enabled: true },
  compatibilityFlags: ["nodejs_compat"],
  url: true,
});

const githubQueue = await Queue("github-queue", {
  name: `functional-github-queue-${app.stage}`,
});

const github = await Worker("github", {
  name: "github",
  entrypoint: "./packages/api/src/github.ts",
  bindings: {
    GITHUB_WEBHOOK_SECRET: alchemy.secret(process.env.GITHUB_WEBHOOK_SECRET),
    GITHUB_QUEUE: githubQueue,
  },
  observability: { enabled: true },
  compatibilityFlags: ["nodejs_compat"],
  url: true,
});

const teamDeploymentCoordinator = new DurableObjectNamespace(
  "team-deployment-coordinator",
  {
    className: "TeamDeploymentCoordinator",
    sqlite: true,
  }
);

const internal = await Worker("internal", {
  name: "internal",
  entrypoint: "./packages/api/src/private/index.ts",
  bindings: {
    GITHUB_WEBHOOK_SECRET: alchemy.secret(process.env.GITHUB_WEBHOOK_SECRET),
    HYPERDRIVE: db.hyperdrive,
    TEAM_DEPLOYMENT_COORDINATOR: teamDeploymentCoordinator,
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
  },
  observability: {
    enabled: true,
  },
  env: {
    VITE_API_URL: "https://api.johnroyal.workers.dev",
  },
});

await app.finalize();
