import type { DeployCoordinator } from "../durable-objects/deploy-coordinator";
import { DeployRunner } from "../durable-objects/deploy-runner";

export interface Env {
  DEPLOYMENT_ARTIFACT_BUCKET: R2Bucket;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  DEPLOYMENT_JWT_SECRET: string;
  DEPLOYMENT_COORDINATOR: DurableObjectNamespace<DeployCoordinator>;
  DEPLOYMENT_RUNNER: DurableObjectNamespace<DeployRunner>;
  HYPERDRIVE: Hyperdrive;
}
