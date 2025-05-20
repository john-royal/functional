import { z } from "zod";

export const ProjectCreatedEvent = z.object({
  type: z.literal("project.created"),
  payload: z.object({
    projectId: z.string(),
    githubRepositoryId: z.number(),
    githubInstallationId: z.number(),
  }),
});
export type ProjectCreatedEvent = z.infer<typeof ProjectCreatedEvent>;

// const test: ProjectCreatedEvent = {
//   "type": "project.created",
//   "payload": {
//     "projectId": "u19l1lb4ta8zgm82uutu7y4c",
//     "githubRepositoryId": 983766633,
//     "githubInstallationId": 67294115
//   }
// };

export const GitHubInstallationDeletedEvent = z.object({
  type: z.literal("github.installation.deleted"),
  payload: z.object({
    installationId: z.number(),
  }),
});
export type GitHubInstallationDeletedEvent = z.infer<
  typeof GitHubInstallationDeletedEvent
>;

export const GitHubPushEvent = z.object({
  type: z.literal("github.push"),
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

export const QueueMessage = z.discriminatedUnion("type", [
  ProjectCreatedEvent,
  GitHubInstallationDeletedEvent,
  GitHubPushEvent,
]);
export type QueueMessage = z.infer<typeof QueueMessage>;
