import { z } from "zod";

export const GitHubInstallationDeletedEvent = z.object({
  type: z.literal("installation.deleted"),
  payload: z.object({
    installationId: z.number(),
  }),
});
export type GitHubInstallationDeletedEvent = z.infer<
  typeof GitHubInstallationDeletedEvent
>;

export const GitHubPushEvent = z.object({
  type: z.literal("push"),
  payload: z.object({
    installationId: z.number(),
    repositoryId: z.number(),
    ref: z.string(),
    sha: z.string(),
    message: z.string(),
    timestamp: z.number(),
  }),
});
export type GitHubPushEvent = z.infer<typeof GitHubPushEvent>;

export const GitHubEvent = z.discriminatedUnion("type", [
  GitHubInstallationDeletedEvent,
  GitHubPushEvent,
]);
export type GitHubEvent = z.infer<typeof GitHubEvent>;
