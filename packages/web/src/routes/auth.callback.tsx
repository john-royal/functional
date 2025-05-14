import { authCallback, authCallbackSchema } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
  component: RouteComponent,
  validateSearch: authCallbackSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => authCallback({ data: deps }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return (
    <div>
      <p>Hello "/auth/callback"!</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
