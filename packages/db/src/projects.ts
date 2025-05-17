import {
  bigint,
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { githubInstallations } from "./github";
import { teams } from "./teams";

export const projects = pgTable("projects", {
  id: cuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  teamId: cuid()
    .notNull()
    .references(() => teams.id),
  githubRepositoryId: bigint({ mode: "number" }).notNull(),
  githubInstallationId: bigint({ mode: "number" })
    .notNull()
    .references(() => githubInstallations.id),
  githubRepositoryName: varchar({ length: 255 }).notNull(),
  githubRepositoryUrl: varchar({ length: 255 }).notNull(),
  ...timestamps(),
});

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
