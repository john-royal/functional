import {
  and,
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
import type { Env } from "./types";

const MAX_CONCURRENT_BUILDS = 1;

export class DeploymentCoordinator extends DurableObject<Env> {
  db: Database;
  teamId: string;
  deployments: SelectModel<"deployments">[] = [];
  concurrentBuilds: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    assert(ctx.id.name, "BuildLimiter must be initialized with a name");
    this.teamId = ctx.id.name;
    this.db = createDatabaseClient(env.HYPERDRIVE.connectionString);
    ctx.blockConcurrencyWhile(async () => {
      this.deployments = await this.db
        .select(getTableColumns(schema.deployments))
        .from(schema.projects)
        .where(eq(schema.projects.teamId, this.teamId))
        .innerJoin(
          schema.deployments,
          and(
            eq(schema.deployments.projectId, schema.projects.id),
            notInArray(schema.deployments.status, [
              "canceled",
              "failed",
              "success",
            ])
          )
        );
      this.concurrentBuilds = this.deployments.filter(
        (deployment) => deployment.status === "building"
      ).length;
    });
  }

  async fetch(request: Request) {
    return new Response(null, { status: 204 });
  }

  async enqueue(input: InsertModel<"deployments">) {
    // TODO: Check if the deployment is already in the database
    const [deployment] = await this.db
      .insert(schema.deployments)
      .values(input)
      .returning();
    if (!deployment) {
      throw new Error("Failed to create deployment");
    }
    this.deployments.push(deployment);
    this.deployments.sort(
      (a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime()
    );
    await this.tryDequeue();
  }

  async succeed(
    id: string,
    output: NonNullable<SelectModel<"deployments">["output"]>
  ) {
    await this.patch(id, { status: "success", output });
    await this.tryDequeue();
  }

  async fail(id: string) {
    await this.patch(id, { status: "failed" });
    await this.tryDequeue();
  }

  async cancel(id: string) {
    await this.patch(id, { status: "canceled" });
    await this.tryDequeue();
  }

  private async patch(id: string, data: Partial<SelectModel<"deployments">>) {
    const deployment = this.deployments.find(
      (deployment) => deployment.id === id
    );
    if (!deployment) {
      throw new Error("Deployment not found");
    }
    await this.db
      .update(schema.deployments)
      .set(data)
      .where(eq(schema.deployments.id, id));
    Object.assign(deployment, data);
    this.concurrentBuilds = this.deployments.filter(
      (deployment) => deployment.status === "building"
    ).length;
  }

  private async tryDequeue() {
    if (this.concurrentBuilds >= MAX_CONCURRENT_BUILDS) {
      return;
    }
    const deployment = this.deployments.find(
      (deployment) => deployment.status === "queued"
    );
    if (!deployment) {
      return;
    }
    await this.patch(deployment.id, { status: "building" });
    const coordinatorId = this.env.BUILD_COORDINATOR.idFromName(deployment.id);
    const coordinator = this.env.BUILD_COORDINATOR.get(coordinatorId);
    await coordinator.start(deployment);
  }
}
