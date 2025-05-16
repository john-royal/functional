import {
  Miniflare,
  type MiniflareOptions,
  type WorkerOptions,
} from "miniflare";
import { join } from "node:path";
import { BuildController, type BuildControllerOptions } from "./build";

interface MiniflareWorkerOptions
  extends Omit<BuildControllerOptions, "cwd" | "onUpdate"> {
  port: number;
}

interface MiniflareControllerOptions {
  cwd: string;
  workers: MiniflareWorkerOptions[];
}

export class MiniflareController {
  buildControllers = new Map<string, BuildController>();
  workerOptions = new Map<string, WorkerOptions>();
  servers = new Map<string, Bun.Server>();
  workers = new Map<string, Awaited<ReturnType<Miniflare["getWorker"]>>>();
  miniflarePromise = Promise.withResolvers<Miniflare>();
  miniflare?: Miniflare;

  constructor(readonly options: MiniflareControllerOptions) {
    for (const { port, ...worker } of options.workers) {
      const build = new BuildController({
        ...worker,
        cwd: options.cwd,
        onUpdate: (workerOptions) => {
          this.update(worker.name, workerOptions);
        },
      });
      this.buildControllers.set(worker.name, build);
      this.servers.set(worker.name, this.createProxyServer(worker.name, port));
    }
  }

  async init() {
    await Promise.all(
      Array.from(this.buildControllers.entries()).map(async ([name, build]) =>
        this.workerOptions.set(name, await build.init())
      )
    );
    this.miniflare = new Miniflare(this.createMiniflareOptions());
    await this.miniflare.ready;
    this.miniflarePromise.resolve(this.miniflare);
    for (const [name, server] of this.servers.entries()) {
      console.log(`[${name}] listening on ${server.url}`);
    }
  }

  async update(name: string, workerOptions: WorkerOptions) {
    if (!this.miniflare) {
      throw new Error("Worker updated, but Miniflare not initialized");
    }
    this.workerOptions.set(name, workerOptions);
    await this.miniflare.setOptions(this.createMiniflareOptions());
    this.workers.delete(name);
    console.log(`[${name}] updated`);
  }

  createProxyServer(name: string, port: number) {
    const resolveWorker = async () => {
      const cachedWorker = this.workers.get(name);
      if (cachedWorker) {
        return cachedWorker;
      }
      const miniflare = this.miniflare ?? (await this.miniflarePromise.promise);
      const worker = await miniflare.getWorker(name);
      this.workers.set(name, worker);
      return worker;
    };
    return Bun.serve({
      port,
      fetch: async (req) => {
        const worker = await resolveWorker();
        const res = await worker.fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        return res as unknown as Response;
      },
    });
  }

  createMiniflareOptions(): MiniflareOptions {
    return {
      workers: Array.from(this.workerOptions.values()),
      cachePersist: join(this.options.cwd, ".dev", "mf", "cache"),
      durableObjectsPersist: join(this.options.cwd, ".dev", "mf", "do"),
      kvPersist: join(this.options.cwd, ".dev", "mf", "kv"),
      r2Persist: join(this.options.cwd, ".dev", "mf", "r2"),
    };
  }
}
