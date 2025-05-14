import { pgEnum, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { teams } from "./teams";

export const users = pgTable("users", {
  id: cuid().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  image: varchar("image", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  defaultTeamId: cuid()
    .references(() => teams.id)
    .notNull(),
  ...timestamps(),
});

export const accountProvider = pgEnum("account_provider", ["github"]);

export const accounts = pgTable(
  "accounts",
  {
    id: cuid().primaryKey(),
    userId: cuid()
      .notNull()
      .references(() => users.id),
    provider: accountProvider().notNull(),
    providerAccountId: varchar({
      length: 255,
    }).notNull(),
    ...timestamps(),
  },
  (t) => [uniqueIndex().on(t.provider, t.providerAccountId)]
);
