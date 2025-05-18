import { fetchRepository } from "./fetch-repository";
import path from "node:path";
import { detectPackageManager } from "./lib/package-manager";
import { readdir } from "node:fs/promises";
import type { BuildManifest } from "@functional/lib/build";
import { sha256 } from "./lib/sha256";
import assert from "node:assert";
import { BuildEnvironment } from "@functional/lib/build";
import os from "node:os";

const env = BuildEnvironment.parse(process.env);

console.log("Environment", env);

const rootdir = os.tmpdir();

const { repoRoot } = await fetchRepository({
  rootdir,
  apiUrl: env.API_URL,
  token: env.REPO_FETCH_TOKEN,
});

const workdir = path.join(rootdir, repoRoot);
const outdir = path.join(workdir, "dist");

const s3 = new Bun.S3Client({
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  bucket: env.S3_BUCKET,
  endpoint: env.S3_ENDPOINT,
  sessionToken: env.S3_SESSION_TOKEN,
  region: env.S3_REGION,
});
const s3Prefix = `${env.PROJECT_ID}/${env.DEPLOYMENT_ID}`;

const packageManager = await detectPackageManager(workdir);

const $ = Bun.$.cwd(workdir);
await $`${packageManager.installCommand}`;
await $`${packageManager.packageManager} run build`;

const manifest: BuildManifest = {
  entrypoint: "",
  static: {},
  modules: {},
};

const outputs = await readdir(outdir, { recursive: true });
await Promise.all(
  outputs.map(async (fileName) => {
    const filePath = path.join(outdir, fileName);
    const file = Bun.file(filePath);
    const stat = await file.stat();
    if (stat.isDirectory()) {
      return;
    }
    const [hash] = await Promise.all([
      file.bytes().then(sha256),
      s3.write(`${s3Prefix}/static/${fileName}`, file),
    ]);
    manifest.static[fileName] = {
      size: stat.size,
      hash,
      type: file.type,
    };
  })
);

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
    const [{ hash, size }] = await Promise.all([
      file.bytes().then(async (bytes) => ({
        hash: await sha256(bytes),
        size: bytes.length,
      })),
      s3.write(`${s3Prefix}/modules/${filePath}`, file),
    ]);
    manifest.modules[filePath] = {
      hash,
      size,
      type: file.type,
      kind: output.kind,
    };
    if (output.kind === "entry-point") {
      assert(!manifest.entrypoint, "Multiple entrypoints found");
      manifest.entrypoint = filePath;
    }
  })
);

await s3.write(`${s3Prefix}/build-manifest.json`, Response.json(manifest));

console.log("Sending manifest to API...");
const response = await fetch(new URL("/deploy", env.API_URL), {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.DEPLOY_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ manifest }),
});
console.log("API response", response.status);
