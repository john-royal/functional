import { createHash } from "crypto";
import { readdir } from "fs/promises";
import path from "path";
import type { WorkerAssetsArgs, WorkerAssetsState } from "../../worker-assets";

interface CloudflareResponse<T> {
  success: boolean;
  errors?: {
    code: string;
    message: string;
  }[];
  messages?: unknown[];
  result?: T;
}

type AssetsManifest = Record<
  string,
  {
    hash: string;
    size: number;
  }
>;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!accountId) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID is not set");
}

type CreateAssetsUploadSessionResponse =
  | {
      jwt?: string;
      buckets?: string[][];
    }
  | undefined;

async function createAssetsUploadSession(
  scriptName: string,
  manifest: AssetsManifest
): Promise<CreateAssetsUploadSessionResponse> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN is not set");
  }
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}/assets-upload-session`,
    {
      method: "POST",
      body: JSON.stringify({ manifest }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const json =
    (await response.json()) as CloudflareResponse<CreateAssetsUploadSessionResponse>;
  if (!json.success) {
    throw new Error(
      json.errors?.[0]?.message ?? "Failed to create assets upload session"
    );
  }
  return json.result;
}

const prepareAssets = async (outdir: string) => {
  const outputs = await readdir(outdir, { recursive: true });
  const manifest: AssetsManifest = {};
  const filesByHash = new Map<string, Bun.BunFile>();
  await Promise.all(
    outputs.map(async (fileName) => {
      const filePath = path.join(outdir, fileName);
      const file = Bun.file(filePath);
      const stat = await file.stat();
      if (stat.isDirectory()) {
        return;
      }
      const hash = createHash("sha256")
        .update(await file.bytes())
        .digest("hex")
        .slice(0, 32);
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

async function uploadAssets(
  uploadSession: CreateAssetsUploadSessionResponse,
  getFileForUpload: (hash: string) => Promise<File>
) {
  let completionToken = uploadSession?.jwt;
  if (!uploadSession || !uploadSession.jwt || !uploadSession.buckets) {
    return completionToken;
  }
  await Promise.all(
    uploadSession.buckets.map(async (bucket) => {
      const formData = new FormData();
      for (const file of bucket) {
        formData.append(file, await getFileForUpload(file));
      }
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/assets/upload?base64=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${uploadSession.jwt}`,
          },
          body: formData,
        }
      );
      const json = (await response.json()) as CloudflareResponse<{
        jwt?: string;
      }>;
      if (!json.success) {
        throw new Error(json.errors?.[0]?.message ?? "Failed to upload assets");
      }
      if (json.result?.jwt) {
        completionToken = json.result.jwt;
      }
    })
  );
  return completionToken;
}

export class WorkerAssetsProvider
  implements $util.dynamic.ResourceProvider<WorkerAssetsArgs, WorkerAssetsState>
{
  async create(
    args: WorkerAssetsArgs
  ): Promise<$util.dynamic.CreateResult<WorkerAssetsState>> {
    const { manifest, getFileForUpload } = await prepareAssets(args.path);
    const uploadSession = await createAssetsUploadSession(
      args.scriptName,
      manifest
    );
    const completionToken = await uploadAssets(uploadSession, getFileForUpload);
    return {
      id: args.scriptName + "-assets",
      outs: {
        scriptName: args.scriptName,
        path: args.path,
        manifest,
        assets: {
          jwt: completionToken ?? uploadSession?.jwt,
          config: args.config,
        },
      },
    };
  }

  async update(
    id: $util.ID,
    olds: WorkerAssetsState,
    news: WorkerAssetsArgs
  ): Promise<$util.dynamic.UpdateResult<WorkerAssetsState>> {
    const { outs } = await this.create(news);
    return {
      outs,
    };
  }

  async diff(
    id: $util.ID,
    olds: WorkerAssetsState,
    news: WorkerAssetsArgs
  ): Promise<$util.dynamic.DiffResult> {
    if (
      olds.path !== news.path ||
      olds.scriptName !== news.scriptName ||
      !Bun.deepEquals(olds.config, news.config)
    ) {
      return {
        changes: true,
      };
    }
    const { manifest: newManifest } = await prepareAssets(news.path);
    if (Bun.deepEquals(olds.manifest, newManifest)) {
      return {
        changes: false,
      };
    }
    return {
      changes: true,
    };
  }
}
