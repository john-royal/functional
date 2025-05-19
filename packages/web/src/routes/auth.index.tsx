import { GitHubLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authRedirect, authState } from "@/lib/server/auth";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
  validateSearch: z.object({
    error: z.string().optional(),
    error_description: z.string().optional(),
  }),
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
  const login = useMutation({
    mutationFn: useServerFn(authRedirect),
  });
  const { error, error_description } = Route.useSearch();

  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Sign in to <span className="text-orange-400">Functional</span>
          </CardTitle>
          {error && <CardDescription>{error}</CardDescription>}
          {error_description && (
            <CardDescription>{error_description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={() => login.mutate({})}
            disabled={login.isPending || login.isSuccess}
          >
            <GitHubLogo />
            {login.isPending || login.isSuccess
              ? "Signing in..."
              : "Sign in with GitHub"}
          </Button>
        </CardContent>
      </Card>
      <div className="w-full max-w-80 py-4">
        <p className="text-sm text-muted-foreground text-center">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
