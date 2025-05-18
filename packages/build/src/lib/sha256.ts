import type { webcrypto } from "crypto";

export async function sha256(data: webcrypto.BufferSource) {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
