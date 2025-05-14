import alchemy, { type Scope } from "alchemy";
import {
  Hyperdrive,
  KVNamespace,
  Worker,
  WranglerJson,
} from "alchemy/cloudflare";

export const makeAuth = async (scope: Scope, hyperdrive: Hyperdrive) => {
  const authKv = await KVNamespace("auth-kv", {
    title: `functional-auth-kv-${scope.stage}`,
  });
  const authIssuer = await Worker("auth-issuer", {
    name: "auth",
    entrypoint: "./packages/auth/src/worker.ts",
    bindings: {
      AUTH_KV: authKv,
      HYPERDRIVE: hyperdrive,
      GITHUB_CLIENT_ID: alchemy.secret(process.env.GITHUB_CLIENT_ID),
      GITHUB_CLIENT_SECRET: alchemy.secret(process.env.GITHUB_CLIENT_SECRET),
    },
    observability: { enabled: true },
    compatibilityFlags: ["nodejs_compat"],
    url: true,
  });
  await WranglerJson("auth-issuer-wrangler-json", {
    worker: authIssuer,
    path: "./packages/auth/wrangler.jsonc",
  });
  return authIssuer;
};
