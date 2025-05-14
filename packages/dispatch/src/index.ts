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
      return new Response("Invalid hostname", { status: 400 });
    }
    const deployment = await client.getDeployment(slug);
    if (!deployment) {
      return new Response(`Deployment for project "${slug}" not found`, {
        status: 404,
      });
    }
    if (!deployment.output) {
      return new Response(
        `Found deployment "${deployment.id}" for project "${slug}" but no output`,
        {
          status: 404,
        }
      );
    }
    let worker: Fetcher;
    try {
      worker = env.DISPATCH.get(deployment.output.workerName, {}, {});
    } catch (error) {
      console.error("Invalid deployment", error);
      return new Response(
        `Invalid deployment ${deployment.output.workerName}`,
        {
          status: 500,
        }
      );
    }
    try {
      const response = await worker.fetch(request);
      const headers = new Headers(response.headers);
      headers.set("functional-project", slug);
      headers.set("functional-deployment-id", deployment.id);
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      console.error("Error fetching", error);
      return new Response(`Error fetching ${deployment.output.workerName}`, {
        status: 500,
      });
    }
  },
} satisfies ExportedHandler<Env>;
