import { getGitNamespaceQuery } from "@/lib/queries";
import {
  getTeamQuery,
  listGitNamespacesQuery,
  listTeamProjectsQuery,
  listTeamsQuery,
  createGitNamespaceMutation,
} from "@/lib/queries";
import {
  useMutation,
  useQuery,
  useSuspenseQueries,
} from "@tanstack/react-query";
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
  const create = useMutation(createGitNamespaceMutation(team));

  return (
    <div>
      <pre>
        <code>{JSON.stringify(listTeams.data, null, 2)}</code>
        <code>{JSON.stringify(selectedTeam.data, null, 2)}</code>
        <code>{JSON.stringify(projects.data, null, 2)}</code>
        <code>{JSON.stringify(gitNamespaces.data, null, 2)}</code>
      </pre>
      {gitNamespaces.data?.map((gitNamespace) => (
        <GitNamespace key={gitNamespace.id} team={team} id={gitNamespace.id} />
      ))}
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

function GitNamespace({ team, id }: { team: string; id: string }) {
  const { data } = useQuery(getGitNamespaceQuery(team, id));
  return (
    <div>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
}
