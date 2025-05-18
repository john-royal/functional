import { $ } from "bun";
import { mkdir, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { detectPackageManager } from "./lib/package-manager";
// import { env } from "./env";
import type { BuildArtifact as IBuildArtifact } from "@functional/lib/build";
import { sha256 } from "./lib/sha256";
import assert from "node:assert";

const outdir = join(process.cwd(), "build");

interface BuildArtifactProperties {
  name: string;
  path: string;
  size: number;
  hash: string;
  type: string;
}

class BuildArtifactIsDirectoryError extends Error {}

class BuildArtifact implements IBuildArtifact {
  size: number;
  hash: string;
  type: string;

  constructor(private readonly properties: BuildArtifactProperties) {
    this.size = properties.size;
    this.hash = properties.hash;
    this.type = properties.type;
  }

  async toFile(): Promise<File> {
    const file = Bun.file(this.properties.path);
    return new File([await file.bytes()], this.properties.name, {
      type: this.properties.type,
    });
  }

  toJSON(): IBuildArtifact {
    return {
      size: this.size,
      hash: this.hash,
      type: this.type,
    };
  }

  static async from(directory: string, fileName: string) {
    const file = Bun.file(join(directory, fileName));
    const stat = await file.stat();
    if (stat.isDirectory()) {
      throw new BuildArtifactIsDirectoryError();
    }
    const hash = await sha256(await file.bytes());
    return new BuildArtifact({
      name: fileName,
      path: join(directory, fileName),
      size: stat.size,
      hash,
      type: file.type,
    });
  }
}

async function bundleTemplateWorker(template: "static-site") {
  const modulesDir = join(outdir, "modules");
  const bundle = await Bun.build({
    entrypoints: [join(process.cwd(), `src/templates/${template}.ts`)],
    outdir: modulesDir,
    target: "browser",
    minify: true,
  });
  let entrypoint: string | undefined;
  const modules: Record<string, BuildArtifact> = {};
  await Promise.all(
    bundle.outputs.map(async (output) => {
      const name = relative(modulesDir, output.path);
      if (output.kind === "entry-point") {
        assert(entrypoint === undefined, "Multiple entrypoints found");
        entrypoint = name;
      }
      modules[name] = await BuildArtifact.from(modulesDir, name);
    })
  );
  if (!entrypoint) {
    throw new Error("No entrypoint found");
  }
  return {
    entrypoint,
    modules,
  };
}

async function buildStaticSite(dir: string) {
  const packageManager = await detectPackageManager(dir);

  const shell = $.cwd(dir);
  await shell`${packageManager.installCommand}`;
  await shell`${packageManager.packageManager} run build`;

  const outdir = join(dir, "dist");
  const files = await readdir(outdir, { recursive: true });
  const assets: Record<string, BuildArtifact> = {};
  await Promise.all(
    files.map(async (fileName) => {
      const artifact = await BuildArtifact.from(outdir, fileName).catch((e) => {
        if (e instanceof BuildArtifactIsDirectoryError) {
          return null;
        }
        throw e;
      });
      if (artifact) {
        assets[fileName] = artifact;
      }
    })
  );

  return {
    assets,
  };
}

const worker = await bundleTemplateWorker("static-site");
const staticSite = await buildStaticSite(
  join(process.cwd(), "john-royal-functional-test-vite-efe8809")
);
const manifest = {
  ...worker,
  ...staticSite,
};
console.log(JSON.stringify(manifest, null, 2));
