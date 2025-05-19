import { GitHubLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandItem,
  CommandInput,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { $api } from "@/lib/api";
import { redirectToGitHubInstall } from "@/lib/server/github";
import { useQuery, useZero } from "@functional/zero/react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/$team/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const z = useZero();
  const [team] = useQuery(
    z.query.teams.where("slug", params.team).related("installations").one()
  );
  const [installationId, setInstallationId] = useState<number | null>(null);
  const installation =
    team?.installations.find(
      (installation) => installation.id === installationId
    ) ?? team?.installations[0];
  const addGitHubAccount = useServerFn(redirectToGitHubInstall);
  return (
    <div className="mx-auto max-w-screen-xl px-3">
      <h1 className="text-2xl font-bold">New Project</h1>
      <div className="grid gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <GitHubLogo />
              {installation?.targetName}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {team?.installations.map((installation) => (
              <DropdownMenuItem
                key={installation.id}
                onClick={() => setInstallationId(installation.id)}
              >
                {installation.targetName}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() =>
                addGitHubAccount({
                  data: { team: params.team },
                })
              }
            >
              <Plus />
              Add GitHub Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {installation && (
          <GitHubRepositorySelector
            team={params.team}
            installationId={installation.id}
          />
        )}
      </div>
    </div>
  );
}

function GitHubRepositorySelector(props: {
  team: string;
  installationId: number;
}) {
  const repositories = $api.useQuery(
    "get",
    "/teams/{team}/github-installations/{installationId}/repositories",
    {
      params: {
        path: { team: props.team, installationId: props.installationId },
      },
    }
  );
  const z = useZero();
  const createProject = $api.useMutation("post", "/teams/{team}/projects", {
    onMutate: (variables) => {
      console.log("onMutate", variables);
    },
    onSuccess: async (data, variables) => {
      z.query.projects.where("slug", variables.body!.slug).preload();
      await navigate({
        to: "/$team/$project",
        params: { team: props.team, project: variables.body!.slug },
      });
    },
    onError: (error, variables) => {
      console.error(error);
    },
  });
  const navigate = Route.useNavigate();
  return (
    <div>
      <h2 className="text-lg font-bold">Repositories</h2>
      <Command>
        <CommandInput placeholder="Search repositories" />
        <CommandGroup>
          <CommandList>
            {repositories.data?.map((repository) => (
              <CommandItem
                key={repository.id}
                value={repository.name}
                onSelect={() => {
                  console.log("onSelect", repository);
                  createProject.mutate({
                    params: { path: { team: props.team } },
                    body: {
                      name: repository.name,
                      slug: repository.name.toLowerCase().replace(/ /g, "-"),
                      githubRepository: repository,
                    },
                  });
                }}
                disabled={createProject.isPending}
              >
                {repository.name}
              </CommandItem>
            ))}
          </CommandList>
        </CommandGroup>
      </Command>
    </div>
  );
}
