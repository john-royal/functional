import { createDatabaseClient } from "@functional/db/neon";
import { app } from "./routes";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { APIError } from "./routes/common";

export default {
  async fetch(
    request: Request,
    env: { HYPERDRIVE: Hyperdrive },
    ctx: ExecutionContext
  ) {
    return app.fetch(
      request,
      {
        ...env,
        AUTH: {
          fetch: (input, init) => fetch(input, init),
        } as Fetcher,
        DB: createDatabaseClient(env.HYPERDRIVE.connectionString),
        LOCAL: true,
      },
      ctx
    );
  },
};
