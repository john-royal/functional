import { z } from "zod";

const EnvSchema = z.object({
  API_URL: z.string(),
  INPUT_TOKEN: z.string(),
  OUTPUT_TOKEN: z.string(),
});

export const env = EnvSchema.parse(process.env);
