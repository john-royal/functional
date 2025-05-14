import { authRedirect, authState } from "@/lib/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
  loader: async () => {
    const { subject } = await authState();
    if (subject) {
      throw redirect({
        to: "/$team",
        params: { team: subject.properties.defaultTeam.slug },
      });
    }
  },
});
function RouteComponent() {
  const login = useServerFn(authRedirect);

  return (
    <div>
      <button onClick={() => login()}>Login with GitHub</button>
    </div>
  );
}
