import { apiFetch } from "@/lib/api";
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
      data: { installationId: deps.installation_id },
    });
  },
});

const handleInstall = createServerFn()
  .validator(z.object({ installationId: z.number() }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (!context.subject) {
      throw redirect({ to: "/auth" });
    }
    const res = await apiFetch(
      `/teams/${context.subject.properties.defaultTeam.id}/git-namespaces`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return res.json();
  });

function RouteComponent() {
  const data = Route.useLoaderData();
  return (
    <pre>
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
}
