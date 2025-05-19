import type { Subject } from "@functional/lib/subjects";
import { ANYONE_CAN, definePermissions } from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

export const permissions = definePermissions<Subject, Schema>(schema, () => {
  return {
    users: {
      row: {
        select: [
          (subject, eb) =>
            eb.or(
              eb.cmp("id", subject.properties.id),
              eb.exists("teams", (q) =>
                q.whereExists("teamMembers", (q2) =>
                  q2.where("userId", subject.properties.id)
                )
              )
            ),
        ],
        insert: [(data, eb) => eb.cmp("id", data.properties.id)],
        update: {
          preMutation: [(data, eb) => eb.cmp("id", data.properties.id)],
        },
        delete: [(data, eb) => eb.cmp("id", data.properties.id)],
      },
    },
    accounts: {
      row: {
        insert: [(data, q) => q.cmp("userId", data.properties.id)],
        update: {
          preMutation: [(data, q) => q.cmp("userId", data.properties.id)],
          postMutation: [(data, q) => q.cmp("userId", data.properties.id)],
        },
        delete: [(data, q) => q.cmp("userId", data.properties.id)],
      },
    },
    teamMembers: {
      row: {
        insert: [
          (data, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2
                  .where("userId", data.properties.id)
                  .where("role", "IN", ["owner", "admin"])
              )
            ),
        ],
        update: {
          preMutation: [
            (data, eb) =>
              eb.exists("team", (q) =>
                q.whereExists("teamMembers", (q2) =>
                  q2
                    .where("userId", data.properties.id)
                    .where("role", "IN", ["owner", "admin"])
                )
              ),
          ],
        },
        delete: [
          (data, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2
                  .where("userId", data.properties.id)
                  .where("role", "IN", ["owner", "admin"])
              )
            ),
        ],
      },
    },
    teams: {
      row: {
        insert: ANYONE_CAN,
        select: [
          (subject, eb) =>
            eb.exists("teamMembers", (q) =>
              q.where("userId", subject.properties.id)
            ),
        ],
        update: {
          preMutation: [
            (subject, eb) =>
              eb.exists("teamMembers", (q) =>
                q.where("userId", subject.properties.id)
              ),
          ],
        },
        delete: [
          (subject, eb) =>
            eb.exists("teamMembers", (q) =>
              q.where("userId", subject.properties.id).where("role", "owner")
            ),
        ],
      },
    },
    projects: {
      row: {
        insert: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
        select: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
        update: {
          preMutation: [
            (subject, eb) =>
              eb.exists("team", (q) =>
                q.whereExists("teamMembers", (q2) =>
                  q2.where("userId", subject.properties.id)
                )
              ),
          ],
        },
        delete: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
      },
    },
    deployments: {
      row: {
        insert: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
        select: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
        update: {
          preMutation: [
            (subject, eb) =>
              eb.exists("team", (q) =>
                q.whereExists("teamMembers", (q2) =>
                  q2.where("userId", subject.properties.id)
                )
              ),
          ],
        },
        delete: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
      },
    },
    githubInstallations: {
      row: {
        insert: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
        select: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
        update: {
          preMutation: [
            (subject, eb) =>
              eb.exists("team", (q) =>
                q.whereExists("teamMembers", (q2) =>
                  q2.where("userId", subject.properties.id)
                )
              ),
          ],
        },
        delete: [
          (subject, eb) =>
            eb.exists("team", (q) =>
              q.whereExists("teamMembers", (q2) =>
                q2.where("userId", subject.properties.id)
              )
            ),
        ],
      },
    },
    githubRepositories: {
      row: {
        insert: [
          (subject, eb) =>
            eb.exists("installation", (q1) =>
              q1.whereExists("team", (q2) =>
                q2.whereExists("teamMembers", (q3) =>
                  q3.where("userId", subject.properties.id)
                )
              )
            ),
        ],
        update: {
          preMutation: [
            (subject, eb) =>
              eb.exists("installation", (q1) =>
                q1.whereExists("team", (q2) =>
                  q2.whereExists("teamMembers", (q3) =>
                    q3.where("userId", subject.properties.id)
                  )
                )
              ),
          ],
        },
        delete: [
          (subject, eb) =>
            eb.exists("installation", (q1) =>
              q1.whereExists("team", (q2) =>
                q2.whereExists("teamMembers", (q3) =>
                  q3.where("userId", subject.properties.id)
                )
              )
            ),
        ],
      },
    },
  };
});
