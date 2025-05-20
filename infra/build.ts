import { readFile } from "fs/promises";
import { RPCProvider } from "./rpc/provider";

export interface BuildResourceInputs {
  name: string;
  entry: string;
  outdir: string;
}

export interface BuildResourceOutputs extends BuildResourceInputs {
  scriptPath: string;
  manifest: Record<string, string>;
}

export class Build extends $util.dynamic.Resource {
  declare public readonly id: $util.Output<string>;
  declare public readonly entry: $util.Output<string>;
  declare public readonly outdir: $util.Output<string>;
  declare public readonly scriptPath: $util.Output<string>;
  declare public readonly manifest: $util.Output<Record<string, string>>;

  constructor(
    name: string,
    args: BuildResourceInputs,
    opts?: $util.CustomResourceOptions
  ) {
    super(
      new RPCProvider<BuildResourceInputs, BuildResourceOutputs>("build"),
      name,
      { ...args, scriptPath: undefined, manifest: undefined },
      opts
    );
  }
}
