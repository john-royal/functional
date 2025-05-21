import type { AssetManifest } from "@functional/cloudflare-utils/validators";
import { RPCProvider } from "../provider";

export interface WorkerAssetsArgs {
  scriptName: string;
  path: string;
  config?: cloudflare.types.output.WorkersScriptAssetsConfig;
}

export interface WorkerAssetsState extends WorkerAssetsArgs {
  assets: cloudflare.types.output.WorkersScriptAssets;
  manifest: AssetManifest;
}

export class WorkerAssets extends $util.dynamic.Resource {
  declare public readonly id: $util.Output<string>;
  declare public readonly paths: $util.Output<string[]>;
  declare public readonly config: $util.Output<cloudflare.types.input.WorkersScriptAssets>;
  declare public readonly assets: $util.Output<cloudflare.types.output.WorkersScriptAssets>;

  constructor(
    name: string,
    args: WorkerAssetsArgs,
    opts?: $util.CustomResourceOptions
  ) {
    super(
      new RPCProvider("WorkerAssets"),
      name,
      {
        ...args,
        assets: undefined,
      },
      opts
    );
  }
}
