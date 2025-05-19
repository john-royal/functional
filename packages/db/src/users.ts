import { pgEnum, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { teamMembers, teams } from "./teams";
import { relations } from "drizzle-orm";

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

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  teamMembers: many(teamMembers),
  defaultTeam: one(teams, {
    fields: [users.defaultTeamId],
    references: [teams.id],
  }),
}));

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

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
