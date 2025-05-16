import esbuild from "esbuild";
import type { WorkerOptions } from "miniflare";
import type { FSWatcher } from "node:fs";
import { watch } from "node:fs";
import { join } from "node:path";
import { nodeJsCompatPlugin } from "./nodejs-compat-plugin";

export interface BuildControllerOptions {
  name: string;
  entrypoint: string;
  cwd: string;
  worker: Partial<WorkerOptions>;
  onUpdate: (workerOptions: WorkerOptions) => void;
}

export class BuildController {
  watchers = new Map<string, FSWatcher>();

  constructor(readonly options: BuildControllerOptions) {}

  async init(): Promise<WorkerOptions> {
    return await this.build();
  }

  async build() {
    console.log(`[${this.options.name}] build`);

    const result = await esbuild.build({
      entryPoints: [join(this.options.cwd, this.options.entrypoint)],
      outdir: join(this.options.cwd, ".dev", this.options.name),
      format: "esm",
      target: "node22",
      conditions: ["workerd", "worker", "browser"],
      platform: "node",
      write: true,
      metafile: true,
      bundle: true,
      external: ["cloudflare:workers"],
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true,
      plugins: [nodeJsCompatPlugin()],
    });

    this.watchInputFiles(result.metafile);

    return this.createMiniflareOptions(result.metafile);
  }

  async rebuild() {
    const result = await this.build();
    this.options.onUpdate(result);
  }

  watchInputFiles(metafile: esbuild.Metafile) {
    const inputs = Object.values(metafile.outputs).flatMap((output) =>
      Object.keys(output.inputs)
    );
    for (const input of inputs) {
      if (this.watchers.has(input) || !input.match(/\.(js|mjs|ts)$/)) continue;
      this.watchers.set(
        input,
        watch(input, () => this.rebuild())
      );
    }
  }

  createMiniflareOptions(metafile: esbuild.Metafile): WorkerOptions {
    const scriptPath = Object.keys(metafile.outputs)[0];
    if (!scriptPath) {
      throw new Error("No script path found");
    }

    return {
      name: this.options.name,
      scriptPath,
      modules: true,
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-01",
      ...this.options.worker,
    } as WorkerOptions;
  }
}
