import type { Scope } from "alchemy";
import { Hyperdrive } from "alchemy/cloudflare";
import { NeonProject } from "alchemy/neon";
import { Exec } from "alchemy/os";

export const database = async (scope: Scope) => {
  const db = await NeonProject("neon-project", {
    name: "functional-db",
    region_id: "aws-us-east-1",
    pg_version: 17,
  });
  const hyperdrive = await Hyperdrive("neon-hyperdrive", {
    name: `functional-hyperdrive-${scope.stage}`,
    origin: {
      host: db.connection_uris[0].connection_parameters.host,
      port: db.connection_uris[0].connection_parameters.port,
      database: db.connection_uris[0].connection_parameters.database,
      user: db.connection_uris[0].connection_parameters.user,
      password: db.connection_uris[0].connection_parameters.password,
    },
  });
  await Bun.write(
    "packages/db/.env.local",
    `DATABASE_URL=${db.connection_uris[0].connection_uri.unencrypted}`
  );
  await Exec("neon-db-push", {
    command: "bun run push",
    cwd: "./packages/db",
    env: {
      DATABASE_URL: db.connection_uris[0].connection_uri.unencrypted,
    },
    memoize: {
      patterns: ["drizzle.config.ts", "src/**"],
    },
  });
  return {
    db,
    hyperdrive,
  };
};
