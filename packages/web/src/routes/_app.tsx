import { $api } from "@/api/fetch";
import { authState } from "@/lib/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { subject } = await authState();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    void context.queryClient.prefetchQuery($api.queryOptions("get", "/teams"));
  },
});

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
