import { queryOptions, type MutationOptions } from "@tanstack/react-query";
import { apiFetch } from "./api";

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

export const listGitNamespacesQuery = (team: string) =>
  queryOptions({
    queryKey: ["team", team, "git-namespaces"],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}/git-namespaces`, {
        method: "GET",
      });
      return res.json();
    },
  });

export const getGitNamespaceQuery = (team: string, id: string) =>
  queryOptions({
    queryKey: ["team", team, "git-namespace", id],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}/git-namespaces/${id}`, {
        method: "GET",
      });
      return res.json();
    },
  });

export const createGitNamespaceMutation = (team: string) =>
  ({
    mutationFn: async (data) => {
      const res = await apiFetch(`/teams/${team}/git-namespaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return res.json();
    },
  }) satisfies MutationOptions<{ url: string }, Error>;
