import { index, pgTable, varchar } from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { projects } from "./projects";

export const deployments = pgTable(
  "deployments",
  {
    id: cuid().primaryKey(),
    projectId: cuid()
      .notNull()
      .references(() => projects.id),
    workerName: varchar({ length: 255 }).notNull(),
    ...timestamps(),
  },
  (t) => [index().on(t.projectId, t.createdAt.desc())]
);
