import { z } from "zod";

export const StaticArtifact = z.object({
  size: z.number(),
  hash: z.string(),
  type: z.string(),
});
export type StaticArtifact = z.infer<typeof StaticArtifact>;

export const ModuleArtifact = z.object({
  size: z.number(),
  hash: z.string(),
  type: z.string(),
  kind: z.enum(["entry-point", "chunk", "asset", "sourcemap", "bytecode"]),
});
export type ModuleArtifact = z.infer<typeof ModuleArtifact>;

export const BuildManifest = z.object({
  entrypoint: z.string(),
  static: z.record(z.string(), StaticArtifact),
  modules: z.record(z.string(), ModuleArtifact),
});
export type BuildManifest = z.infer<typeof BuildManifest>;

export const BuildEnvironment = z.object({
  PROJECT_ID: z.string(),
  DEPLOYMENT_ID: z.string(),

  API_URL: z.string(),
  REPO_FETCH_TOKEN: z.string(),
  DEPLOY_TOKEN: z.string(),

  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_REGION: z.string(),
  S3_BUCKET: z.string(),
  S3_ENDPOINT: z.string(),
  S3_SESSION_TOKEN: z.string(),
});
export type BuildEnvironment = z.infer<typeof BuildEnvironment>;
