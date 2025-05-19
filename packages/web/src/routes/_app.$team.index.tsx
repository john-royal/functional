import { useQuery, useZero } from "@functional/zero/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const z = useZero();
  const [team] = useQuery(
    z.query.teams
      .where("slug", params.team)
      .related("installations")
      .related("projects", (q) => q.orderBy("updatedAt", "desc"))
      .one(),
  );

  return (
    <div>
      <pre>
        <code>{JSON.stringify(team, null, 2)}</code>
      </pre>
    </div>
  );
}
