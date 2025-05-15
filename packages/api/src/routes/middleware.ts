import { AuthClient } from "@functional/auth/client";
import { createMiddleware } from "hono/factory";
import { APIError, type HonoEnv } from "./common";

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  if (c.req.path === "/docs") {
    return next();
  }
  const auth = new AuthClient({
    issuer: "https://auth.johnroyal.workers.dev",
    clientID: "api",
    fetch: (input, init) =>
      c.env.AUTH.fetch(input, {
        ...init,
        cf: { cacheEverything: input.includes("/.well-known/") },
      }),
  });
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    throw new APIError({
      code: "UNAUTHORIZED",
      message: "Missing or invalid bearer token",
    });
  }
  const res = await auth.verify({ access: token });
  if (res.err) {
    throw new APIError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
  c.set("subject", res.subject);
  return next();
});
