import { z } from "zod";
import type { Env } from "./env";

interface GenerateR2CredentialsInput {
  /** The name of the R2 bucket. */
  bucket: string;
  /** The parent access key id to use for signing. */
  parentAccessKeyId: string;
  /** Permissions allowed on the credentials. */
  permission:
    | "admin-read-write"
    | "admin-read-only"
    | "object-read-write"
    | "object-read-only";
  /** How long the credentials will live for in seconds. */
  ttlSeconds?: number;
  /** Optional object paths to scope the credentials to. */
  objects?: string[];
  /** Optional prefix paths to scope the credentials to. */
  prefixes?: string[];
}

const CloudflareError = z.object({
  code: z.number(),
  message: z.string(),
  documentation_url: z.string().optional(),
  source: z.object({ pointer: z.string().optional() }).optional(),
});

const CloudflareErrorResponse = z.object({
  errors: z.array(CloudflareError),
  messages: z.array(z.string()).optional(),
  success: z.literal(false),
});
const CloudflareSuccessResponse = <T>(result: z.ZodType<T>) =>
  z.object({
    result,
    success: z.literal(true),
  });

export class Cloudflare {
  constructor(private readonly env: Env) {}

  async generateR2Credentials(input: GenerateR2CredentialsInput) {
    console.log(`[Cloudflare] generateR2Credentials`, "requesting");
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.env.CF_ACCOUNT_ID}/r2/temp-access-credentials`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );
    console.log(`[Cloudflare] generateR2Credentials`, {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
    });
    return this.handleCloudflareResponse(
      res,
      "Failed to generate R2 credentials",
      z.object({
        accessKeyId: z.string(),
        secretAccessKey: z.string(),
        sessionToken: z.string(),
      })
    );
  }

  async createAssetUploadSession(
    scriptName: string,
    manifest: Record<
      string,
      {
        hash: string;
        size: number;
      }
    >
  ) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.env.CF_ACCOUNT_ID}/workers/dispatch/namespaces/${this.env.CF_DISPATCH_NAMESPACE}/scripts/${scriptName}/assets-upload-session`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ manifest }),
      }
    );
    return this.handleCloudflareResponse(
      res,
      "Failed to create asset upload session",
      z
        .object({
          jwt: z.string().optional(),
          buckets: z.array(z.array(z.string())).optional(),
        })
        .optional()
    );
  }

  async uploadAssets(jwt: string, formData: FormData) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.env.CF_ACCOUNT_ID}/workers/assets/upload?base64=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      }
    );
    return this.handleCloudflareResponse(
      res,
      "Failed to upload asset",
      z.object({
        jwt: z.string().optional(),
      })
    );
  }

  async putWorkerScript(name: string, data: FormData) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.env.CF_ACCOUNT_ID}/workers/dispatch/namespaces/${this.env.CF_DISPATCH_NAMESPACE}/scripts/${name}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.env.CF_API_TOKEN}`,
        },
        body: data,
      }
    );
    return this.handleCloudflareResponse(
      res,
      "Failed to put worker script",
      z.record(z.string(), z.any())
    );
  }

  private async handleCloudflareResponse<T>(
    res: Response,
    message: string,
    schema: z.ZodType<T>
  ) {
    if (!res.ok) {
      const json = await res.json();
      console.log(`[Cloudflare] ${message}`, json);
      const error = CloudflareErrorResponse.parse(json);
      console.error(
        `${message} (${res.status}) - ${error.errors
          .map((e) => `${e.code}: ${e.message}`)
          .join(", ")}`,
        json,
        Object.fromEntries(res.headers.entries())
      );
      throw new Error(
        `${message} (${res.status}) - ${error.errors
          .map((e) => `${e.code}: ${e.message}`)
          .join(", ")}`
      );
    }
    const json = await res.json();
    const { result } = CloudflareSuccessResponse(schema).parse(json);
    console.log(`[Cloudflare] `, result);
    return result as T;
  }
}
