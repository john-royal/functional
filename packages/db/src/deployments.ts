import { index, jsonb, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { projects } from "./projects";

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
    ...timestamps(),
  },
  (t) => [
    index().on(t.projectId, t.createdAt.desc(), t.status),
    index().on(t.projectId, t.triggeredAt.asc(), t.status),
  ]
);
