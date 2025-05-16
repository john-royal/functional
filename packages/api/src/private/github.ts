import { sValidator } from "@hono/standard-validator";
import { Webhooks } from "@octokit/webhooks";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { Env } from "./types";
import { createDatabaseClient } from "@functional/db/client";

const createWebhookHandler = (env: Env) => {
  const webhooks = new Webhooks({ secret: env.GITHUB_WEBHOOK_SECRET });

  webhooks.on("installation.deleted", async (event) => {
    await env.GITHUB_QUEUE.send({
      type: "installation.deleted",
      data: {
        id: event.payload.installation.id,
      },
    });
  });

  webhooks.on("push", async (event) => {
    console.log(
      JSON.stringify(
        {
          event: "push",
          id: event.id,
          name: event.name,
          payload: event.payload,
        },
        null,
        2
      )
    );
  });

  return webhooks;
};

export const githubRouter = new Hono<{ Bindings: Env }>()
  .use(
    createMiddleware<{
      Bindings: Env;
      Variables: {
        webhooks: Webhooks;
      };
    }>((c, next) => {
      c.set("webhooks", createWebhookHandler(c.env));
      return next();
    })
  )
  .post(
    "/",
    sValidator(
      "header",
      z.object({
        "x-hub-signature-256": z.string(),
        "x-github-event": z.string(),
        "x-github-delivery": z.string(),
      })
    ),
    async (c) => {
      const headers = c.req.valid("header");
      const payload = await c.req.text();

      await c.get("webhooks").verifyAndReceive({
        id: headers["x-github-delivery"],
        name: headers["x-github-event"],
        signature: headers["x-hub-signature-256"],
        payload,
      });
      return c.text("OK", 200);
    }
  );
