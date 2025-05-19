import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  handleGitHubInstall,
  redirectToGitHubInstall,
} from "@/lib/server/github";
import { Await, Link, createFileRoute, defer } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const Route = createFileRoute("/github/install")({
  component: RouteComponent,
  validateSearch: z.object({
    installation_id: z.coerce.number(),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => {
    return {
      result: defer(
        handleGitHubInstall({
          data: { installationId: deps.installation_id },
        }),
      ),
    };
  },
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const handleRedirect = useServerFn(redirectToGitHubInstall);

  return (
    <Await
      promise={data.result}
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Please wait while we install the GitHub app.
            </CardDescription>
          </CardHeader>
        </Card>
      }
    >
      {(result) => {
        if (result.success) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>GitHub App Installed</CardTitle>
                <CardDescription>
                  You can close this page or continue to Functional.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/">Continue</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        }
        if (result.error.code === "UNAUTHORIZED") {
          return (
            <Card>
              <CardHeader>
                <CardTitle>App Installation Failed</CardTitle>
                <CardDescription>Please sign in to continue.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle>App Installation Failed</CardTitle>
              <CardDescription>{result.error.message}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => handleRedirect({ data: {} })}>
                Try again
              </Button>
            </CardFooter>
          </Card>
        );
      }}
    </Await>
  );
}
