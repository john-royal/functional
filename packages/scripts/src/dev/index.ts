import { join } from "node:path";
import { MiniflareController } from "./miniflare";
import { $ } from "bun";

const sharedBindings = {
  GITHUB_APP_ID: process.env.GITHUB_APP_ID!,
  GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY!,
  HYPERDRIVE: {
    connectionString: process.env.DATABASE_URL!,
  },
};

const miniflare = new MiniflareController({
  cwd: process.cwd(),
  workers: [
    {
      name: "api",
      port: 3001,
      entrypoint: "packages/api/src/index.ts",
      worker: {
        modules: true,
        compatibilityFlags: ["nodejs_compat"],
        compatibilityDate: "2025-05-01",
        cache: true,
        serviceBindings: {
          PRIVATE_API: {
            name: "private-api",
          },
          AUTH: {
            external: {
              address: "auth.johnroyal.workers.dev",
              https: {},
            },
          },
        },
        durableObjects: {
          BUILD_LIMITER: {
            className: "BuildLimiter",
            useSQLite: true,
            scriptName: "private-api",
          },
        },
        bindings: {
          ...sharedBindings,
          FRONTEND_URL: "http://localhost:3000",
        },
      },
    },
    {
      name: "private-api",
      port: 3002,
      entrypoint: "packages/api/src/private/index.ts",
      worker: {
        modules: true,
        compatibilityFlags: ["nodejs_compat"],
        compatibilityDate: "2025-05-01",
        cache: true,
        bindings: sharedBindings,
        durableObjects: {
          BUILD_LIMITER: {
            className: "BuildLimiter",
            useSQLite: true,
          },
        },
      },
    },
  ],
});

await Promise.all([
  miniflare.init(),
  $.cwd(join(process.cwd(), "packages", "web")).env({
    VITE_API_URL: "http://localhost:3001",
  })`bun run dev`,
]);
