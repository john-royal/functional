import { createDatabaseClient } from "@functional/db/client";
import { app } from "./routes";

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
        DB: createDatabaseClient(env.HYPERDRIVE.connectionString),
      },
      ctx
    );
  },
};
