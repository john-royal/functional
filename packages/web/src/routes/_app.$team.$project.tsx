import { $api } from "@/api/fetch";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team/$project")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(
      $api.queryOptions("get", "/teams/{team}/projects/{project}", {
        params: {
          path: {
            team: params.team,
            project: params.project,
          },
        },
      })
    );
  },
  pendingComponent: () => <div>Loading project...</div>,
});

function RouteComponent() {
  const { team, project } = Route.useParams();
  const { data } = useSuspenseQuery(
    $api.queryOptions("get", "/teams/{team}/projects/{project}", {
      params: {
        path: {
          team,
          project,
        },
      },
    })
  );
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
