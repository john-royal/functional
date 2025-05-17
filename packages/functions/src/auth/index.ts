import { subjects } from "@functional/lib/subjects";
import { issuer } from "@openauthjs/openauth";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { DatabaseClient, GitHub } from "./lib";

interface Env {
  AUTH_KV: KVNamespace;
  HYPERDRIVE: Hyperdrive;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export default {
  async fetch(request, env, ctx) {
    const db = new DatabaseClient(env.HYPERDRIVE.connectionString);
    const app = issuer({
      storage: CloudflareStorage({
        namespace: env.AUTH_KV,
      }),
      subjects,
      providers: {
        github: GithubProvider({
          clientID: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          scopes: [], // determined by GitHub App permissions
        }),
      },
      success: async (ctx, input) => {
        const profile = await GitHub.fetchProfile(input.tokenset.access);
        const user = await db.findOrCreateUser(profile);
        return ctx.subject("user", user);
      },
    });
    if (request.url.includes("/.well-known")) {
      const cached = await caches.default.match(request);
      if (cached) {
        return cached;
      }
      const res = await app.fetch(request, env, ctx);
      await caches.default.put(request, res.clone());
      return res;
    }
    return await app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
