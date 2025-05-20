import type { InsertModel } from "@functional/db";
import { and, eq, getTableColumns, schema } from "@functional/db";
import type { Database } from "@functional/db/client";
import { createDatabaseClient } from "@functional/db/client";
import { GitHubClient } from "../../api/lib/github";
import type {
  GitHubInstallationDeletedEvent,
  GitHubPushEvent,
  ProjectCreatedEvent,
  QueueMessage,
} from "../../event";
import type { Env } from "./env";

export class EventProcessor {
  private readonly db: Database;
  private readonly github: GitHubClient;

  constructor(private readonly env: Env) {
    this.db = createDatabaseClient(env.HYPERDRIVE.connectionString);
    this.github = new GitHubClient({
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_PRIVATE_KEY,
    });
  }

  async handle(event: QueueMessage) {
    switch (event.type) {
      case "project.created":
        await this.handleProjectCreated(event);
        break;
      case "github.installation.deleted":
        await this.handleInstallationDeleted(event);
        break;
      case "github.push":
        await this.handlePush(event);
        break;
    }
  }

  async handleProjectCreated(event: ProjectCreatedEvent) {
    const data = await this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, event.payload.projectId))
      .innerJoin(
        schema.githubRepositories,
        eq(schema.projects.githubRepositoryId, schema.githubRepositories.id)
      )
      .limit(1)
      .then(([data]) => data);
    if (!data) {
      return;
    }
    const project = data.projects;
    const githubRepository = data.github_repositories;
    const octokit = await this.github.getInstallationOctokit(
      event.payload.githubInstallationId
    );
    const branch = await octokit.rest.repos.getBranch({
      owner: githubRepository.owner,
      repo: githubRepository.name,
      branch: githubRepository.defaultBranch,
    });
    const coordinatorId = this.env.DEPLOYMENT_COORDINATOR.idFromName(
      project.teamId
    );
    const coordinator = this.env.DEPLOYMENT_COORDINATOR.get(coordinatorId);
    await coordinator.enqueue(project.teamId, [
      {
        teamId: project.teamId,
        projectId: project.id,
        status: "queued",
        trigger: "manual",
        commit: {
          ref: githubRepository.defaultBranch,
          sha: branch.data.commit.sha,
          message: branch.data.commit.commit.message,
        },
        triggeredAt: new Date(),
      },
    ]);
  }

  async handleInstallationDeleted(event: GitHubInstallationDeletedEvent) {
    await this.db
      .delete(schema.githubInstallations)
      .where(eq(schema.githubInstallations.id, event.payload.installationId));
  }

  async handlePush(event: GitHubPushEvent) {
    const projects = await this.db
      .select(getTableColumns(schema.projects))
      .from(schema.githubRepositories)
      .where(
        and(
          eq(schema.githubRepositories.id, event.payload.repositoryId),
          eq(
            schema.githubRepositories.installationId,
            event.payload.installationId
          )
        )
      )
      .innerJoin(
        schema.projects,
        eq(schema.projects.githubRepositoryId, schema.githubRepositories.id)
      );
    if (projects.length === 0) {
      return;
    }
    const teamId = projects[0]!.teamId;
    const deployments: InsertModel<"deployments">[] = projects.map(
      (project) => ({
        teamId,
        projectId: project.id,
        status: "queued",
        trigger: "git",
        commit: {
          ref: event.payload.ref,
          message: event.payload.message,
        },
        triggeredAt: new Date(event.payload.timestamp),
      })
    );
    const coordinatorId = this.env.DEPLOYMENT_COORDINATOR.idFromName(teamId);
    console.log({
      source: "EventProcessor",
      coordinatorId,
      coordinatorIdName: coordinatorId.name,
      teamId,
    });
    const coordinator = this.env.DEPLOYMENT_COORDINATOR.get(coordinatorId);
    await coordinator.enqueue(teamId, deployments);
  }
}
