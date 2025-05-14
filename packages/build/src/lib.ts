import { createDatabaseClient } from "@functional/db/client";
import { createEnv } from "@t3-oss/env-core";
import { App } from "octokit";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.number().default(3000),
    DATABASE_URL: z.string(),
    GITHUB_APP_ID: z.string(),
    GITHUB_PRIVATE_KEY: z.string(),
  },
  runtimeEnv: process.env,
});

export const db = createDatabaseClient(env.DATABASE_URL);

export const app = new App({
  appId: env.GITHUB_APP_ID,
  privateKey: env.GITHUB_PRIVATE_KEY,
});
