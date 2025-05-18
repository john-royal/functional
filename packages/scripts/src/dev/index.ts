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
      entrypoint: "packages/functions/src/api/index.ts",
      worker: {
        modules: true,
        compatibilityFlags: ["nodejs_compat"],
        compatibilityDate: "2025-05-01",
        cache: true,
        serviceBindings: {
          DEPLOY: {
            name: "deploy",
          },
          AUTH: {
            external: {
              address: "auth.johnroyal.workers.dev",
              https: {},
            },
          },
        },
        bindings: {
          ...sharedBindings,
          AUTH_ISSUER: "https://auth.johnroyal.workers.dev",
          FRONTEND_URL: "http://localhost:3000",
        },
        durableObjects: {
          DEPLOY_COORDINATOR: {
            className: "DeployCoordinator",
            useSQLite: true,
            scriptName: "deploy",
          },
        },
      },
    },
    {
      name: "deploy",
      port: 3002,
      entrypoint: "packages/functions/src/deploy/index.ts",
      worker: {
        modules: true,
        compatibilityFlags: ["nodejs_compat"],
        compatibilityDate: "2025-05-01",
        cache: true,
        bindings: {
          ...sharedBindings,
          API_URL: "http://localhost:3002",
          CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID!,
          CF_R2_PARENT_ACCESS_KEY_ID: process.env.CF_R2_PARENT_ACCESS_KEY_ID!,
          CF_API_TOKEN: process.env.CF_API_TOKEN!,
          CF_DISPATCH_NAMESPACE: process.env.CF_DISPATCH_NAMESPACE!,
          DEPLOYMENT_ARTIFACT_BUCKET_NAME:
            "functional-deploy-artifact-bucket-johnroyal",
          DEPLOYMENT_JWT_SECRET: process.env.DEPLOYMENT_JWT_SECRET!,
          FLY_API_TOKEN: process.env.FLY_API_TOKEN!,
          FLY_APP_NAME: "functional",
          FLY_CONTAINER_IMAGE: process.env.FLY_CONTAINER_IMAGE!,
        },
        durableObjects: {
          DEPLOYMENT_COORDINATOR: {
            className: "DeployCoordinator",
            useSQLite: true,
          },
        },
        workflows: {
          DEPLOYMENT_WORKFLOW: {
            name: "deployment-workflow",
            className: "DeploymentWorkflow",
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
