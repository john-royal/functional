import type { InsertModel } from "@functional/db";
import { and, eq, schema } from "@functional/db";
import type { Database } from "@functional/db/client";
import { createDatabaseClient } from "@functional/db/client";
import type {
  GitHubEvent,
  GitHubInstallationDeletedEvent,
  GitHubPushEvent,
} from "../../webhook/event";
import type { Env } from "./env";

export class EventProcessor {
  private readonly db: Database;

  constructor(private readonly env: Env) {
    this.db = createDatabaseClient(env.HYPERDRIVE.connectionString);
  }

  async handle(event: GitHubEvent) {
    switch (event.type) {
      case "installation.deleted":
        await this.handleInstallationDeleted(event);
        break;
      case "push":
        await this.handlePush(event);
        break;
    }
  }

  async handleInstallationDeleted(event: GitHubInstallationDeletedEvent) {
    await this.db
      .delete(schema.githubInstallations)
      .where(eq(schema.githubInstallations.id, event.payload.installationId));
  }

  async handlePush(event: GitHubPushEvent) {
    const projects = await this.db
      .select()
      .from(schema.projects)
      .where(
        and(
          eq(schema.projects.githubRepositoryId, event.payload.repositoryId),
          eq(schema.projects.githubInstallationId, event.payload.installationId)
        )
      );
    if (projects.length === 0) {
      return;
    }
    const teamId = projects[0]!.teamId;
    const deployments: InsertModel<"deployments">[] = projects.map(
      (project) => ({
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
