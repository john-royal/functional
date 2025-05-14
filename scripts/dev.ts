import esbuild from "esbuild";
import { Log, LogLevel, Miniflare, type MiniflareOptions } from "miniflare";
import type { FSWatcher } from "node:fs";
import { watch } from "node:fs";
import { join } from "node:path";
import { nodeJsCompatPlugin } from "./nodejs-compat";

const cwd = process.cwd();

class Dev {
  watchers = new Map<string, FSWatcher>();
  miniflare?: Miniflare;

  constructor(
    readonly namespace: string,
    readonly entrypoint: string,
    readonly options: Partial<MiniflareOptions>
  ) {}

  async build() {
    console.log(`[${this.namespace}] build`);
    const result = await esbuild.build({
      entryPoints: [join(cwd, this.entrypoint)],
      outdir: join(cwd, ".dev", this.namespace),
      format: "esm",
      target: "node22",
      conditions: ["workerd", "worker", "browser"],
      platform: "node",
      write: true,
      metafile: true,
      bundle: true,
      plugins: [nodeJsCompatPlugin()],
    });
    const inputs = Object.values(result.metafile.outputs).flatMap((output) =>
      Object.keys(output.inputs)
    );
    for (const input of inputs) {
      if (this.watchers.has(input) || !input.match(/\.(js|mjs|ts)$/)) continue;
      this.watchers.set(
        input,
        watch(input, () => this.build())
      );
    }
    const scriptPath = Object.keys(result.metafile.outputs)[0]!;
    await this.update(scriptPath);
  }

  async update(scriptPath: string) {
    if (this.miniflare) {
      console.log(`[${this.namespace}] update`);
      await this.miniflare.setOptions(this.buildMiniflareOptions(scriptPath));
    } else {
      console.log(`[${this.namespace}] start`);
      this.miniflare = new Miniflare(this.buildMiniflareOptions(scriptPath));
    }
  }

  buildMiniflareOptions(scriptPath: string): MiniflareOptions {
    const persistDir = join(cwd, ".dev", this.namespace, "mf");
    return {
      name: this.namespace,
      scriptPath,
      modules: true,
      compatibilityFlags: ["nodejs_compat"],
      compatibilityDate: "2025-05-01",
      log: new Log(LogLevel.VERBOSE),
      cache: true,
      cachePersist: join(persistDir, "cache"),
      durableObjectsPersist: join(persistDir, "do"),
      kvPersist: join(persistDir, "kv"),
      r2Persist: join(persistDir, "r2"),
      ...this.options,
    } as MiniflareOptions;
  }
}

const api = new Dev("api", "packages/api/src/index.local.ts", {
  port: 8001,
  bindings: {
    HYPERDRIVE: {
      connectionString: process.env.DATABASE_URL!,
    },
  },
});

await api.build();

Bun.spawn(["bun", "run", "dev"], {
  cwd: join(cwd, "packages", "web"),
});
