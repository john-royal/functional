import type {
  ExecutionContext,
  Hyperdrive,
  KVNamespace,
} from "@cloudflare/workers-types";
import { issuer } from "@openauthjs/openauth";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { DatabaseClient, GitHub } from "./lib";
import { subjects } from "./subjects";

interface Env {
  AUTH_KV: KVNamespace;
  HYPERDRIVE: Hyperdrive;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
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
        console.log("input", JSON.stringify(input, null, 2));
        const userInfo = await GitHub.fetchUser(input.tokenset.access);
        console.log("userInfo", JSON.stringify(userInfo, null, 2));
        const existingUser = await db.findUser(userInfo.id);
        if (existingUser) {
          console.log("existingUser", JSON.stringify(existingUser, null, 2));
          return ctx.subject("user", existingUser);
        }
        if (!userInfo.email) {
          console.log("fetching email");
          userInfo.email = await GitHub.fetchEmail(input.tokenset.access);
          console.log("email", JSON.stringify(userInfo.email, null, 2));
        }
        console.log("creating user");
        const newUser = await db.createUser(
          userInfo as typeof userInfo & { email: string }
        );
        console.log("newUser", JSON.stringify(newUser, null, 2));
        return ctx.subject("user", newUser);
      },
    });
    return await app.fetch(request, env, ctx);
  },
};
