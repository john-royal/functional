import {
  bigint,
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { githubRepositories } from "./github";
import { teams } from "./teams";
import { relations } from "drizzle-orm";
import { deployments } from "./deployments";

export const projects = pgTable("projects", {
  id: cuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  teamId: cuid()
    .notNull()
    .references(() => teams.id),
  githubRepositoryId: bigint({ mode: "number" })
    .notNull()
    .references(() => githubRepositories.id),
  gitProductionBranch: varchar({ length: 255 }),
  ...timestamps(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  githubRepository: one(githubRepositories, {
    fields: [projects.githubRepositoryId],
    references: [githubRepositories.id],
  }),
  deployments: many(deployments),
}));

export const environmentVariables = pgTable("environment_variables", {
  id: cuid().primaryKey(),
  projectId: cuid()
    .notNull()
    .references(() => projects.id),
  name: varchar({ length: 255 }).notNull(),
  value: varchar({ length: 255 }).notNull(),
  secret: boolean().notNull(),
  ...timestamps(),
});

export const environmentType = pgEnum("environment_type", [
  "development",
  "staging",
  "production",
]);

export const environmentVariableTargets = pgTable(
  "environment_variable_targets",
  {
    projectId: cuid()
      .notNull()
      .references(() => projects.id),
    name: varchar({ length: 255 }).notNull(),
    target: environmentType().notNull(),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.name] })]
);
