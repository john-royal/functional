import type { OpenAPIHono } from "@hono/zod-openapi";
import { APIError, type HonoContext, type HonoEnv } from "../common";
import {
  createGitInstallationRoute,
  deleteGitInstallationRoute,
  getGitInstallationRedirectRoute,
  getGitInstallationRoute,
  listGitInstallationsRoute,
  listGitRepositoriesRoute,
} from "./schema";
import { validateTeam } from "../teams/helpers";
import { schema, eq, getTableColumns } from "@functional/db";
import { Octokit } from "octokit";

export const registerGitInstallationsRoutes = (app: OpenAPIHono<HonoEnv>) => {
  const { token, expiresAt, ...columns } = getTableColumns(
    schema.gitInstallations
  );

  app.openapi(listGitInstallationsRoute, async (c) => {
    const team = await validateTeam(c);
    const installations = await c.env.DB.select(columns)
      .from(schema.gitInstallations)
      .where(eq(schema.gitInstallations.teamId, team.id));
    return c.json(installations, 200);
  });

  app.openapi(getGitInstallationRedirectRoute, async (c) => {
    const [url] = await Promise.all([
      c.get("github").getInstallationUrl(),
      validateTeam(c),
    ]);
    return c.json({ url }, 200);
  });

  const createInstallationAccessToken = async (
    c: HonoContext,
    installationId: number
  ) => {
    const octokit = c.get("github").octokit;
    const token = await octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });
    return {
      token: token.data.token,
      expiresAt: new Date(token.data.expires_at),
    };
  };

  const getInstallationOctokit = async (
    c: HonoContext<"/teams/:team/git-installations/:id">,
    installationId: number
  ) => {
    const [team, installation] = await Promise.all([
      validateTeam(c),
      c.env.DB.select({
        id: schema.gitInstallations.id,
        teamId: schema.gitInstallations.teamId,
        token: schema.gitInstallations.token,
        expiresAt: schema.gitInstallations.expiresAt,
      })
        .from(schema.gitInstallations)
        .where(eq(schema.gitInstallations.id, installationId))
        .limit(1)
        .then(([installation]) => installation),
    ]);
    if (!installation || installation.teamId !== team.id) {
      throw new APIError({
        code: "NOT_FOUND",
        message: "Installation not found",
      });
    }
    if (!installation.expiresAt || installation.expiresAt < new Date()) {
      const token = await createInstallationAccessToken(c, installationId);
      c.executionCtx.waitUntil(
        c.env.DB.update(schema.gitInstallations)
          .set({ ...token })
          .where(eq(schema.gitInstallations.id, installationId))
      );
      installation.token = token.token;
      installation.expiresAt = token.expiresAt;
    }
    return new Octokit({
      auth: installation.token,
    });
  };

  app.openapi(createGitInstallationRoute, async (c) => {
    const body = c.req.valid("json");
    const octokit = c.get("github").octokit;
    const [team, installation, token] = await Promise.all([
      validateTeam(c),
      octokit.rest.apps.getInstallation({
        installation_id: body.id,
      }),
      createInstallationAccessToken(c, body.id),
    ]);
    if (!installation.data.account) {
      throw new APIError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid installation",
      });
    }
    await c.env.DB.insert(schema.gitInstallations).values({
      id: body.id,
      teamId: team.id,
      targetType:
        installation.data.target_type === "Organization"
          ? "organization"
          : "user",
      targetId: installation.data.target_id,
      targetName:
        "login" in installation.data.account
          ? installation.data.account.login
          : installation.data.account.name,
      ...token,
    });
    return c.json({ id: body.id }, 200);
  });

  app.openapi(getGitInstallationRoute, async (c) => {
    const team = await validateTeam(c);
    const [installation] = await c.env.DB.select(columns)
      .from(schema.gitInstallations)
      .where(eq(schema.gitInstallations.id, c.req.valid("param").id));
    if (!installation || installation.teamId !== team.id) {
      throw new APIError({
        code: "NOT_FOUND",
        message: "Installation not found",
      });
    }
    return c.json(installation, 200);
  });

  app.openapi(deleteGitInstallationRoute, async (c) => {
    const id = c.req.valid("param").id;
    await c.env.DB.transaction(async (tx) => {
      const [team, installation] = await Promise.all([
        validateTeam(c, tx),
        tx
          .select({
            id: schema.gitInstallations.id,
            teamId: schema.gitInstallations.teamId,
          })
          .from(schema.gitInstallations)
          .where(eq(schema.gitInstallations.id, id))
          .limit(1)
          .then(([installation]) => installation),
      ]);
      if (!installation || installation.teamId !== team.id) {
        throw new APIError({
          code: "NOT_FOUND",
          message: "Installation not found",
        });
      }
      await tx
        .delete(schema.gitInstallations)
        .where(eq(schema.gitInstallations.id, id));
    });
    return c.json({ id }, 200);
  });

  app.openapi(listGitRepositoriesRoute, async (c) => {
    const octokit = await getInstallationOctokit(c, c.req.valid("param").id);
    const repositories =
      await octokit.rest.apps.listReposAccessibleToInstallation({});
    return c.json(
      repositories.data.repositories.map((r) => ({
        id: r.id,
        name: r.name,
        url: r.html_url,
        installationId: c.req.valid("param").id,
      })),
      200
    );
  });
};
