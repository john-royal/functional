import { subjects } from "@functional/lib/subjects";
import { issuer } from "@openauthjs/openauth";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { DatabaseClient, GitHubAuthClient } from "./lib";
import { Resource } from "sst";

interface Env {
  HYPERDRIVE: Hyperdrive;
}

export default {
  async fetch(request, env, ctx) {
    const db = new DatabaseClient(env.HYPERDRIVE.connectionString, ctx);
    const github = new GitHubAuthClient(ctx);
    const app = issuer({
      storage: CloudflareStorage({
        namespace: Resource.AuthKV,
      }),
      subjects,
      providers: {
        github: GithubProvider({
          clientID: Resource.GITHUB_CLIENT_ID.value,
          clientSecret: Resource.GITHUB_CLIENT_SECRET.value,
          scopes: [], // determined by GitHub App permissions
        }),
      },
      success: async (ctx, input) => {
        const profile = await github.fetchProfile(input.tokenset.access);
        const user = await db.upsertUser(profile);
        return ctx.subject("user", user, {
          subject: user.id,
        });
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
