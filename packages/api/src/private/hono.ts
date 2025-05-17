import { Hono } from "hono";
import { jwtVerify } from "jose";
import { App } from "octokit";
import type { Env } from "./types";

interface HonoEnv {
  Bindings: Env;
  Variables: {
    token: string;
    jwt: JWT;
  };
}

interface JWT {
  deploymentId: string;
  installationId: number;
  download: {
    owner: string;
    repo: string;
    ref: string;
  };
}

export const app = new Hono<HonoEnv>()
  .use("/deployments/:id/*", async (c, next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { payload } = await jwtVerify<JWT>(
      token,
      new TextEncoder().encode(c.env.GITHUB_PRIVATE_KEY)
    );
    c.set("jwt", payload);
    if (c.req.param("id") !== payload.deploymentId) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  })
  .use(async (c, next) => {
    const app = new App({
      appId: c.env.GITHUB_APP_ID,
      privateKey: c.env.GITHUB_PRIVATE_KEY,
    });
    const token = await app.octokit.rest.apps.createInstallationAccessToken({
      installation_id: c.get("jwt").installationId,
    });
    c.set("token", token.data.token);
    await next();
  })
  .get("/deployments/:id/repository", async (c) => {
    const token = c.get("token");
    const { download } = c.get("jwt");
    return await fetch(
      `https://api.github.com/repos/${download.owner}/${download.repo}/tarball/${download.ref}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
  });
