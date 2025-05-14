import { authState } from "@/lib/auth";
import { createFileRoute, redirect, ScriptOnce } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { listTeamsQuery } from "@/lib/query";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  loader: async ({ context }) => {
    const { subject, token } = await authState();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    void context.queryClient.prefetchQuery(listTeamsQuery());
    return { token } as { token: string };
  },
});

function RouteComponent() {
  const { token } = Route.useLoaderData();
  return (
    <>
      <ScriptOnce>{`window.token = "${token}"`}</ScriptOnce>
      <Outlet />
    </>
  );
}
