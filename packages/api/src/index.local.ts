import { createDatabaseClient } from "@functional/db/neon";
import { app } from "./hono";

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
      },
      ctx
    );
  },
};
