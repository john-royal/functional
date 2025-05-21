import {
  AssetsUploadSession,
  WorkerMetadataOutput,
  type AssetManifest,
  type WorkerMetadataInput,
} from "./validators";

interface CloudflareClientOptions {
  baseUrl?: string;
  accountId: string;
  apiToken: string;
}

interface CloudflareErrorResponse {
  success: false;
  errors: {
    code: string;
    message: string;
  }[];
  messages?: unknown[];
}

interface CloudflareSuccessResponse<T> {
  success: true;
  errors?: {
    code: string;
    message: string;
  }[];
  messages?: unknown[];
  result: T;
}

type CloudflareResponse<T> =
  | CloudflareErrorResponse
  | CloudflareSuccessResponse<T>;

interface CreateAssetsUploadSessionInput {
  scriptName: string;
  manifest: AssetManifest;
  dispatchNamespace?: string;
}

interface PutWorkerInput {
  scriptName: string;
  dispatchNamespace?: string;
  metadata: WorkerMetadataInput;
  files: {
    name: string;
    content: string;
    type: string;
  }[];
}

export class CloudflareClient {
  private readonly baseUrl: string;
  readonly accountId: string;
  private readonly apiToken: string;

  constructor(options: CloudflareClientOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.cloudflare.com/client/v4";
    this.accountId = options.accountId;
    this.apiToken = options.apiToken;
  }

  async createAssetsUploadSession({
    scriptName,
    manifest,
    dispatchNamespace,
  }: CreateAssetsUploadSessionInput) {
    return await this.fetch<Partial<AssetsUploadSession> | undefined>(
      dispatchNamespace
        ? `/accounts/${this.accountId}/workers/dispatch/namespaces/${dispatchNamespace}/scripts/${scriptName}/assets-upload-session`
        : `/accounts/${this.accountId}/workers/scripts/${scriptName}/assets-upload-session`,
      {
        method: "POST",
        body: JSON.stringify({ manifest }),
      }
    );
  }

  async uploadAssets(
    session: AssetsUploadSession,
    files: Map<string, Bun.BunFile>
  ) {
    let completionToken = session.jwt;
    await Promise.all(
      session.buckets.map(async (bucket) => {
        const formData = new FormData();
        await Promise.all(
          bucket.map(async (hash) => {
            const file = files.get(hash);
            if (!file) {
              throw new Error(`File with hash ${hash} not found`);
            }
            const data = await file.bytes();
            formData.append(
              hash,
              new File([data.toBase64()], hash, {
                type: file.type,
              })
            );
          })
        );
        const res = await this.fetch<{
          jwt?: string;
        }>(`/accounts/${this.accountId}/workers/assets/upload?base64=true`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.jwt}`,
          },
          body: formData,
        });
        if (res.jwt) {
          completionToken = res.jwt;
        }
      })
    );
    return completionToken;
  }

  async getWorker(input: { scriptName: string; dispatchNamespace?: string }) {
    return await this.fetch<WorkerMetadataOutput>(
      input.dispatchNamespace
        ? `/accounts/${this.accountId}/workers/dispatch/namespaces/${input.dispatchNamespace}/scripts/${input.scriptName}`
        : `/accounts/${this.accountId}/workers/scripts/${input.scriptName}`,
      {
        method: "GET",
      }
    );
  }

  async putWorker({
    scriptName,
    dispatchNamespace,
    metadata,
    files,
  }: PutWorkerInput) {
    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      })
    );
    for (const file of files) {
      formData.append(file.name, new Blob([file.content], { type: file.type }));
    }
    return await this.fetch<WorkerMetadataOutput>(
      dispatchNamespace
        ? `/accounts/${this.accountId}/workers/dispatch/namespaces/${dispatchNamespace}/scripts/${scriptName}`
        : `/accounts/${this.accountId}/workers/scripts/${scriptName}`,
      {
        method: "PUT",
        body: formData,
      }
    );
  }

  async deleteWorker(input: {
    scriptName: string;
    dispatchNamespace?: string;
  }) {
    return await this.fetch<void>(
      input.dispatchNamespace
        ? `/accounts/${this.accountId}/workers/dispatch/namespaces/${input.dispatchNamespace}/scripts/${input.scriptName}`
        : `/accounts/${this.accountId}/workers/scripts/${input.scriptName}`,
      {
        method: "DELETE",
      }
    );
  }

  async fetch<T>(path: `/${string}`, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        ...options.headers,
      },
    });
    const json = (await res.json()) as CloudflareResponse<T>;
    if (!json.success) {
      console.log({
        url,
        status: res.status,
        statusText: res.statusText,
        json,
      });
      throw new Error(
        `Cloudflare API error (${res.status}) ${json.errors.map((e) => `${e.code}: ${e.message}`).join(", ")}`
      );
    }
    return json.result;
  }
}
