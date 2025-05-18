import type { ExportedHandler, Fetcher } from "@cloudflare/workers-types";

interface Env {
  ASSETS: Fetcher;
}

export default {
  fetch: async (request, env) => {
    return await env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
