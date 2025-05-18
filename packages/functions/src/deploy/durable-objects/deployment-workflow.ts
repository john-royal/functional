import {
  WorkflowEntrypoint,
  WorkflowStep,
  type WorkflowEvent,
} from "cloudflare:workers";
import type { Env } from "../lib/env";
import { createDatabaseClient } from "@functional/db/client";
import { schema, eq } from "@functional/db";
import { Cloudflare } from "../lib/cloudflare";
import type { BuildEnvironment, BuildManifest } from "@functional/lib/build";
import { JWT } from "../lib/jwt";
import assert from "node:assert";

export interface DeploymentWorkflowInput {
  projectId: string;
  deploymentId: string;
}

export class DeploymentWorkflow extends WorkflowEntrypoint<
  Env,
  DeploymentWorkflowInput
> {
  private cf = new Cloudflare(this.env);
  private db = createDatabaseClient(this.env.HYPERDRIVE.connectionString);
  private jwt = new JWT(this.env.DEPLOYMENT_JWT_SECRET);

  async run(event: WorkflowEvent<DeploymentWorkflowInput>, step: WorkflowStep) {
    const { projectId, deploymentId } = event.payload;
    console.log(`[DeploymentWorkflow] run ${projectId} ${deploymentId}`);
    const metadata = await step.do("Fetch project metadata", async () => {
      const [metadata] = await this.db
        .select({
          installationId: schema.githubInstallations.id,
          teamId: schema.projects.teamId,
          owner: schema.githubInstallations.targetName,
          repo: schema.projects.githubRepositoryName,
        })
        .from(schema.projects)
        .where(eq(schema.projects.id, projectId))
        .innerJoin(
          schema.githubInstallations,
          eq(
            schema.githubInstallations.id,
            schema.projects.githubInstallationId
          )
        );
      if (!metadata) {
        throw new Error("Project not found");
      }
      return metadata;
    });
    console.log(`[DeploymentWorkflow] metadata`, metadata);
    const environment = await step.do(
      "Generate build environment",
      async (): Promise<BuildEnvironment> => {
        const [r2Credentials, repoFetchToken, completeDeploymentToken] =
          await Promise.all([
            this.cf.generateR2Credentials({
              bucket: this.env.DEPLOYMENT_ARTIFACT_BUCKET_NAME,
              parentAccessKeyId: this.env.CF_R2_PARENT_ACCESS_KEY_ID,
              permission: "object-read-write",
            }),
            this.jwt.sign({
              type: "repository-download",
              properties: {
                installationId: metadata.installationId,
                owner: metadata.owner,
                repo: metadata.repo,
                ref: "main",
              },
            }),
            this.jwt.sign({
              type: "complete-deployment",
              properties: {
                teamId: metadata.teamId,
                projectId,
                deploymentId,
              },
            }),
          ]);
        return {
          PROJECT_ID: projectId,
          DEPLOYMENT_ID: deploymentId,
          API_URL: this.env.API_URL,
          REPO_FETCH_TOKEN: repoFetchToken,
          DEPLOY_TOKEN: completeDeploymentToken,
          S3_ACCESS_KEY_ID: r2Credentials.accessKeyId,
          S3_SECRET_ACCESS_KEY: r2Credentials.secretAccessKey,
          S3_REGION: "auto",
          S3_BUCKET: this.env.DEPLOYMENT_ARTIFACT_BUCKET_NAME,
          S3_ENDPOINT: `https://${this.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          S3_SESSION_TOKEN: r2Credentials.sessionToken,
        };
      }
    );
    console.log(`[DeploymentWorkflow] environment`, environment);
    const machine = await step.do("Provision build machine", async () => {
      const response = await fetch(
        `https://api.machines.dev/v1/apps/${this.env.FLY_APP_NAME}/machines`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.env.FLY_API_TOKEN}`,
          },
          body: JSON.stringify({
            config: {
              image: this.env.FLY_CONTAINER_IMAGE,
              env: environment,
              restart: {
                policy: "no",
              },
              guest: {
                cpu_kind: "shared",
                cpus: 2,
                memory_mb: 4096, // 4 GB of RAM
              },
            },
          }),
        }
      );
      if (!response.ok) {
        console.log({
          status: response.status,
          statusText: response.statusText,
          body: await response.text(),
        });
        throw new Error(
          `Failed to provision build machine: ${response.statusText}`
        );
      }
      const machine = await response.json<{ id: string }>();
      console.log(machine);
      return machine;
    });
    const complete = await step.waitForEvent<{
      manifest: BuildManifest;
    }>("Complete deployment", {
      type: "complete-deployment",
    });
    const assets = await step.do("Upload worker assets", async () => {
      const manifest: Record<string, { hash: string; size: number }> = {};
      const filesByHash: Record<string, { path: string; type: string }> = {};
      for (const [path, asset] of Object.entries(
        complete.payload.manifest.static
      )) {
        const hash = asset.hash.slice(0, 32);
        manifest[path.startsWith("/") ? path : `/${path}`] = {
          hash,
          size: asset.size,
        };
        filesByHash[hash] = {
          path,
          type: asset.type,
        };
      }
      const session = await this.cf.createAssetUploadSession(
        `${projectId}-${deploymentId}`,
        manifest
      );
      if (!session || !session.jwt || !session.buckets) {
        return { jwt: undefined };
      }
      const jwt = session.jwt;
      let completionToken: string | undefined;
      await Promise.all(
        session.buckets.map(async (bucket) => {
          const formData = new FormData();
          await Promise.all(
            bucket.map(async (fileHash) => {
              const fileInfo = filesByHash[fileHash];
              assert(fileInfo, `File ${fileHash} not found`);
              const file = await this.env.DEPLOYMENT_ARTIFACT_BUCKET.get(
                `${projectId}/${deploymentId}/static/${fileInfo.path}`
              );
              assert(file, `File ${fileInfo.path} not found`);
              const bytes = await file.arrayBuffer();
              const fileBase64 = Buffer.from(bytes).toString("base64");
              formData.append(
                fileHash,
                new File([fileBase64], fileHash, {
                  type: fileInfo.type,
                })
              );
            })
          );
          const res = await this.cf.uploadAssets(jwt, formData);
          if (res.jwt) {
            completionToken = res.jwt;
          }
        })
      );
      return { jwt: completionToken };
    });
    const script = await step.do("Put worker script", async () => {
      const metadata = {
        main_module: complete.payload.manifest.entrypoint,
        // bindings: input.bindings,
        // compatibility_flags: ["nodejs_compat"],
        // compatibility_date: "2025-05-01",
        assets,
      };
      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], {
          type: "application/json",
        })
      );
      await Promise.all(
        Object.entries(complete.payload.manifest.modules).map(
          async ([name, metadata]) => {
            const file = await this.env.DEPLOYMENT_ARTIFACT_BUCKET.get(
              `${projectId}/${deploymentId}/modules/${name}`
            );
            assert(file, `File ${name} not found`);
            const bytes = await file.text();
            formData.append(
              name,
              new File([bytes], name, {
                type:
                  metadata.kind === "entry-point" || metadata.kind === "chunk"
                    ? "application/javascript+module"
                    : metadata.kind === "sourcemap"
                      ? "application/source-map"
                      : "application/octet-stream",
              })
            );
          }
        )
      );
      return await this.cf.putWorkerScript(
        `${projectId}-${deploymentId}`,
        formData
      );
    });
    await step.do("Update deployment", async () => {
      console.log(script);
      const coordinatorId = this.env.DEPLOYMENT_COORDINATOR.idFromName(
        metadata.teamId
      );
      const coordinator = this.env.DEPLOYMENT_COORDINATOR.get(coordinatorId);
      await coordinator.succeed(metadata.teamId, deploymentId, {
        workerName: `${projectId}-${deploymentId}`,
      });
    });
  }
}
