import { eq, schema, type SelectModel } from "@functional/db";
import { createDatabaseClient } from "@functional/db/client";
import { DurableObject } from "cloudflare:workers";
import type { Env } from "../lib/env";
import { JWT } from "../lib/jwt";
import type { DeployCoordinator } from "./deploy-coordinator";

export class DeployRunner extends DurableObject<Env> {
  private db = createDatabaseClient(this.env.HYPERDRIVE.connectionString);
  private jwt = new JWT(this.env.DEPLOYMENT_JWT_SECRET);
  private coordinator!: DurableObjectStub<DeployCoordinator>;

  async start(deployment: SelectModel<"deployments">) {
    const [metadata] = await this.db
      .select({
        installationId: schema.githubInstallations.id,
        teamId: schema.projects.teamId,
        owner: schema.githubInstallations.targetName,
        repo: schema.projects.githubRepositoryName,
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, deployment.projectId))
      .innerJoin(
        schema.githubInstallations,
        eq(schema.githubInstallations.id, schema.projects.githubInstallationId)
      );
    if (!metadata) {
      throw new Error("Project not found");
    }
    const coordinatorId = this.env.DEPLOYMENT_COORDINATOR.idFromName(
      metadata.teamId
    );
    this.coordinator = this.env.DEPLOYMENT_COORDINATOR.get(coordinatorId);
    const repositoryDownloadToken = await this.jwt.sign({
      type: "repository-download",
      properties: {
        installationId: metadata.installationId,
        owner: metadata.owner,
        repo: metadata.repo,
        ref: deployment.commit.sha ?? deployment.commit.ref,
      },
    });
    const artifactUploadToken = await this.jwt.sign({
      type: "artifact-upload",
      properties: {
        projectId: deployment.projectId,
        deploymentId: deployment.id,
      },
    });
    const completeDeploymentToken = await this.jwt.sign({
      type: "complete-deployment",
      properties: {
        teamId: metadata.teamId,
        projectId: deployment.projectId,
        deploymentId: deployment.id,
      },
    });
  }
}
