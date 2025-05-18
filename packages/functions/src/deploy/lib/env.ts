import type { DeployCoordinator } from "../durable-objects/deploy-coordinator";
import type { DeploymentWorkflowInput } from "../durable-objects/deployment-workflow";

export interface Env {
  API_URL: string;

  FLY_API_TOKEN: string;
  FLY_APP_NAME: string;
  FLY_CONTAINER_IMAGE: string;

  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_DISPATCH_NAMESPACE: string;
  CF_R2_API_TOKEN: string;
  CF_R2_PARENT_ACCESS_KEY_ID: string;

  DEPLOYMENT_ARTIFACT_BUCKET: R2Bucket;
  DEPLOYMENT_ARTIFACT_BUCKET_NAME: string;

  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  DEPLOYMENT_JWT_SECRET: string;
  DEPLOYMENT_COORDINATOR: DurableObjectNamespace<DeployCoordinator>;
  DEPLOYMENT_WORKFLOW: Workflow<DeploymentWorkflowInput>;
  HYPERDRIVE: Hyperdrive;
}
