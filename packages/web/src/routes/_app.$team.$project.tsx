import { Button } from "@/components/ui/button";
import { useQuery, useZero } from "@functional/zero/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team/$project")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const z = useZero();
  const [project, status] = useQuery(
    z.query.projects
      .where("slug", params.project)
      .related("deployments", (q) => q.orderBy("triggeredAt", "desc"))
      .one()
  );
  if (!project && status.type === "complete") {
    return <div>Project not found</div>;
  }
  return (
    <div>
      <pre>{JSON.stringify(project, null, 2)}</pre>
      {project && (
        <Button
          variant="destructive"
          onClick={() => {
            z.mutateBatch(async (tx) => {
              await Promise.all(
                project.deployments.map((d) =>
                  tx.deployments.delete({ id: d.id })
                )
              );
              await tx.projects.delete({ id: project.id });
            });
          }}
        >
          Delete Project
        </Button>
      )}
    </div>
  );
}
