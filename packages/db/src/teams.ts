import { pgEnum, pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";
import { cuid, timestamps } from "./columns";
import { users } from "./users";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { githubInstallations } from "./github";

export const teamType = pgEnum("team_type", ["personal", "organization"]);

export const teams = pgTable("teams", {
  id: cuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  type: teamType().notNull(),
  ...timestamps(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  installations: many(githubInstallations),
  projects: many(projects),
}));

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

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));
