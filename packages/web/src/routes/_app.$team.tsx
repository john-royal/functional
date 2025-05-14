import {
  getTeamQuery,
  listTeamProjectsQuery,
  listTeamsQuery,
} from "@/lib/query";
import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(getTeamQuery(params.team));
    void context.queryClient.prefetchQuery(listTeamProjectsQuery(params.team));
  },
  pendingComponent: () => <div>Loading team...</div>,
});

function RouteComponent() {
  const { team } = Route.useParams();
  const [listTeams, selectedTeam, projects] = useSuspenseQueries({
    queries: [
      listTeamsQuery(),
      getTeamQuery(team),
      listTeamProjectsQuery(team),
    ],
  });
  return (
    <pre>
      <code>{JSON.stringify(listTeams.data, null, 2)}</code>
      <code>{JSON.stringify(selectedTeam.data, null, 2)}</code>
      <code>{JSON.stringify(projects.data, null, 2)}</code>
    </pre>
  );
}
