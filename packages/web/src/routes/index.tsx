import { authLogout, authRedirect, authState } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/")({
  component: App,
  loader: () => authState(),
});

function App() {
  const subject = Route.useLoaderData();
  const login = useServerFn(authRedirect);
  const logout = useServerFn(authLogout);

  return (
    <div className="text-center">
      <pre>{JSON.stringify(subject, null, 2)}</pre>
      {subject ? (
        <button onClick={() => logout()}>Logout</button>
      ) : (
        <button onClick={() => login()}>Login</button>
      )}
    </div>
  );
}
