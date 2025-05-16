import { authState } from "@/lib/auth";
import { listTeamsQuery } from "@/lib/queries";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { subject } = await authState();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    void context.queryClient.prefetchQuery(listTeamsQuery());
  },
});

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
