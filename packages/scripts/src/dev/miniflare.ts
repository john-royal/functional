import {
  Log,
  LogLevel,
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
  mutex = new Mutex();
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
    await this.mutex.runExclusive(async () => {
      await Promise.all(
        Array.from(this.buildControllers.entries()).map(async ([name, build]) =>
          this.workerOptions.set(name, await build.init())
        )
      );
      await this.create();
      for (const [name, server] of this.servers.entries()) {
        console.log(`[${name}] listening on ${server.url}`);
      }
    });
  }

  async update(name: string, workerOptions: WorkerOptions) {
    if (!this.miniflare) {
      throw new Error("Worker updated, but Miniflare not initialized");
    }
    this.workerOptions.set(name, workerOptions);
    console.log(`[${name}] updating`);
    await this.mutex.runExclusive(async () => {
      await this.create();
    });
  }

  async create() {
    await this.dispose();
    this.miniflare = new Miniflare(this.createMiniflareOptions());
    await this.miniflare.ready;
    this.miniflarePromise.resolve(this.miniflare);
  }

  private async dispose() {
    if (this.miniflare) {
      const miniflare = this.miniflare;
      this.workers.clear();
      this.miniflarePromise = Promise.withResolvers<Miniflare>();
      this.miniflare = undefined;
      await miniflare.dispose();
    }
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
      log: new Log(LogLevel.VERBOSE),
      workers: Array.from(this.workerOptions.values()),
      cachePersist: join(this.options.cwd, ".dev", "mf", "cache"),
      durableObjectsPersist: join(this.options.cwd, ".dev", "mf", "do"),
      kvPersist: join(this.options.cwd, ".dev", "mf", "kv"),
      r2Persist: join(this.options.cwd, ".dev", "mf", "r2"),
    };
  }
}

class Mutex {
  private locked = false;
  private queue = Promise.resolve();

  async acquire() {
    await this.queue;
    this.locked = true;
    const { promise, resolve } = Promise.withResolvers<void>();
    this.queue = promise;
    return resolve;
  }

  async runExclusive<T>(fn: () => Promise<T>) {
    const release = await this.acquire();
    try {
      return await fn();
    } catch (error) {
      console.error(`[Mutex] runExclusive failed`, error);
      throw error;
    } finally {
      release();
    }
  }
}
