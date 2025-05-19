import {
  ANYONE_CAN,
  ANYONE_CAN_DO_ANYTHING,
  definePermissions,
} from "@rocicorp/zero";
import { schema, type Schema } from "./zero-schema.gen";

export { schema, type Schema };

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    users: ANYONE_CAN_DO_ANYTHING,
    accounts: ANYONE_CAN_DO_ANYTHING,
    teamMembers: ANYONE_CAN_DO_ANYTHING,
    teams: ANYONE_CAN_DO_ANYTHING,
    projects: ANYONE_CAN_DO_ANYTHING,
    deployments: ANYONE_CAN_DO_ANYTHING,
    githubInstallations: ANYONE_CAN_DO_ANYTHING,
    githubRepositories: ANYONE_CAN_DO_ANYTHING,
  };
});
