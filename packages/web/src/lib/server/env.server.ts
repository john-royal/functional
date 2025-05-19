import { env } from "cloudflare:workers";
import { z } from "zod";

const ServerEnv = z.object({
  SESSION_SECRET: z.string().min(32),
});

export const serverEnv = ServerEnv.parse(env);
