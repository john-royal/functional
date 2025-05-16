import { authState } from "./auth";

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

export const apiFetch = async (path: string, options?: RequestInit) => {
  if (typeof window === "undefined") {
    const { env } = await import("cloudflare:workers");
    const { token } = await authState();
    const url = new URL(path, env.API_URL);
    return env.API.fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return fetch(new URL(path, import.meta.env.VITE_API_URL), {
    ...options,
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      ...options?.headers,
    },
  });
};

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
