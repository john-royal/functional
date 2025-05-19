import { authCallback, authCallbackSchema } from "@/lib/server/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: z.union([
    authCallbackSchema,
    z.object({
      error: z.string().optional(),
      error_description: z.string().optional(),
    }),
  ]),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => {
    if (!("state" in deps)) {
      throw redirect({
        to: "/auth",
        search: {
          error: deps.error,
          error_description: deps.error_description,
        },
      });
    }
    return authCallback({ data: deps as z.infer<typeof authCallbackSchema> });
  },
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: () => <div>Error</div>,
  pendingMinMs: 0,
});
