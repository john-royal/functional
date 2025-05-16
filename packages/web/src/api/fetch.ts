import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./openapi.gen";
import { authState } from "@/lib/auth";

export const $fetch = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  fetch: async (input) => {
    const token = await getToken();
    const request = new Request(input, {
      method: input.method,
      body: input.body,
      headers: { ...input.headers, Authorization: `Bearer ${token}` },
    });
    if (typeof window === "undefined") {
      const { env } = await import("cloudflare:workers");
      return env.API.fetch(request);
    }
    return fetch(request);
  },
});

export const $api = createClient($fetch);

let tokenCache:
  | Promise<
      | {
          token: string;
          expiresAt: number;
        }
      | {
          token: null;
          expiresAt: null;
        }
    >
  | undefined;

const getToken = async () => {
  if (tokenCache) {
    const cached = await tokenCache;
    if (!cached.token) {
      return null;
    }
    if (cached.expiresAt > Date.now()) {
      return cached.token;
    }
  }
  tokenCache = authState().then((res) => {
    if (res.token && res.expiresAt) {
      return { token: res.token, expiresAt: res.expiresAt };
    }
    return { token: null, expiresAt: null };
  });
  return tokenCache.then((res) => res?.token);
};
