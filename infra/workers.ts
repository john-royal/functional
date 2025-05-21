import { hyperdrive, neonProject } from "./database";
import {
  GITHUB_APP_ID,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_PRIVATE_KEY,
} from "./secrets";
import { Wrangler } from "./wrangler/wrangler";

const authKv = new sst.cloudflare.Kv("AuthKV");

sst.Linkable.wrap(random.RandomPassword, (resource) => ({
  properties: {
    value: resource.result,
  },
  include: [
    sst.cloudflare.binding({
      type: "secretTextBindings",
      properties: {
        text: resource.result,
      },
    }),
  ],
}));

const auth = new sst.cloudflare.Worker("Auth", {
  handler: "packages/functions/src/auth/index.ts",
  link: [
    authKv,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    new random.RandomPassword("SessionSecret2", {
      length: 64,
    }),
  ],
  url: true,
  transform: {
    worker: (args) => {
      args.scriptName = "auth";
      args.bindings = $output(args.bindings ?? []).apply((bindings) => [
        ...bindings,
        {
          name: "HYPERDRIVE",
          type: "hyperdrive",
          id: hyperdrive.id,
        },
      ]);
    },
  },
});

const api = new sst.cloudflare.Worker("API", {
  handler: "packages/functions/src/api/index.ts",
  link: [authKv, GITHUB_APP_ID, GITHUB_PRIVATE_KEY, auth],
  url: true,
  transform: {
    worker: (args) => {
      args.scriptName = "api";
      args.bindings = $output(args.bindings ?? []).apply((bindings) => [
        ...bindings,
        {
          name: "HYPERDRIVE",
          type: "hyperdrive",
          id: hyperdrive.id,
        },
      ]);
    },
  },
});

// const api = new Wrangler("API", {
//   directory: "packages/functions",
//   dev: {
//     port: 3001,
//   },
//   config: {
//     main: "src/api/index.ts",
//     compatibility_date: "2025-05-01",
//     compatibility_flags: ["nodejs_compat"],
//     hyperdrive: [
//       {
//         binding: "HYPERDRIVE",
//         id: hyperdrive.id,
//         localConnectionString: neonProject.connectionUriPooler,
//       },
//     ],
//     // services: [
//     //   {
//     //     binding: "AUTH",
//     //     service: auth.scriptName,
//     //   },
//     // ],
//   },
//   secrets: {
//     GITHUB_APP_ID: GITHUB_APP_ID.value,
//     GITHUB_PRIVATE_KEY: GITHUB_PRIVATE_KEY.value,
//   },
// });

// const dispatch = new Wrangler("Dispatch", {
//   directory: "packages/functions",
//   dev: {
//     port: 3003,
//   },
//   config: {
//     main: "src/dispatch/index.ts",
//     compatibility_date: "2025-05-01",
//     compatibility_flags: ["nodejs_compat"],
// hyperdrive: [
//   {
//     binding: "HYPERDRIVE",
//     id: hyperdrive.id,
//     localConnectionString: neonProject.connectionUriPooler,
//   },
// ],
//   },
// });

const sessionSecret = new random.RandomPassword("SessionSecret", {
  length: 64,
});

const web = new Wrangler(
  "Web",
  {
    directory: "packages/web",
    config: {
      compatibility_date: "2025-05-01",
      compatibility_flags: ["nodejs_compat"],
      main: $dev ? undefined : "./.output/server/index.mjs",
      assets: {
        directory: "./.output/public",
      },
      vars: {
        FRONTEND_URL: $dev
          ? "http://localhost:3000"
          : "https://web.johnroyal.workers.dev",
        AUTH_ISSUER: auth.url,
      },
      services: [
        {
          binding: "AUTH",
          service: auth.nodes.worker.scriptName,
          remote: true,
        },
        {
          binding: "API",
          service: api.nodes.worker.scriptName,
          remote: true,
        },
      ],
    },
    build: {
      command: "turbo run build",
      environment: {
        VITE_API_URL: api.url as $util.Output<string>,
        VITE_ZERO_URL: "https://functional-zero.fly.dev",
      },
    },
    secrets: {
      SESSION_SECRET: sessionSecret.result,
    },
  },
  { dependsOn: [api] }
);

new sst.x.DevCommand(
  "WebDev",
  {
    dev: {
      title: "Web",
      command: "bun run dev",
      directory: "packages/web",
    },
    environment: {
      VITE_API_URL: api.url as $util.Output<string>,
      VITE_ZERO_URL: "https://functional-zero.fly.dev",
    },
  },
  { dependsOn: [web] }
);
