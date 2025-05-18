import { apiFetch } from "@/api/fetch";
import { authMiddleware } from "@/lib/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const Route = createFileRoute("/github/install")({
  component: RouteComponent,
  validateSearch: z.object({
    installation_id: z.coerce.number(),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return await handleInstall({
      data: { id: deps.installation_id },
    });
  },
});

const handleInstall = createServerFn()
  .validator(z.object({ id: z.number() }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.subject) {
      throw redirect({ to: "/auth" });
    }
    const res = await apiFetch.PUT(
      "/teams/{team}/github-installations/{installationId}",
      {
        params: {
          path: {
            team: context.subject.properties.defaultTeam.id,
            installationId: data.id,
          },
        },
      }
    );
    return {
      data: res.data,
      error: res.error
        ? {
            message: res.error.message,
            code: res.error.code,
          }
        : undefined,
    };
  });

function RouteComponent() {
  const data = Route.useLoaderData();
  return (
    <pre>
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}
