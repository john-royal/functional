import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_legal/privacy")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-4 max-w-prose mx-auto gap-4 flex flex-col">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p>I still need to write this. In the meantime, here is a blessing:</p>
      <ul className="list-disc list-inside">
        <li>May you do good and not evil.</li>
        <li>May you find forgiveness for yourself and forgive others.</li>
        <li>May you share freely, never taking more than you give.</li>
      </ul>
    </div>
  );
}
