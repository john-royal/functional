import { authState } from "./auth";

declare global {
  var token: string;
}

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
  const url = new URL(path, import.meta.env.VITE_API_URL);
  return fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${window.token}`, ...options?.headers },
  });
};
