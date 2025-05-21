import { z } from "zod";

export const WorkersBindingKindAI = z.object({
  name: z.string(),
  type: z.literal("ai"),
});

export const WorkersBindingKindAnalyticsEngine = z.object({
  dataset: z.string(),
  name: z.string(),
  type: z.literal("analytics_engine"),
});

export const WorkersBindingKindAssets = z.object({
  name: z.string(),
  type: z.literal("assets"),
});

export const WorkersBindingKindBrowserRendering = z.object({
  name: z.string(),
  type: z.literal("browser_rendering"),
});

export const WorkersBindingKindD1 = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal("d1"),
});

export const WorkersBindingKindDispatchNamespace = z.object({
  name: z.string(),
  type: z.literal("dispatch_namespace"),
  namespace: z.string(),
  outbound: z.optional(
    z.object({
      params: z.array(z.string()),
      worker: z.object({
        environment: z.string(),
        service: z.string(),
      }),
    })
  ),
});

export const WorkersBindingKindDurableObjectNamespace = z.object({
  name: z.string(),
  type: z.literal("durable_object_namespace"),
  class_name: z.string(),
  environment: z.optional(z.string()),
  namespace_id: z.optional(z.string()),
  script_name: z.optional(z.string()),
});

export const WorkersBindingKindHyperdrive = z.object({
  name: z.string(),
  type: z.literal("hyperdrive"),
  id: z.string(),
});

export const WorkersBindingKindJson = z.object({
  name: z.string(),
  type: z.literal("json"),
  json: z.string(),
});

export const WorkersBindingKindKVNamespace = z.object({
  name: z.string(),
  type: z.literal("kv_namespace"),
  namespace_id: z.string(),
});

export const WorkersBindingKindMTLSCertificate = z.object({
  certificate_id: z.string(),
  name: z.string(),
  type: z.literal("mtls_certificate"),
});

export const WorkersBindingKindPlainText = z.object({
  name: z.string(),
  type: z.literal("plain_text"),
  text: z.string(),
});

export const WorkersBindingKindPipelines = z.object({
  name: z.string(),
  type: z.literal("pipelines"),
  pipeline: z.string(),
});

export const WorkersBindingKindQueue = z.object({
  name: z.string(),
  type: z.literal("queue"),
  queue_name: z.string(),
});

export const WorkersBindingKindR2Bucket = z.object({
  name: z.string(),
  type: z.literal("r2_bucket"),
  bucket_name: z.string(),
});

export const WorkersBindingKindSecretText = z.object({
  name: z.string(),
  type: z.literal("secret_text"),
  text: z.string(),
});

export const WorkersBindingKindService = z.object({
  name: z.string(),
  type: z.literal("service"),
  environment: z.string(),
  service: z.string(),
});

export const WorkersBindingKindTailConsumer = z.object({
  name: z.string(),
  type: z.literal("tail_consumer"),
  service: z.string(),
});

export const WorkersBindingKindVectorize = z.object({
  name: z.string(),
  type: z.literal("vectorize"),
  index_name: z.string(),
});

export const WorkersBindingKindVersionMetadata = z.object({
  name: z.string(),
  type: z.literal("version_metadata"),
});

export const WorkersBindingKindSecretsStoreSecret = z.object({
  name: z.string(),
  type: z.literal("secrets_store_secret"),
  secret_name: z.string(),
  store_id: z.string(),
});

export const WorkersBindingKindSecretKey = z.object({
  name: z.string(),
  type: z.literal("secret_key"),
  algorithm: z.string(),
  format: z.enum(["raw", "pkcs8", "spki", "jwk"]),
  usages: z.array(
    z.enum([
      "encrypt",
      "decrypt",
      "sign",
      "verify",
      "deriveKey",
      "deriveBits",
      "wrapKey",
      "unwrapKey",
    ])
  ),
  key_base64: z.optional(z.string()),
  key_jwk: z.optional(z.string()),
});

export const WorkersBindingKind = z.union([
  WorkersBindingKindAI,
  WorkersBindingKindAnalyticsEngine,
  WorkersBindingKindAssets,
  WorkersBindingKindBrowserRendering,
  WorkersBindingKindD1,
  WorkersBindingKindDispatchNamespace,
  WorkersBindingKindDurableObjectNamespace,
  WorkersBindingKindHyperdrive,
  WorkersBindingKindJson,
  WorkersBindingKindKVNamespace,
  WorkersBindingKindMTLSCertificate,
  WorkersBindingKindPlainText,
  WorkersBindingKindPipelines,
  WorkersBindingKindQueue,
  WorkersBindingKindR2Bucket,
  WorkersBindingKindSecretText,
  WorkersBindingKindService,
  WorkersBindingKindTailConsumer,
  WorkersBindingKindVectorize,
  WorkersBindingKindVersionMetadata,
  WorkersBindingKindSecretsStoreSecret,
  WorkersBindingKindSecretKey,
]);
export type WorkersBindingKind = z.infer<typeof WorkersBindingKind>;
