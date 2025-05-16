import { $api } from "@/api/fetch";
import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery($api.queryOptions("get", "/teams"));
    void context.queryClient.prefetchQuery(
      $api.queryOptions("get", "/teams/{team}", {
        params: {
          path: {
            team: params.team,
          },
        },
      })
    );
    void context.queryClient.prefetchQuery(
      $api.queryOptions("get", "/teams/{team}/projects", {
        params: {
          path: {
            team: params.team,
          },
        },
      })
    );
    void context.queryClient.prefetchQuery(
      $api.queryOptions("get", "/teams/{team}/git-installations", {
        params: {
          path: {
            team: params.team,
          },
        },
      })
    );
  },
  pendingComponent: () => <div>Loading team...</div>,
});

function RouteComponent() {
  const { team } = Route.useParams();
  const [listTeams, selectedTeam, projects, gitInstallations] =
    useSuspenseQueries({
      queries: [
        $api.queryOptions("get", "/teams"),
        $api.queryOptions("get", "/teams/{team}", {
          params: {
            path: {
              team,
            },
          },
        }),
        $api.queryOptions("get", "/teams/{team}/projects", {
          params: {
            path: {
              team,
            },
          },
        }),
        $api.queryOptions("get", "/teams/{team}/git-installations", {
          params: {
            path: {
              team,
            },
          },
        }),
      ],
    });
  // const create = useMutation(createGitNamespaceMutation(team));

  return (
    <div>
      <pre>
        <code>{JSON.stringify(listTeams.data, null, 2)}</code>
        <code>{JSON.stringify(selectedTeam.data, null, 2)}</code>
        <code>{JSON.stringify(projects.data, null, 2)}</code>
        <code>{JSON.stringify(gitInstallations.data, null, 2)}</code>
      </pre>
    </div>
  );
}
