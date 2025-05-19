import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch } from "../api";
import { authMiddleware } from "./auth";
import { useAppSession } from "./session";

export const redirectToGitHubInstall = createServerFn()
  .middleware([authMiddleware])
  .validator(
    z.object({
      team: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await useAppSession();
    if (data.team) {
      session.update({ team: data.team });
    }
    throw redirect({
      href: "https://github.com/apps/functional-dev/installations/new",
    });
  });

type GitHubInstallationResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: { message: string; code: string };
    };

export const handleGitHubInstall = createServerFn()
  .middleware([authMiddleware])
  .validator(
    z.object({
      installationId: z.number(),
    }),
  )
  .handler(async ({ context, data }): Promise<GitHubInstallationResult> => {
    if (!context.subject) {
      return {
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      };
    }
    const session = await useAppSession();
    const team =
      session.data?.team ?? context.subject.properties.defaultTeam.id;
    const res = await apiFetch.PUT(
      "/teams/{team}/github-installations/{installationId}",
      {
        params: {
          path: {
            team,
            installationId: data.installationId,
          },
        },
      },
    );
    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true };
  });
