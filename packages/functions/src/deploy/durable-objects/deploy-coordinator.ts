import {
  and,
  asc,
  eq,
  getTableColumns,
  notInArray,
  schema,
  type InsertModel,
  type SelectModel,
} from "@functional/db";
import { createDatabaseClient, type Database } from "@functional/db/client";
import { DurableObject } from "cloudflare:workers";
import assert from "node:assert";
import type { Env } from "../lib/env";

const MAX_CONCURRENT_BUILDS = 1;

export class DeployCoordinator extends DurableObject<Env> {
  private db: Database;
  private teamId?: string;
  private deployments: SelectModel<"deployments">[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.db = createDatabaseClient(env.HYPERDRIVE.connectionString);
  }

  get concurrentBuilds() {
    return this.deployments.filter((d) => d.status === "building").length;
  }

  async init(teamId: string) {
    console.log(`[DeployCoordinator] init ${teamId}`);
    this.teamId = teamId;
    this.deployments = await this.db
      .select(getTableColumns(schema.deployments))
      .from(schema.projects)
      .where(eq(schema.projects.teamId, this.teamId))
      .innerJoin(
        schema.deployments,
        and(
          eq(schema.deployments.projectId, schema.projects.id),
          notInArray(schema.deployments.status, [
            "success",
            "failed",
            "canceled",
          ])
        )
      )
      .orderBy(asc(schema.deployments.triggeredAt));
  }

  async enqueue(teamId: string, inputs: InsertModel<"deployments">[]) {
    await this.init(teamId);
    console.log(
      `[DeployCoordinator] enqueue`,
      inputs.map((i) => i.id)
    );
    const newDeployments = await this.db
      .insert(schema.deployments)
      .values(inputs)
      .returning();
    this.deployments.push(...newDeployments);
    this.deployments.sort(
      (a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime()
    );
    await this.dequeue();
  }

  async dequeue() {
    if (this.concurrentBuilds >= MAX_CONCURRENT_BUILDS) {
      return;
    }
    const next = this.deployments.find((d) => d.status === "queued");
    if (!next) {
      return;
    }
    await this.patch(next.id, { status: "building" });
    await this.env.DEPLOYMENT_WORKFLOW.create({
      id: next.id,
      params: {
        projectId: next.projectId,
        deploymentId: next.id,
      },
    });
  }

  async succeed(
    teamId: string,
    deploymentId: string,
    output: NonNullable<SelectModel<"deployments">["output"]>
  ) {
    await this.init(teamId);
    await this.patch(deploymentId, { status: "success", output });
    await this.dequeue();
  }

  async fail(teamId: string, deploymentId: string) {
    await this.init(teamId);
    await this.patch(deploymentId, { status: "failed" });
    await this.dequeue();
  }

  async cancel(teamId: string, deploymentId: string) {
    await this.init(teamId);
    await this.patch(deploymentId, { status: "canceled" });
    await this.dequeue();
  }

  async deploying(teamId: string, deploymentId: string) {
    await this.init(teamId);
    await this.patch(deploymentId, { status: "deploying" });
  }

  private async patch(id: string, data: Partial<SelectModel<"deployments">>) {
    console.log(`[DeployCoordinator] patch ${id}`, data);
    await this.db
      .update(schema.deployments)
      .set(data)
      .where(eq(schema.deployments.id, id));
    const index = this.deployments.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.deployments[index] = {
        ...(this.deployments[index] as SelectModel<"deployments">),
        ...data,
      };
    }
  }
}
