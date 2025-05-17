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
  private teamId: string;
  private deployments: SelectModel<"deployments">[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    assert(
      ctx.id.name,
      "Cannot initialize DeployCoordinator without a team ID"
    );
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
              "success",
              "failed",
              "canceled",
            ])
          )
        )
        .orderBy(asc(schema.deployments.triggeredAt));
    });
  }

  get concurrentBuilds() {
    return this.deployments.filter((d) => d.status === "building").length;
  }

  async enqueue(inputs: InsertModel<"deployments">[]) {
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
    const runnerId = this.env.DEPLOYMENT_RUNNER.idFromName(next.id);
    const runner = this.env.DEPLOYMENT_RUNNER.get(runnerId);
    await runner.start(next);
  }

  async succeed(
    id: string,
    output: NonNullable<SelectModel<"deployments">["output"]>
  ) {
    await this.patch(id, { status: "success", output });
    await this.dequeue();
  }

  async fail(id: string) {
    await this.patch(id, { status: "failed" });
    await this.dequeue();
  }

  async cancel(id: string) {
    await this.patch(id, { status: "canceled" });
    await this.dequeue();
  }

  private async patch(id: string, data: Partial<SelectModel<"deployments">>) {
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
