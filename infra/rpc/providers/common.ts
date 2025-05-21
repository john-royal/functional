import { join } from "path";
import { CloudflareClient } from "@functional/cloudflare-utils/client";
export const cwd = join(__dirname, "../../..");

export const cloudflare = new CloudflareClient({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});
