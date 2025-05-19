import { schema } from "@functional/db";
import { drizzleZeroConfig } from "drizzle-zero";

// Define your configuration file for the CLI
export default drizzleZeroConfig(schema, {
  // Specify which tables and columns to include in the Zero schema.
  // This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
  // When a column is first added, it should be set to false, and then changed to true
  // once the migration has been run.

  // All tables/columns must be defined, but can be set to false to exclude them from the Zero schema.
  // Column names match your Drizzle schema definitions
  tables: {
    users: {
      id: true,
      name: true,
      slug: true,
      image: true,
      defaultTeamId: true,
      createdAt: true,
      updatedAt: true,
    },
    accounts: {
      id: true,
      userId: true,
      provider: true,
      providerAccountId: true,
      createdAt: true,
      updatedAt: true,
    },
    teamMembers: {
      teamId: true,
      userId: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    teams: {
      id: true,
      name: true,
      slug: true,
      type: true,
      createdAt: true,
      updatedAt: true,
    },
    projects: {
      id: true,
      name: true,
      slug: true,
      teamId: true,
      githubRepositoryId: true,
      gitProductionBranch: true,
      createdAt: true,
      updatedAt: true,
    },
    environmentVariables: false,
    environmentVariableTargets: false,
    deployments: {
      id: true,
      projectId: true,
      status: true,
      trigger: true,
      commit: true,
      output: true,
      triggeredAt: true,
      startedAt: true,
      canceledAt: true,
      completedAt: true,
      failedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    githubInstallations: {
      id: true,
      teamId: true,
      targetId: true,
      targetType: true,
      targetName: true,
      createdAt: true,
      updatedAt: true,
    },
    githubRepositories: {
      id: true,
      name: true,
      owner: true,
      private: true,
      url: true,
      defaultBranch: true,
      installationId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  manyToMany: {
    users: {
      teams: [
        {
          sourceField: ["id"],
          destField: ["userId"],
          destTable: "teamMembers",
        },
        {
          sourceField: ["teamId"],
          destField: ["id"],
          destTable: "teams",
        },
      ],
    },
  },
});
