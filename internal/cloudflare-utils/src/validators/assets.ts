import { z } from "zod";

export const AssetManifest = z.record(
  z.string().startsWith("/"),
  z.object({
    hash: z.string().max(32),
    size: z.number(),
  })
);
export type AssetManifest = z.infer<typeof AssetManifest>;

export const WorkerAssetsConfig = z.object({
  _headers: z.optional(z.string()),
  _redirects: z.optional(z.string()),
  html_handling: z.optional(
    z.enum([
      "auto-trailing-slash",
      "force-trailing-slash",
      "drop-trailing-slash",
      "none",
    ])
  ),
  not_found_handling: z.optional(
    z.enum(["none", "404-page", "single-page-application"])
  ),
  run_worker_first: z.optional(z.boolean()),
  serve_directly: z.optional(z.boolean()),
});
export type WorkerAssetsConfig = z.infer<typeof WorkerAssetsConfig>;

export const WorkerAssetsInput = z.object({
  jwt: z.optional(z.string()),
  config: z.optional(WorkerAssetsConfig),
});
export type WorkerAssetsInput = z.infer<typeof WorkerAssetsInput>;

export const AssetsUploadSession = z.object({
  jwt: z.string(),
  buckets: z.array(z.array(z.string())),
});
export type AssetsUploadSession = z.infer<typeof AssetsUploadSession>;
