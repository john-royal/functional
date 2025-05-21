import path from "node:path";

export const neonProject = new neon.Project("NeonProject", {
  name: `functional-${$app.stage}`,
  enableLogicalReplication: "yes",
  regionId: "aws-us-east-1",
});

export const hyperdrive = new cloudflare.HyperdriveConfig("Hyperdrive", {
  accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
  name: `functional-postgres-${$app.stage}`,
  origin: {
    host: neonProject.databaseHost,
    database: neonProject.databaseName,
    password: neonProject.databasePassword,
    scheme: "postgresql",
    user: neonProject.databaseUser,
    port: 5432,
  },
});

export const hyperdriveCacheBypass = new cloudflare.HyperdriveConfig(
  "HyperdriveCacheBypass",
  {
    accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
    name: `functional-postgres-${$app.stage}-cache-bypass`,
    origin: {
      host: neonProject.databaseHost,
      database: neonProject.databaseName,
      password: neonProject.databasePassword,
      scheme: "postgresql",
      user: neonProject.databaseUser,
      port: 5432,
    },
    caching: { disabled: true },
  }
);

new command.local.Command("DrizzlePushCommand", {
  create: "drizzle-kit push",
  dir: path.join($cli.paths.root, "packages/db"),
  environment: {
    DATABASE_URL: neonProject.connectionUri,
  },
  triggers: [Date.now()],
});

new command.local.Command("ZeroDeployPermissionsCommand", {
  create: "zero-deploy-permissions",
  dir: path.join($cli.paths.root, "packages/zero"),
  environment: {
    ZERO_UPSTREAM_DB: neonProject.connectionUriPooler,
  },
  triggers: [Date.now()],
});
neonProject.connectionUriPooler.apply((uri) => {
  console.log(uri);
});
