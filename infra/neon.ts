export const neonProject = new neon.Project("NeonProject", {
  enableLogicalReplication: "yes",
});

export const hyperdrive = new cloudflare.HyperdriveConfig("Hyperdrive", {
  accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
  name: `neon-${$app.stage}`,
  origin: {
    host: neonProject.databaseHost,
    database: neonProject.databaseName,
    password: neonProject.databasePassword,
    scheme: "postgresql",
    user: neonProject.databaseUser,
    port: 5432,
  },
  caching: { disabled: true },
});

new sst.x.DevCommand("DrizzlePush", {
  dev: {
    command: "drizzle-kit push",
    directory: "packages/db",
  },
  environment: {
    DATABASE_URL: neonProject.connectionUri,
  },
});
