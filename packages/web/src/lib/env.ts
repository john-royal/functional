import { z } from "zod";

const ClientEnv = z.object({
  VITE_API_URL: z.string(),
  VITE_ZERO_URL: z.string(),
});

export const clientEnv = ClientEnv.parse(import.meta.env);
