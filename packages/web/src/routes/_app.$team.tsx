import {
  createGitNamespaceRedirectMutation,
  getTeamQuery,
  listGitNamespacesQuery,
  listTeamProjectsQuery,
  listTeamsQuery,
} from "@/lib/queries";
import { useMutation, useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(getTeamQuery(params.team));
    void context.queryClient.prefetchQuery(listTeamProjectsQuery(params.team));
    void context.queryClient.prefetchQuery(listGitNamespacesQuery(params.team));
  },
  pendingComponent: () => <div>Loading team...</div>,
});

function RouteComponent() {
  const { team } = Route.useParams();
  const [listTeams, selectedTeam, projects, gitNamespaces] = useSuspenseQueries(
    {
      queries: [
        listTeamsQuery(),
        getTeamQuery(team),
        listTeamProjectsQuery(team),
        listGitNamespacesQuery(team),
      ],
    }
  );
  const create = useMutation(createGitNamespaceRedirectMutation(team));

  return (
    <div>
      <pre>
        <code>{JSON.stringify(listTeams.data, null, 2)}</code>
        <code>{JSON.stringify(selectedTeam.data, null, 2)}</code>
        <code>{JSON.stringify(projects.data, null, 2)}</code>
        <code>{JSON.stringify(gitNamespaces.data, null, 2)}</code>
      </pre>
      <button
        onClick={() =>
          create.mutateAsync().then((res) => {
            window.location.href = res.url;
          })
        }
      >
        Create
      </button>
    </div>
  );
}
