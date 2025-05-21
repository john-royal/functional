import { z } from "zod";
import { WorkersBindingKind } from "./bindings";
import { WorkerAssetsInput } from "./assets";

const MigrationStep = z.object({
  deleted_classes: z.optional(z.array(z.string())),
  new_classes: z.optional(z.array(z.string())),
  new_sqlite_classes: z.optional(z.array(z.string())),
  renamed_classes: z.optional(
    z.array(
      z.object({
        from: z.optional(z.string()),
        to: z.optional(z.string()),
      })
    )
  ),
  transferred_classes: z.optional(
    z.array(
      z.object({
        from: z.optional(z.string()),
        from_script: z.optional(z.string()),
        to: z.optional(z.string()),
      })
    )
  ),
});

export const SingleStepMigration = MigrationStep.extend({
  new_tag: z.optional(z.string()),
  old_tag: z.optional(z.string()),
});
export type SingleStepMigration = z.infer<typeof SingleStepMigration>;

const MultipleStepMigration = z.object({
  new_tag: z.optional(z.string()),
  old_tag: z.optional(z.string()),
  steps: z.array(SingleStepMigration),
});

const SmartPlacement = z.object({
  last_analyzed_at: z.optional(z.string()),
  mode: z.optional(z.literal("smart")),
  status: z.optional(
    z.enum(["SUCCESS", "UNSUPPORTED_APPLICATION", "INSUFFICIENT_INVOCATIONS"])
  ),
});

const ConsumerScript = z.object({
  service: z.string(),
  environment: z.optional(z.string()),
  namespace: z.optional(z.string()),
});

export const WorkerMetadataInput = z.object({
  assets: z.optional(WorkerAssetsInput),
  bindings: z.optional(z.array(WorkersBindingKind)),
  body_part: z.optional(z.string()),
  compatibility_date: z.optional(z.string()),
  compatibility_flags: z.optional(z.array(z.string())),
  keep_assets: z.optional(z.boolean()),
  keep_bindings: z.optional(z.array(z.string())),
  logpush: z.optional(z.boolean()),
  main_module: z.optional(z.string()),
  migrations: z.optional(z.union([SingleStepMigration, MultipleStepMigration])),
  observability: z.optional(
    z.object({
      enabled: z.boolean(),
      head_sampling_rate: z.optional(z.number()),
    })
  ),
  placement: z.optional(SmartPlacement),
  tags: z.optional(z.array(z.string())),
  tail_consumers: z.optional(z.array(ConsumerScript)),
  usage_model: z.optional(z.literal("standard")),
});
export type WorkerMetadataInput = z.infer<typeof WorkerMetadataInput>;

export const WorkerMetadataOutput = z.object({
  id: z.optional(z.string()),
  created_on: z.optional(z.string()),
  etag: z.optional(z.string()),
  has_assets: z.optional(z.boolean()),
  has_modules: z.optional(z.boolean()),
  logpush: z.optional(z.boolean()),
  modified_on: z.optional(z.string()),
  placement: z.optional(SmartPlacement),
  startup_time_ms: z.optional(z.number()),
  tail_consumers: z.nullable(z.array(ConsumerScript)),
  usage_model: z.optional(z.literal("standard")),
});
export type WorkerMetadataOutput = z.infer<typeof WorkerMetadataOutput>;
