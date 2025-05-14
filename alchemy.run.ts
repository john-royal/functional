import alchemy from "alchemy";
import { makeAuth } from "./stacks/auth";
import { database } from "./stacks/neon";
import { TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("functional", {
  password: process.env.ALCHEMY_PASSWORD,
  phase: "up",
});

const db = await app.run(database);

const auth = await app.run((scope) => makeAuth(scope, db.hyperdrive));

await TanStackStart("web", {
  cwd: "./packages/web",
  command: "turbo run build",
  assets: "./packages/web/.output/public",
  main: "./packages/web/.output/server/index.mjs",
  url: true,
  bindings: {
    AUTH: auth,
  },
  observability: {
    enabled: true,
  },
});

await app.finalize();
