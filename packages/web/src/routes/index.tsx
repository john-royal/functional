import { authState } from "@/lib/server/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: async () => {
    const { subject } = await authState();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    throw redirect({
      to: "/$team",
      params: { team: subject.properties.defaultTeam.slug },
    });
  },
});
