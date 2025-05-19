import { useQuery, useZero } from "@functional/zero/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team/$project")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const z = useZero();
  const [project] = useQuery(
    z.query.projects
      .where("slug", params.project)
      .related("deployments", (q) => q.orderBy("triggeredAt", "desc"))
      .one(),
  );
  return (
    <div>
      <pre>{JSON.stringify(project, null, 2)}</pre>
    </div>
  );
}
