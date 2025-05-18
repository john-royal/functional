import type { Database } from "@functional/db/client";
import type { Subject } from "@functional/lib/subjects";
import type { Context } from "hono";
import type { App } from "octokit";
import type { GitHubClient } from "./github";
import type { GitHubEvent } from "../../webhook/event";
import type { DeployCoordinator } from "../../deploy/durable-objects/deploy-coordinator";

export interface Bindings {
  AUTH: Fetcher;
  HYPERDRIVE: Hyperdrive;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_QUEUE: Queue<GitHubEvent>;
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
