import { index, jsonb, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { projects } from "./projects";
import { relations } from "drizzle-orm";
import { teams } from "./teams";
export const deploymentStatus = pgEnum("deployment_status", [
  "queued",
  "building",
  "deploying",
  "success",
  "failed",
  "canceled",
]);

export const deploymentTrigger = pgEnum("deployment_trigger", [
  "manual",
  "git",
]);

export const deployments = pgTable(
  "deployments",
  {
    id: cuid().primaryKey(),
    teamId: cuid()
      .notNull()
      .references(() => teams.id),
    projectId: cuid()
      .notNull()
      .references(() => projects.id),
    status: deploymentStatus().notNull(),
    trigger: deploymentTrigger().notNull(),
    commit: jsonb().notNull().$type<{
      ref: string;
      sha?: string;
      message: string;
    }>(),
    output: jsonb().$type<{
      workerName: string;
    }>(),
    triggeredAt: timestamp().notNull(),
    startedAt: timestamp(),
    canceledAt: timestamp(),
    completedAt: timestamp(),
    failedAt: timestamp(),
    ...timestamps(),
  },
  (t) => [
    index().on(t.projectId, t.createdAt.desc(), t.status),
    index().on(t.projectId, t.triggeredAt.asc(), t.status),
  ]
);

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
  team: one(teams, {
    fields: [deployments.teamId],
    references: [teams.id],
  }),
}));
