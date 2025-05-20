import { and, eq, schema, type InsertModel } from "@functional/db";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { HonoEnv } from "../lib/env";
import { APIError } from "../lib/error";
import { validateGitHubInstallation, validateTeam } from "../lib/helpers";
import { describeRoute } from "../lib/openapi";

const githubInstallationParamSchema = z.object({
  team: z.string(),
  installationId: z.coerce.number(),
});

const githubInstallationSchema = z
  .object({
    id: z.number(),
    teamId: z.string(),
    targetType: z.enum(["organization", "user"]),
    targetId: z.number(),
    targetName: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("GitHubInstallation");

export const githubRepositorySchema = z
  .object({
    id: z.number(),
    name: z.string(),
    owner: z.string(),
    url: z.string(),
    private: z.boolean(),
    defaultBranch: z.string(),
    installationId: z.number(),
  })
  .openapi("GitHubRepository");

const githubInstallationsRouter = new OpenAPIHono<HonoEnv>();

githubInstallationsRouter.openapi(
  describeRoute({
    method: "get",
    path: "/",
    request: {
      params: z.object({
        team: z.string(),
      }),
    },
    responses: {
      200: {
        description: "GitHub installations",
        content: {
          "application/json": {
            schema: z.array(githubInstallationSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const team = await validateTeam(c);
    const installations = await db
      .select()
      .from(schema.githubInstallations)
      .where(eq(schema.githubInstallations.teamId, team.id));
    return c.json(installations);
  }
);

githubInstallationsRouter.openapi(
  describeRoute({
    method: "get",
    path: "/{installationId}",
    request: {
      params: githubInstallationParamSchema,
    },
    responses: {
      200: {
        description: "GitHub installation",
        content: {
          "application/json": {
            schema: githubInstallationSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const team = await validateTeam(c);
    const [installation] = await db
      .select()
      .from(schema.githubInstallations)
      .where(
        and(
          eq(schema.githubInstallations.teamId, team.id),
          eq(schema.githubInstallations.id, c.req.valid("param").installationId)
        )
      )
      .limit(1);
    if (!installation) {
      throw new APIError({
        code: "NOT_FOUND",
        message: "GitHub installation not found",
      });
    }
    return c.json(installation);
  }
);

githubInstallationsRouter.openapi(
  describeRoute({
    method: "put",
    path: "/{installationId}",
    request: {
      params: githubInstallationParamSchema,
    },
    responses: {
      200: {
        description: "GitHub installation updated",
        content: {
          "application/json": {
            schema: z.object({
              id: z.number(),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const github = c.get("github");
    const [team, installation] = await Promise.all([
      validateTeam(c),
      github.getInstallation(c.req.valid("param").installationId),
    ]);
    if (!installation.account) {
      throw new APIError({
        code: "NOT_FOUND",
        message: "GitHub installation not found",
      });
    }
    const fields: InsertModel<"githubInstallations"> = {
      id: installation.id,
      teamId: team.id,
      targetType:
        installation.target_type === "Organization" ? "organization" : "user",
      targetId: installation.account.id,
      targetName:
        "login" in installation.account
          ? installation.account.login
          : installation.account.slug,
    };
    await db
      .insert(schema.githubInstallations)
      .values(fields)
      .onConflictDoUpdate({
        target: [schema.githubInstallations.id],
        set: fields,
      });
    return c.json({ id: installation.id });
  }
);

githubInstallationsRouter.openapi(
  describeRoute({
    method: "get",
    path: "/{installationId}/repositories",
    request: {
      params: githubInstallationParamSchema,
    },
    responses: {
      200: {
        description: "GitHub repositories",
        content: {
          "application/json": {
            schema: z.array(githubRepositorySchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const installationId = c.req.valid("param").installationId;
    const [{ repositories }] = await Promise.all([
      c.get("github").listRepositories(installationId),
      validateGitHubInstallation(c, installationId),
    ]);
    return c.json(
      repositories.map((repository) => ({
        id: repository.id,
        name: repository.name,
        owner: repository.owner.login,
        url: repository.html_url,
        private: repository.private,
        defaultBranch: repository.default_branch,
        installationId,
      }))
    );
  }
);

export default githubInstallationsRouter;
