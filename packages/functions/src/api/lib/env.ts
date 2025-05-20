import type { Database } from "@functional/db/client";
import type { Subject } from "@functional/lib/subjects";
import type { Context } from "hono";
import type { DeployCoordinator } from "../../deploy/durable-objects/deploy-coordinator";
import type { QueueMessage } from "../../event";
import type { GitHubClient } from "./github";

export interface Bindings {
  AUTH: Fetcher;
  HYPERDRIVE: Hyperdrive;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  MESSAGE_QUEUE: Queue<QueueMessage>;
  FRONTEND_URL: string;
  DEPLOY_COORDINATOR: DurableObjectNamespace<DeployCoordinator>;
}

export interface Variables {
  db: Database;
  subject: Subject;
  github: GitHubClient;
}

export interface HonoEnv {
  Bindings: Bindings;
  Variables: Variables;
}

export type HonoContext<TPath extends string = string> = Context<
  HonoEnv,
  TPath
>;
