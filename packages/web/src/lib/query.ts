import { queryOptions } from "@tanstack/react-query";
import { authState } from "./auth";

declare global {
  var token: string;
}

const apiFetch = async (path: string, options?: RequestInit) => {
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

export const listTeamsQuery = () =>
  queryOptions({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await apiFetch("/teams", { method: "GET" });
      return res.json();
    },
  });

export const getTeamQuery = (team: string) =>
  queryOptions({
    queryKey: ["team", team],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}`, { method: "GET" });
      return res.json();
    },
  });

export const listTeamProjectsQuery = (team: string) =>
  queryOptions({
    queryKey: ["team", team, "projects"],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}/projects`, {
        method: "GET",
      });
      return res.json();
    },
  });

export const getProjectQuery = (team: string, project: string) =>
  queryOptions({
    queryKey: ["team", team, "project", project],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}/projects/${project}`, {
        method: "GET",
      });
      return res.json();
    },
  });
