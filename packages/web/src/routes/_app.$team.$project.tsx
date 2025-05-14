import { getProjectQuery } from "@/lib/query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_app/$team/$project")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(
      getProjectQuery(params.team, params.project)
    );
  },
  pendingComponent: () => <div>Loading project...</div>,
});

function RouteComponent() {
  const { team, project } = Route.useParams();
  const { data } = useSuspenseQuery(getProjectQuery(team, project));
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
