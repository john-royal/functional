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
    const res = await apiFetch(
      `/teams/${context.subject.properties.defaultTeam.id}/git-installations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
