import { BuildEnvironment } from "@functional/lib/build";
import assert from "node:assert";
import { readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fetchRepository } from "./fetch-repository";
import { detectPackageManager } from "./lib/package-manager";
import { sha256 } from "./lib/sha256";
import type { AssetManifest, WorkerMetadataInput } from "./lib/validators";

const env = BuildEnvironment.parse(process.env);
const rootdir = os.tmpdir();

console.log("Fetching repository...");

const { repoRoot } = await fetchRepository({
  rootdir,
  apiUrl: env.API_URL,
  token: env.REPO_FETCH_TOKEN,
});

const workdir = path.join(rootdir, repoRoot);
const outdir = path.join(workdir, "dist");

const { packageManager, installCommand } = await detectPackageManager(workdir);

const $ = Bun.$.cwd(workdir);

console.log(`Installing dependencies with ${packageManager}...`);
await $`${installCommand}`;

console.log("Building...");
await $`${packageManager} run build`;

const prepareAssets = async (outdir: string) => {
  const outputs = await readdir(outdir, { recursive: true });
  const manifest: AssetManifest = {};
  const filesByHash = new Map<string, Bun.BunFile>();
  await Promise.all(
    outputs.map(async (fileName) => {
      const filePath = path.join(outdir, fileName);
      const file = Bun.file(filePath);
      const stat = await file.stat();
      if (stat.isDirectory()) {
        return;
      }
      const hash = await sha256(await file.bytes());
      fileName = fileName.startsWith("/") ? fileName : `/${fileName}`;
      manifest[fileName] = {
        hash,
        size: stat.size,
      };
      filesByHash.set(hash, file);
    })
  );
  return {
    manifest,
    getFileForUpload: async (hash: string) => {
      const file = filesByHash.get(hash);
      if (!file) {
        throw new Error(`File with hash ${hash} not found`);
      }
      const bytes = await file.bytes();
      return new File([bytes.toBase64()], hash, {
        type: file.type,
      });
    },
  };
};
let mainModule: string | undefined;
const modules = new Map<string, File>();
console.log("Building modules...");
const modulesDir = path.join(workdir, "modules");
const bundle = await Bun.build({
  entrypoints: [path.join(process.cwd(), "src/templates/static-site.ts")],
  outdir: modulesDir,
  target: "browser",
  minify: true,
});
await Promise.all(
  bundle.outputs.map(async (output) => {
    const file = Bun.file(output.path);
    const filePath = path.relative(modulesDir, output.path);
    if (output.kind === "entry-point") {
      assert(!mainModule, "Multiple entrypoints found");
      mainModule = filePath;
    }
    modules.set(
      filePath,
      new File([await file.bytes()], filePath, {
        type:
          output.kind === "entry-point" || output.kind === "chunk"
            ? "application/javascript+module"
            : output.kind === "sourcemap"
              ? "application/source-map"
              : "application/octet-stream",
      })
    );
  })
);
if (!mainModule) {
  throw new Error("No entry point found");
}

// upload assets
const jwt: string | undefined = undefined;

const metadata: WorkerMetadataInput = {
  main_module: mainModule,
  assets: jwt ? { jwt } : undefined,
  tags: [`project:${env.PROJECT_ID}`, `deployment:${env.DEPLOYMENT_ID}`],
  bindings: jwt
    ? [
        {
          name: "ASSETS",
          type: "assets",
        },
      ]
    : undefined,
};

const formData = new FormData();
formData.append(
  "metadata",
  new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  })
);
for (const [name, file] of modules) {
  formData.append(name, file);
}

const response = await fetch(new URL("/deploy", env.API_URL), {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.DEPLOY_TOKEN}`,
  },
  body: formData,
});
