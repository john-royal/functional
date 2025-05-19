import { GitHubLogo } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useZero } from "@functional/zero/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/$team/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const z = useZero();
  const { subject } = Route.useRouteContext();
  const [team] = useQuery(
    z.query.teams
      .where("slug", params.team)
      .related("projects", (q) =>
        q
          .orderBy("updatedAt", "desc")
          .related("deployments", (q) => q.orderBy("completedAt", "desc").one())
          .related("githubRepository")
      )
      .one()
  );
  const navigate = Route.useNavigate();
  return (
    <div className="mx-auto max-w-screen-xl px-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button asChild>
          <Link to="/$team/new" params={{ team: params.team }}>
            <Plus />
            New Project
          </Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {team?.projects.map((project) => (
          <Card className="relative max-w-sm" key={project.id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              {project.githubRepository && (
                <Badge
                  variant="outline"
                  className="gap-1 text-muted-foreground py-1 z-10"
                  asChild
                >
                  <a
                    href={project.githubRepository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitHubLogo />
                    {project.githubRepository.owner}/
                    {project.githubRepository.name}
                  </a>
                </Badge>
              )}
            </CardHeader>
            <Link
              to="/$team/$project"
              params={{ team: params.team, project: project.slug }}
              aria-label="Open project"
              className="absolute inset-0"
            />
          </Card>
        ))}
      </div>
      {team && team.type === "organization" && (
        <Button
          variant="destructive"
          onClick={async () => {
            await z.mutateBatch(async (tx) => {
              await tx.teamMembers.delete({
                userId: subject.properties.id,
                teamId: team.id,
              });
              await tx.teams.delete({ id: team.id });
            });
            await navigate({ to: "/" });
          }}
        >
          Delete Team (Test)
        </Button>
      )}
    </div>
  );
}
