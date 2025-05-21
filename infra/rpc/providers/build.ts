import { build, haveFilesChanged } from "@functional/cloudflare-utils/esbuild";
import { rm } from "fs/promises";
import { join } from "path";
import type {
  BuildResourceInputs,
  BuildResourceOutputs,
} from "../resources/build";
import { cwd } from "./common";

export class BuildProvider
  implements
    $util.dynamic.ResourceProvider<BuildResourceInputs, BuildResourceOutputs>
{
  async create(
    inputs: BuildResourceInputs
  ): Promise<$util.dynamic.CreateResult<BuildResourceOutputs>> {
    const entry = join(cwd, inputs.entry);
    const outdir = join(cwd, inputs.outdir);
    const bundle = await build(entry, outdir);
    return {
      id: inputs.name,
      outs: {
        ...inputs,
        path: bundle.entry,
        files: bundle.files,
      },
    };
  }

  async read(
    id: string,
    props?: BuildResourceOutputs
  ): Promise<$util.dynamic.ReadResult<BuildResourceOutputs>> {
    return { id, props };
  }

  async diff(
    id: string,
    props: BuildResourceOutputs,
    news: BuildResourceInputs
  ): Promise<$util.dynamic.DiffResult> {
    if (props.entry !== news.entry || props.outdir !== news.outdir) {
      return {
        changes: true,
        replaces: ["entry", "outdir"],
        deleteBeforeReplace: false,
      };
    }
    const changes = await haveFilesChanged(props.outdir, props.files);
    if (changes) {
      return { changes: true, deleteBeforeReplace: false };
    }
    const scriptPath = join(cwd, props.path);
    if (!(await Bun.file(scriptPath).exists())) {
      return {
        changes: true,
        deleteBeforeReplace: false,
      };
    }
    return { changes: false, deleteBeforeReplace: false };
  }

  async update(
    id: string,
    props: BuildResourceOutputs,
    news: BuildResourceInputs
  ): Promise<$util.dynamic.UpdateResult<BuildResourceOutputs>> {
    const { outs } = await this.create(news);
    return {
      outs,
    };
  }

  async delete(id: string, props: BuildResourceOutputs): Promise<void> {
    const outdir = join(cwd, props.outdir);
    await rm(outdir, { recursive: true }).catch(() => {});
  }
}
