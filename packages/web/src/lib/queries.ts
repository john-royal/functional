import { queryOptions, type MutationOptions } from "@tanstack/react-query";
import { apiFetch } from "./api";

type ResponseEnvelope<T> =
  | {
      data: T;
    }
  | {
      error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
      };
    };

const parseResponse = async <T>(res: Response) => {
  const data = await res.json<ResponseEnvelope<T>>();
  if ("error" in data) {
    throw new Error(`${data.error.code}: ${data.error.message}`);
  }
  return data.data;
};

export const listTeamsQuery = () =>
  queryOptions({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await apiFetch("/teams", { method: "GET" });
      return parseResponse<unknown[]>(res);
    },
  });

export const getTeamQuery = (team: string) =>
  queryOptions({
    queryKey: ["team", team],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}`, { method: "GET" });
      return parseResponse<unknown>(res);
    },
  });

export const listTeamProjectsQuery = (team: string) =>
  queryOptions({
    queryKey: ["team", team, "projects"],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}/projects`, {
        method: "GET",
      });
      return parseResponse<unknown[]>(res);
    },
  });

export const getProjectQuery = (team: string, project: string) =>
  queryOptions({
    queryKey: ["team", team, "project", project],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}/projects/${project}`, {
        method: "GET",
      });
      return parseResponse<unknown>(res);
    },
  });

export const listGitNamespacesQuery = (team: string) =>
  queryOptions({
    queryKey: ["team", team, "git-installations"],
    queryFn: async () => {
      const res = await apiFetch(`/teams/${team}/git-installations`, {
        method: "GET",
      });
      return parseResponse<{ id: number; name: string }[]>(res);
    },
  });

export const getGitNamespaceQuery = (team: string, id: number) =>
  queryOptions({
    queryKey: ["team", team, "git-installations", id],
    queryFn: async () => {
      const res1 = await apiFetch(`/teams/${team}/git-installations/${id}`, {
        method: "GET",
      }).then((res) => parseResponse<Record<string, unknown>>(res));
      const res2 = await apiFetch(
        `/teams/${team}/git-installations/${id}/repositories`,
        {
          method: "GET",
        }
      ).then((res) => parseResponse<unknown[]>(res));
      return {
        ...res1,
        repositories: res2,
      };
    },
  });

export const createGitNamespaceMutation = (team: string) =>
  ({
    mutationFn: async () => {
      const res = await apiFetch(`/teams/${team}/git-installations/redirect`, {
        method: "GET",
      });
      return parseResponse<{ url: string }>(res);
    },
  }) satisfies MutationOptions<{ url: string }, Error>;
