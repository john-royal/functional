import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import type { PluginOption } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const external = ["node:async_hooks", "cloudflare:workers"];

const devBindingsPlugin: PluginOption = {
  name: "dev-bindings",
  apply: "serve",
  resolveId(id) {
    if (id === "cloudflare:workers") return id;
  },
  load(id) {
    if (id === "cloudflare:workers") {
      return `export const env = {
        FRONTEND_URL: "http://localhost:3000",
        AUTH_URL: "https://auth.johnroyal.workers.dev",
        API_URL: "${process.env.VITE_API_URL}",
        AUTH: {
          fetch: (url, init) => {
            const rewrite = new URL(url);
            rewrite.host = "auth.johnroyal.workers.dev";
            rewrite.protocol = "https";
            return fetch(rewrite, init);
          },
        },
        API: {
          fetch: (req) => {
            return fetch(req);
          },
        },
        SESSION_SECRET: "${process.env.SESSION_SECRET}",
      };`;
    }
  },
};
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
      devBindingsPlugin,
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
