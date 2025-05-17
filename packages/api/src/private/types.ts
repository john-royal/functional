import type { BuildCoordinator } from "./build-coordinator";
import type { DeploymentCoordinator } from "./deployment-coordinator";

export interface Env {
  BUILD_LOGS: R2Bucket;
  HYPERDRIVE: Hyperdrive;
  DEPLOYMENT_COORDINATOR: DurableObjectNamespace<DeploymentCoordinator>;
  BUILD_COORDINATOR: DurableObjectNamespace<BuildCoordinator>;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
}
