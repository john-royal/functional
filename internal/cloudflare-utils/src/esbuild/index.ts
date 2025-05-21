import { join } from "path";
import { nodeJsCompatPlugin } from "./nodejs-compat-plugin";
import esbuild from "esbuild";
import { createHash } from "crypto";

export async function build(entry: string, outdir: string) {
  const result = await esbuild.build({
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
  return {
    entry: Object.keys(result.metafile.outputs)[0]!,
    files: await traceFiles(outdir, result.metafile),
  };
}

export async function haveFilesChanged(
  outdir: string,
  files: Record<string, string> = {}
) {
  let changes = false;
  await Promise.all(
    Object.entries(files).map(async ([fileName, hash]) => {
      const file = Bun.file(join(outdir, fileName));
      if (!(await file.exists())) {
        changes = true;
        return;
      }
      const newHash = createHash("sha256")
        .update(await file.text())
        .digest("hex");
      if (newHash !== hash) {
        changes = true;
      }
    })
  );
  return changes;
}

async function traceFiles(outdir: string, metafile: esbuild.Metafile) {
  const manifest: Record<string, string> = {};
  const files = Object.values(metafile.outputs).flatMap((output) =>
    Object.keys(output.inputs)
  );
  await Promise.all(
    files.map(async (fileName) => {
      const file = Bun.file(join(outdir, fileName));
      if (await file.exists()) {
        manifest[fileName] = createHash("sha256")
          .update(await file.text())
          .digest("hex");
      }
    })
  );
  return manifest;
}
