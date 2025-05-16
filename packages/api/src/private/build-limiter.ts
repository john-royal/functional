import {
  and,
  eq,
  getTableColumns,
  notInArray,
  type SelectModel,
} from "@functional/db";
import { createDatabaseClient, type Database } from "@functional/db/client";
import { DurableObject } from "cloudflare:workers";
import { schema } from "@functional/db";
import type { Env } from "./types";
import assert from "node:assert";

export class BuildLimiter extends DurableObject<Env> {
  db: Database;
  teamId: string;
  deployments: SelectModel<"deployments">[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    assert(ctx.id.name, "BuildLimiter must be initialized with a name");
    this.teamId = ctx.id.name;
    console.log("BuildLimiter constructor", {
      teamId: this.teamId,
      connectionString: env.HYPERDRIVE.connectionString,
    });
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
        )
        .catch((err) => {
          console.error("Error fetching deployments", err);
          return [];
        });
    });
  }

  async fetch(request: Request) {
    return new Response(null, { status: 204 });
  }

  async getDeployments() {
    return this.deployments;
  }
}
