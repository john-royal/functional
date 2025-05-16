import type { BuildCoordinator } from "./build-coordinator";
import type { BuildLimiter } from "./build-limiter";

export interface Env {
  BUILD_LOGS: R2Bucket;
  HYPERDRIVE: Hyperdrive;
  BUILD_LIMITER: DurableObjectNamespace<BuildLimiter>;
  BUILD_COORDINATOR: DurableObjectNamespace<BuildCoordinator>;
}
