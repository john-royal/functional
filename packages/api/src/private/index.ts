import { Hono } from "hono";
import type { Env } from "./types";
import type { GitHubEvent } from "../github";
import { createDatabaseClient } from "@functional/db/client";
import { and, eq, schema } from "@functional/db";

const app = new Hono();
app.get("/", (c) => c.text("test"));

export default {
  async fetch(req, env, ctx) {
    return app.fetch(req, env, ctx);
  },
  async queue(msg, env, ctx) {
    const db = createDatabaseClient(env.HYPERDRIVE.connectionString);
    await Promise.all(
      msg.messages.map(async (message) => {
        switch (message.body.type) {
          case "installation.deleted": {
            await db
              .delete(schema.gitInstallations)
              .where(
                eq(schema.gitInstallations.id, message.body.data.installationId)
              );
            message.ack();
            break;
          }
          case "push": {
            const [metadata] = await db
              .select({
                teamId: schema.projects.teamId,
                projectId: schema.projects.id,
              })
              .from(schema.gitRepositories)
              .where(
                and(
                  eq(schema.gitRepositories.id, message.body.data.repositoryId),
                  eq(
                    schema.gitRepositories.installationId,
                    message.body.data.installationId
                  )
                )
              )
              .innerJoin(
                schema.projects,
                eq(schema.projects.gitRepositoryId, schema.gitRepositories.id)
              );
            if (!metadata) {
              message.ack();
              break;
            }
            const buildLimiterId = env.BUILD_LIMITER.idFromName(
              metadata.teamId
            );
            const buildLimiter = env.BUILD_LIMITER.get(buildLimiterId);
            await buildLimiter.enqueueDeployment({
              projectId: metadata.projectId,
              status: "queued",
              trigger: "git",
              commit: {
                ref: message.body.data.ref,
                sha: message.body.data.sha,
                message: message.body.data.message,
              },
            });
            message.ack();
            break;
          }
        }
      })
    );
  },
} satisfies ExportedHandler<Env, GitHubEvent>;

export { BuildLimiter } from "./build-limiter";
export { BuildCoordinator } from "./build-coordinator";
