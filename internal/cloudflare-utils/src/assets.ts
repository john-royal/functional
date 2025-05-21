import { createHash } from "crypto";
import { readdir } from "fs/promises";
import path from "path";
import type { AssetManifest } from "./validators";

export async function readAssets(directory: string) {
  const fileNames = await readdir(directory, {
    recursive: true,
  });
  const manifest: AssetManifest = {};
  const files = new Map<string, Bun.BunFile>();
  await Promise.all(
    fileNames.map(async (name) => {
      const file = Bun.file(path.resolve(directory, name));
      const stat = await file.stat();
      if (stat.isDirectory()) {
        return;
      }
      const hash = createHash("sha256")
        .update(await file.bytes())
        .digest("hex")
        .slice(0, 32);
      name = name.startsWith("/") ? name : `/${name}`; // required by Cloudflare
      manifest[name] = {
        hash,
        size: stat.size,
      };
      files.set(hash, file);
    })
  );
  return {
    manifest,
    files,
  };
}
