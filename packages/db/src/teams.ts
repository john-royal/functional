import { pgEnum, pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { users } from "./users";

export const teamType = pgEnum("team_type", ["personal", "organization"]);

export const teams = pgTable("teams", {
  id: cuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  type: teamType().notNull(),
  ...timestamps(),
});

export const teamMemberRole = pgEnum("team_member_role", [
  "owner",
  "admin",
  "member",
]);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: cuid()
      .notNull()
      .references(() => teams.id),
    userId: cuid()
      .notNull()
      .references(() => users.id),
    role: teamMemberRole().notNull(),
    ...timestamps(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userId] })]
);
