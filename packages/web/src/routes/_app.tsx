import { Navbar } from "@/components/navbar";
import { authState } from "@/lib/server/auth";
import { getZero } from "@/lib/zero";
import { ZeroProvider } from "@functional/zero/react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { subject, token } = await authState();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    return {
      subject,
      token,
    };
  },
});

function RouteComponent() {
  const { subject, token } = Route.useRouteContext();
  const zero = getZero({
    userID: subject.properties.id,
    token,
  });

  return (
    <ZeroProvider zero={zero}>
      <Navbar />
      <Outlet />
    </ZeroProvider>
  );
}
