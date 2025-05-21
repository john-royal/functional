import type {
  AssetManifest,
  WorkerMetadataInput,
  WorkerMetadataOutput,
  WorkersBindingKind,
} from "@functional/cloudflare-utils/validators";
import { RPCProvider } from "../provider";

export interface WorkerScriptProps {
  name: string;
  files: {
    name: string;
    content: string;
    type: string;
  }[];
  options: WorkerMetadataInput;
}

export interface WorkerScriptState extends Partial<WorkerScriptProps> {
  worker: WorkerMetadataOutput;
}

export class WorkerScript extends $util.dynamic.Resource {
  declare public readonly worker: $util.Output<WorkerMetadataOutput>;

  constructor(
    name: string,
    props: WorkerScriptProps,
    opts?: $util.CustomResourceOptions
  ) {
    super(
      new RPCProvider<WorkerScriptProps, WorkerScriptState>("WorkerScript"),
      name,
      {
        ...props,
      },
      opts
    );
  }
}
