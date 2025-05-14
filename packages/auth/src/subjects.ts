import { createSubjects } from "@openauthjs/openauth/subject";
import z from "zod";

export const subjects = createSubjects({
  user: z.object({
    id: z.string(),
    defaultTeam: z.object({
      id: z.string(),
      slug: z.string(),
    }),
  }),
});
