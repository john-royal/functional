import {
  bigint,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
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
  token: varchar({ length: 255 }),
  expiresAt: timestamp("expires_at"),
  ...timestamps(),
});
