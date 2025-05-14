import { authLogout, authRedirect, listTeams } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/")({
  component: App,
  loader: () => listTeams(),
});

function App() {
  const data = Route.useLoaderData();
  const login = useServerFn(authRedirect);
  const logout = useServerFn(authLogout);

  return (
    <div className="text-center">
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {data.subject ? (
        <button onClick={() => logout()}>Logout</button>
      ) : (
        <button onClick={() => login()}>Login</button>
      )}
    </div>
  );
}
