/* eslint-disable */
/* tslint:disable */
// noinspection JSUnusedGlobalSymbols
// biome-ignore-all
/*
 * ------------------------------------------------------------
 * ## This file was automatically generated by drizzle-zero. ##
 * ## Any changes you make to this file will be overwritten. ##
 * ##                                                        ##
 * ## Additionally, you should also exclude this file from   ##
 * ## your linter and/or formatter to prevent it from being  ##
 * ## checked or modified.                                   ##
 * ##                                                        ##
 * ## SOURCE: https://github.com/BriefHQ/drizzle-zero        ##
 * ------------------------------------------------------------
 */

import type { ZeroCustomType } from "drizzle-zero";
import type { default as zeroSchema } from "../drizzle-zero.config";

/**
 * The Zero schema object.
 * This type is auto-generated from your Drizzle schema definition.
 */
export const schema = {
  tables: {
    accounts: {
      name: "accounts",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "accounts",
            "id"
          >,
        },
        userId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "accounts",
            "userId"
          >,
        },
        provider: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "accounts",
            "provider"
          >,
        },
        providerAccountId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "accounts",
            "providerAccountId"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "accounts",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "accounts",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["id"],
    },
    deployments: {
      name: "deployments",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "id"
          >,
        },
        teamId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "teamId"
          >,
        },
        projectId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "projectId"
          >,
        },
        status: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "status"
          >,
        },
        trigger: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "trigger"
          >,
        },
        commit: {
          type: "json",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "commit"
          >,
        },
        output: {
          type: "json",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "output"
          >,
        },
        triggeredAt: {
          type: "number",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "triggeredAt"
          >,
        },
        startedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "startedAt"
          >,
        },
        canceledAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "canceledAt"
          >,
        },
        completedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "completedAt"
          >,
        },
        failedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "failedAt"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "deployments",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["id"],
    },
    githubInstallations: {
      name: "githubInstallations",
      columns: {
        id: {
          type: "number",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubInstallations",
            "id"
          >,
        },
        teamId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubInstallations",
            "teamId"
          >,
        },
        targetType: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubInstallations",
            "targetType"
          >,
        },
        targetId: {
          type: "number",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubInstallations",
            "targetId"
          >,
        },
        targetName: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubInstallations",
            "targetName"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubInstallations",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubInstallations",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["id"],
      serverName: "github_installations",
    },
    githubRepositories: {
      name: "githubRepositories",
      columns: {
        id: {
          type: "number",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "id"
          >,
        },
        name: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "name"
          >,
        },
        owner: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "owner"
          >,
        },
        private: {
          type: "boolean",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "private"
          >,
        },
        url: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "url"
          >,
        },
        defaultBranch: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "defaultBranch"
          >,
        },
        installationId: {
          type: "number",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "installationId"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "githubRepositories",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["id"],
      serverName: "github_repositories",
    },
    projects: {
      name: "projects",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "id"
          >,
        },
        name: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "name"
          >,
        },
        slug: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "slug"
          >,
        },
        teamId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "teamId"
          >,
        },
        githubRepositoryId: {
          type: "number",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "githubRepositoryId"
          >,
        },
        gitProductionBranch: {
          type: "string",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "gitProductionBranch"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "projects",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["id"],
    },
    teamMembers: {
      name: "teamMembers",
      columns: {
        teamId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teamMembers",
            "teamId"
          >,
        },
        userId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teamMembers",
            "userId"
          >,
        },
        role: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teamMembers",
            "role"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teamMembers",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teamMembers",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["teamId", "userId"],
      serverName: "team_members",
    },
    teams: {
      name: "teams",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teams",
            "id"
          >,
        },
        name: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teams",
            "name"
          >,
        },
        slug: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teams",
            "slug"
          >,
        },
        type: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teams",
            "type"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teams",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "teams",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["id"],
    },
    users: {
      name: "users",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "users",
            "id"
          >,
        },
        name: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "users",
            "name"
          >,
        },
        image: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "users",
            "image"
          >,
        },
        slug: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "users",
            "slug"
          >,
        },
        defaultTeamId: {
          type: "string",
          optional: false,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "users",
            "defaultTeamId"
          >,
        },
        createdAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "users",
            "createdAt"
          >,
        },
        updatedAt: {
          type: "number",
          optional: true,
          customType: null as unknown as ZeroCustomType<
            typeof zeroSchema,
            "users",
            "updatedAt"
          >,
        },
      },
      primaryKey: ["id"],
    },
  },
  relationships: {
    users: {
      teams: [
        {
          sourceField: ["id"],
          destField: ["userId"],
          destSchema: "teamMembers",
          cardinality: "many",
        },
        {
          sourceField: ["teamId"],
          destField: ["id"],
          destSchema: "teams",
          cardinality: "many",
        },
      ],
      accounts: [
        {
          sourceField: ["id"],
          destField: ["userId"],
          destSchema: "accounts",
          cardinality: "many",
        },
      ],
      teamMembers: [
        {
          sourceField: ["id"],
          destField: ["userId"],
          destSchema: "teamMembers",
          cardinality: "many",
        },
      ],
      defaultTeam: [
        {
          sourceField: ["defaultTeamId"],
          destField: ["id"],
          destSchema: "teams",
          cardinality: "one",
        },
      ],
    },
    accounts: {
      user: [
        {
          sourceField: ["userId"],
          destField: ["id"],
          destSchema: "users",
          cardinality: "one",
        },
      ],
    },
    deployments: {
      project: [
        {
          sourceField: ["projectId"],
          destField: ["id"],
          destSchema: "projects",
          cardinality: "one",
        },
      ],
      team: [
        {
          sourceField: ["teamId"],
          destField: ["id"],
          destSchema: "teams",
          cardinality: "one",
        },
      ],
    },
    githubInstallations: {
      team: [
        {
          sourceField: ["teamId"],
          destField: ["id"],
          destSchema: "teams",
          cardinality: "one",
        },
      ],
      repositories: [
        {
          sourceField: ["id"],
          destField: ["installationId"],
          destSchema: "githubRepositories",
          cardinality: "many",
        },
      ],
    },
    githubRepositories: {
      installation: [
        {
          sourceField: ["installationId"],
          destField: ["id"],
          destSchema: "githubInstallations",
          cardinality: "one",
        },
      ],
      projects: [
        {
          sourceField: ["id"],
          destField: ["githubRepositoryId"],
          destSchema: "projects",
          cardinality: "many",
        },
      ],
    },
    projects: {
      team: [
        {
          sourceField: ["teamId"],
          destField: ["id"],
          destSchema: "teams",
          cardinality: "one",
        },
      ],
      githubRepository: [
        {
          sourceField: ["githubRepositoryId"],
          destField: ["id"],
          destSchema: "githubRepositories",
          cardinality: "one",
        },
      ],
      deployments: [
        {
          sourceField: ["id"],
          destField: ["projectId"],
          destSchema: "deployments",
          cardinality: "many",
        },
      ],
    },
    teamMembers: {
      team: [
        {
          sourceField: ["teamId"],
          destField: ["id"],
          destSchema: "teams",
          cardinality: "one",
        },
      ],
      user: [
        {
          sourceField: ["userId"],
          destField: ["id"],
          destSchema: "users",
          cardinality: "one",
        },
      ],
    },
    teams: {
      teamMembers: [
        {
          sourceField: ["id"],
          destField: ["teamId"],
          destSchema: "teamMembers",
          cardinality: "many",
        },
      ],
      installations: [
        {
          sourceField: ["id"],
          destField: ["teamId"],
          destSchema: "githubInstallations",
          cardinality: "many",
        },
      ],
      projects: [
        {
          sourceField: ["id"],
          destField: ["teamId"],
          destSchema: "projects",
          cardinality: "many",
        },
      ],
    },
  },
} as const;

/**
 * Represents the Zero schema type.
 * This type is auto-generated from your Drizzle schema definition.
 */
export type Schema = typeof schema;
