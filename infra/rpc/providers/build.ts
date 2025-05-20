import { rm } from "fs/promises";
import { watch, type FSWatcher } from "fs";
import type { BuildResourceInputs, BuildResourceOutputs } from "../../build";
import { createHash } from "crypto";
import { join } from "path";
import esbuild from "esbuild";

const cwd = join(__dirname, "../../..");

const watchers = new Map<string, FSWatcher>();

export class BuildProvider
  implements
    $util.dynamic.ResourceProvider<BuildResourceInputs, BuildResourceOutputs>
{
  async create(
    inputs: BuildResourceInputs
  ): Promise<$util.dynamic.CreateResult<BuildResourceOutputs>> {
    const entry = join(cwd, inputs.entry);
    const outdir = join(cwd, inputs.outdir);
    const bundle = await buildWorker(entry, outdir);
    const manifest = await generateOutputManifest(bundle);
    return {
      id: inputs.name,
      outs: {
        ...inputs,
        ...manifest,
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
      return { changes: true, replaces: ["entry", "outdir"] };
    }
    const manifest = await diffManifest(props.manifest);
    return { changes: manifest.changes };
  }

  async update(
    id: string,
    props: BuildResourceOutputs,
    news: BuildResourceInputs
  ): Promise<$util.dynamic.UpdateResult<BuildResourceOutputs>> {
    const entry = join(cwd, news.entry);
    const outdir = join(cwd, news.outdir);
    const bundle = await buildWorker(entry, outdir);
    const manifest = await generateOutputManifest(bundle);
    return {
      outs: {
        ...news,
        ...manifest,
      },
    };
  }

  async delete(id: string, props: BuildResourceOutputs): Promise<void> {
    const outdir = join(cwd, props.outdir);
    await rm(outdir, { recursive: true }).catch(() => {});
  }
}

async function buildWorker(
  entry: string,
  outdir: string
): Promise<esbuild.BuildResult> {
  const { nodeJsCompatPlugin } = await import(
    "../../../packages/scripts/src/dev/nodejs-compat-plugin"
  );
  return await esbuild.build({
    entryPoints: [entry],
    outdir,
    format: "esm",
    target: "node22",
    conditions: ["workerd", "worker", "browser"],
    platform: "node",
    bundle: true,
    metafile: true,
    write: true,
    external: ["cloudflare:workers"],
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    plugins: [nodeJsCompatPlugin()],
  });
}

async function diffManifest(
  manifest: Record<string, string>
): Promise<{ changes: boolean }> {
  let changes = false;
  await Promise.all(
    Object.entries(manifest).map(async ([filePath, hash]) => {
      const newHash = await hashFile(filePath);
      if (newHash !== hash) {
        changes = true;
      }
    })
  );
  return { changes };
}

async function generateOutputManifest(result: esbuild.BuildResult): Promise<{
  scriptPath: string;
  manifest: Record<string, string>;
}> {
  const manifestResults = await Promise.allSettled(
    Object.values(result.metafile!.outputs)
      .flatMap((output) => Object.keys(output.inputs))
      .map(async (filePath) => [filePath, await hashFile(filePath)])
  );
  const manifest = Object.fromEntries(
    manifestResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
  );
  return {
    scriptPath: Object.keys(result.metafile!.outputs)[0]!,
    manifest,
  };
}

async function hashFile(path: string): Promise<string> {
  const file = await Bun.file(path).text();
  if (!watchers.has(path)) {
    watchers.set(
      path,
      watch(path, async () => {
        await touchFile(join(cwd, "sst.config.ts"));
      })
    );
  }
  return createHash("sha256").update(file).digest("hex");
}

async function touchFile(path: string) {
  const file = Bun.file(path);
  await file.write(await file.text());
}
