import {
  bigint,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { teams } from "./teams";

export const gitTargetType = pgEnum("git_target_type", [
  "organization",
  "user",
]);

export const gitNamespaces = pgTable("git_namespaces", {
  id: cuid().primaryKey(),
  teamId: cuid()
    .notNull()
    .references(() => teams.id),
  installationId: bigint({ mode: "number" }).notNull(),
  targetType: gitTargetType().notNull(),
  targetId: varchar({ length: 255 }).notNull(),
  targetName: varchar({ length: 255 }).notNull(),
  token: varchar({ length: 255 }),
  expiresAt: timestamp("expires_at"),
  ...timestamps(),
});

export const gitRepositories = pgTable("git_repositories", {
  id: cuid().primaryKey(),
  namespaceId: cuid()
    .notNull()
    .references(() => gitNamespaces.id),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps(),
});
