import { authState } from "@/lib/server/auth";
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { clientEnv } from "../env";
import type { paths } from "./openapi.gen";

export const apiFetch = createFetchClient<paths>({
  baseUrl: clientEnv.VITE_API_URL,
  fetch: async (input) => {
    const token = await (typeof window === "undefined"
      ? authState().then((res) => res.token)
      : getClientToken());
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

export const $api = createClient(apiFetch);

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

const getClientToken = async () => {
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
