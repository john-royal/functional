import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authRedirect, authState } from "@/lib/server/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
  const login = useServerFn(authRedirect);
  const { error, error_description } = Route.useSearch();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        {error && <CardDescription>{error}</CardDescription>}
        {error_description && (
          <CardDescription>{error_description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Button onClick={() => login()}>Login with GitHub</Button>
      </CardContent>
    </Card>
  );
}
