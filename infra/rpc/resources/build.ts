import { RPCProvider } from "../provider";

export interface BuildResourceInputs {
  name: string;
  entry: string;
  outdir: string;
}

export interface BuildResourceOutputs extends BuildResourceInputs {
  path: string;
  files: Record<string, string>;
}

export class Build extends $util.dynamic.Resource {
  declare public readonly id: $util.Output<string>;
  declare public readonly entry: $util.Output<string>;
  declare public readonly outdir: $util.Output<string>;
  declare public readonly path: $util.Output<string>;
  declare public readonly files: $util.Output<Record<string, string>>;

  constructor(
    name: string,
    args: BuildResourceInputs,
    opts?: $util.CustomResourceOptions
  ) {
    super(
      new RPCProvider<BuildResourceInputs, BuildResourceOutputs>("build"),
      name,
      { ...args, path: undefined, files: undefined },
      opts
    );
  }
}
