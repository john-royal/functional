import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { projects } from "./projects";
import { teams } from "./teams";

export const githubTargetType = pgEnum("github_target_type", [
  "organization",
  "user",
]);

export const githubInstallations = pgTable("github_installations", {
  id: bigint({ mode: "number" }).primaryKey(),
  teamId: cuid()
    .notNull()
    .references(() => teams.id),
  targetType: githubTargetType().notNull(),
  targetId: bigint({ mode: "number" }).notNull(),
  targetName: varchar({ length: 255 }).notNull(),
  ...timestamps(),
});

export const githubInstallationsRelations = relations(
  githubInstallations,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [githubInstallations.teamId],
      references: [teams.id],
    }),
    repositories: many(githubRepositories),
  })
);

export const githubRepositories = pgTable("github_repositories", {
  id: bigint({ mode: "number" }).primaryKey(),
  name: varchar().notNull(),
  owner: varchar().notNull(),
  private: boolean().notNull(),
  url: varchar().notNull(),
  defaultBranch: varchar().notNull(),
  installationId: bigint({ mode: "number" })
    .notNull()
    .references(() => githubInstallations.id),
  ...timestamps(),
});

export const githubRepositoriesRelations = relations(
  githubRepositories,
  ({ one, many }) => ({
    installation: one(githubInstallations, {
      fields: [githubRepositories.installationId],
      references: [githubInstallations.id],
    }),
    projects: many(projects),
  })
);
