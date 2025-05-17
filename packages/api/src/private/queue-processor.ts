import { and, eq, schema } from "@functional/db";
import type { Database } from "@functional/db/client";
import { createDatabaseClient } from "@functional/db/client";
import type {
  GitHubEvent,
  InstallationDeletedEvent,
  PushEvent,
} from "../github";
import type { Env } from "./types";

export class QueueProcessor {
  db: Database;

  constructor(private readonly env: Env) {
    this.db = createDatabaseClient(env.HYPERDRIVE.connectionString);
  }

  async process(event: GitHubEvent) {
    switch (event.type) {
      case "installation.deleted":
        await this.processInstallationDeleted(event);
        break;
      case "push":
        await this.processPush(event);
        break;
    }
  }

  private async processInstallationDeleted(event: InstallationDeletedEvent) {
    await this.db
      .delete(schema.gitInstallations)
      .where(eq(schema.gitInstallations.id, event.payload.installationId));
  }

  private async processPush(event: PushEvent) {
    const [metadata] = await this.db
      .select({
        teamId: schema.projects.teamId,
        projectId: schema.projects.id,
      })
      .from(schema.gitRepositories)
      .where(
        and(
          eq(schema.gitRepositories.id, event.payload.repositoryId),
          eq(
            schema.gitRepositories.installationId,
            event.payload.installationId
          )
        )
      )
      .innerJoin(
        schema.projects,
        eq(schema.projects.gitRepositoryId, schema.gitRepositories.id)
      );
    if (!metadata) {
      return;
    }
    const coordinatorId = this.env.DEPLOYMENT_COORDINATOR.idFromName(
      metadata.teamId
    );
    const coordinator = this.env.DEPLOYMENT_COORDINATOR.get(coordinatorId);
    await coordinator.enqueue({
      projectId: metadata.projectId,
      status: "queued",
      trigger: "git",
      commit: {
        ref: event.payload.ref,
        sha: event.payload.sha,
        message: event.payload.message,
      },
      triggeredAt: new Date(event.payload.timestamp),
    });
  }
}
