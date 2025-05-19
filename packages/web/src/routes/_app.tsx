import { Button } from "@/components/ui/button";
import { authSignOut, authState } from "@/lib/server/auth";
import { getZero } from "@/lib/zero";
import { ZeroProvider } from "@functional/zero/react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { subject, token } = await authState();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    return {
      userID: subject.properties.id,
      token,
    };
  },
});

function RouteComponent() {
  const context = Route.useRouteContext();
  const zero = getZero(context);
  const signOut = useServerFn(authSignOut);
  return (
    <ZeroProvider zero={zero}>
      <Button onClick={() => signOut()}>Sign Out</Button>
      <Outlet />
    </ZeroProvider>
  );
}
