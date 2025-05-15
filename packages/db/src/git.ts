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

export const gitInstallations = pgTable("git_installations", {
  id: bigint({ mode: "number" }).primaryKey(),
  teamId: cuid()
    .notNull()
    .references(() => teams.id),
  targetType: gitTargetType().notNull(),
  targetId: bigint({ mode: "number" }).notNull(),
  targetName: varchar({ length: 255 }).notNull(),
  token: varchar({ length: 255 }),
  expiresAt: timestamp("expires_at"),
  ...timestamps(),
});

export const gitRepositories = pgTable("git_repositories", {
  id: bigint({ mode: "number" }).primaryKey(),
  installationId: bigint({ mode: "number" })
    .notNull()
    .references(() => gitInstallations.id),
  name: varchar({ length: 255 }).notNull(),
  url: varchar({ length: 255 }).notNull(),
  ...timestamps(),
});
