import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import { cloudflare } from "@cloudflare/vite-plugin";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { getPlatformProxy } from "wrangler";

const external = ["node:async_hooks", "cloudflare:workers"];

const config = defineConfig({
  tsr: {
    appDirectory: "src",
  },
  server: {
    preset: "cloudflare-module",
    experimental: {
      asyncContext: true,
    },
    unenv: {
      external,
    },
  },
  vite: {
    plugins: [
      {
        name: "cloudflare-workers-dev-shim",
        apply: "serve", // dev‑only
        enforce: "pre",
        resolveId(id: string) {
          if (id === "cloudflare:workers") return id; // tell Vite we handled it
        },
        load(id: string) {
          if (id === "cloudflare:workers") {
            return [
              "import { getPlatformProxy } from 'wrangler';",
              "const cloudflare = await getPlatformProxy({ configPath: './web.wrangler.jsonc', environment: 'web' });",
              "export const env = cloudflare.env;",
            ].join("\n");
          }
        },
      },
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
    ],
    build: {
      rollupOptions: {
        external,
      },
    },
  },
});

export default config;
