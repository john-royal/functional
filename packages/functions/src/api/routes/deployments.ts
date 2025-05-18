import { schema, eq } from "@functional/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { HonoEnv } from "../lib/env";
import { validateProject } from "../lib/helpers";

const deploymentsRouter = new OpenAPIHono<HonoEnv>();

deploymentsRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    request: {
      params: z.object({
        team: z.string(),
        project: z.string(),
      }),
    },
    responses: {
      200: {
        description: "Deployments",
        content: {
          "application/json": {
            schema: z.array(z.any()),
          },
        },
      },
    },
  }),
  async (c) => {
    const { team, project } = await validateProject(c);
    const deployments = await c
      .get("db")
      .select()
      .from(schema.deployments)
      .where(eq(schema.deployments.projectId, project.id));
    return c.json(deployments);
  }
);

export default deploymentsRouter;
