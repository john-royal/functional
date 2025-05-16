import { and, desc, eq, schema } from "@functional/db";
import { createDatabaseClient, type Database } from "@functional/db/client";

interface Env {
  DISPATCH: DispatchNamespace;
  HYPERDRIVE: Hyperdrive;
}

class Client {
  private db: Database;

  constructor(connectionString: string) {
    this.db = createDatabaseClient(connectionString);
  }

  async getDeployment(projectSlug: string) {
    if (projectSlug === "plain-salad-9f93") {
      return {
        id: "plain-salad-9f93",
        output: {
          workerName: "plain-salad-9f93",
        },
      };
    }
    const [deployment] = await this.db
      .select({
        id: schema.deployments.id,
        output: schema.deployments.output,
      })
      .from(schema.projects)
      .where(eq(schema.projects.slug, projectSlug))
      .innerJoin(
        schema.deployments,
        and(
          eq(schema.projects.id, schema.deployments.projectId),
          eq(schema.deployments.status, "success")
        )
      )
      .orderBy(desc(schema.deployments.createdAt))
      .limit(1);
    return deployment;
  }
}

export default {
  async fetch(request, env) {
    const client = new Client(env.HYPERDRIVE.connectionString);
    const slug = new URL(request.url).hostname.split(".")[0];
    if (!slug) {
      return errorResponse({
        title: "404: DEPLOYMENT_NOT_FOUND",
        message: "This deployment could not be found.",
        status: 404,
      });
    }
    const deployment = await client.getDeployment(slug);
    if (!deployment) {
      return errorResponse({
        title: "404: DEPLOYMENT_NOT_FOUND",
        message: "This deployment could not be found.",
        status: 404,
      });
    }
    if (!deployment.output) {
      return errorResponse({
        title: "503: DEPLOYMENT_MISSING_OUTPUT",
        message:
          "This deployment was found, but there is no function associated with it.",
        status: 503,
        projectSlug: slug,
        deploymentId: deployment.id,
      });
    }
    let worker: Fetcher;
    try {
      worker = env.DISPATCH.get(
        deployment.output.workerName,
        {},
        {
          limits: { cpuMs: 0, subRequests: 0 },
        }
      );
    } catch (error) {
      console.error("Invalid deployment", error);
      return errorResponse({
        title: "502: FAILED_TO_LOAD_FUNCTION",
        message:
          "This deployment was found, but the function could not be loaded. This is a problem with Functional, not the application.",
        status: 502,
        projectSlug: slug,
        deploymentId: deployment.id,
      });
    }
    try {
      const response = await worker.fetch(request);
      if (response.headers.get("cf-worker-status") === "exception") {
        return errorResponse({
          title: "500: FUNCTION_THREW_EXCEPTION",
          message:
            "The function threw an exception. This is likely a bug in the application.",
          status: 500,
          projectSlug: slug,
          deploymentId: deployment.id,
        });
      }
      const headers = new Headers(response.headers);
      headers.set("functional-project", slug);
      headers.set("functional-deployment-id", deployment.id);
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("Error fetching", error);
      return errorResponse({
        title: "502: FAILED_TO_FETCH_FUNCTION",
        message:
          "The function could not be reached. This is a problem with Functional, not the application.",
        status: 502,
        projectSlug: slug,
        deploymentId: deployment.id,
      });
    }
  },
} satisfies ExportedHandler<Env>;

const errorResponse = (input: {
  title: string;
  message: string;
  status: number;
  projectSlug?: string;
  deploymentId?: string;
}) => {
  const headers = new Headers();
  headers.set("content-type", "text/html");
  if (input.projectSlug) {
    headers.set("functional-project", input.projectSlug);
  }
  if (input.deploymentId) {
    headers.set("functional-deployment-id", input.deploymentId);
  }
  return new Response(renderErrorPage(input.title, input.message), {
    status: input.status,
    headers,
  });
};

const renderErrorPage = (title: string, message: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <title>${title} | Functional</title>
  </head>
  <body>
    <div class="flex flex-col items-center justify-center h-screen p-4">
      <div
        class="w-full max-w-md border-gray-100 border rounded-lg p-6 space-y-1.5 wrap-break-word"
      >
        <h1 class="text-lg text-gray-800 font-medium">${title}</h1>
        <p class="text-gray-500">${message}</p>
      </div>
    </div>
  </body>
</html>`;

const errorCodeToMessage: Record<string, string> = {
  "1101": "Worker threw a JavaScript exception.",
  "1102": "Worker exceeded CPU time limit.",
  "1103": "The owner of this worker needs to contact Cloudflare Support",
  "1015": "Worker hit the burst rate limit.",
  "1019": "Worker hit loop limit.",
  "1021": "Worker has requested a host it cannot access.",
  "1022": "Cloudflare has failed to route the request to the Worker.",
  "1024": "Worker cannot make a subrequest to a Cloudflare-owned IP address.",
  "1027": "Worker exceeded free tier daily request limit.",
  "1042":
    "Worker tried to fetch from another Worker on the same zone, which is only supported when the global_fetch_strictly_public compatibility flag is used.",
};
