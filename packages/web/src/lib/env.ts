import { z } from "zod";

const ClientEnv = z.object({
  VITE_API_URL: z.string().default("http://localhost:3001"),
  VITE_ZERO_URL: z.string().default("http://localhost:4848"),
});

export const clientEnv = ClientEnv.parse(import.meta.env);
