import {
  AuthClient,
  type Challenge,
  type Subject,
  type Tokens,
} from "@functional/auth/client";
import { redirect } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import z from "zod";
import { env } from "cloudflare:workers";

declare module "cloudflare:workers" {
  namespace Cloudflare {
    interface Env {
      AUTH: Fetcher;
    }
  }
}

const authClient = new AuthClient({
  clientID: "auth",
  issuer: "https://auth.johnroyal.workers.dev",
  redirectURI: "https://web.johnroyal.workers.dev/auth/callback",
  fetch: (url, options) => {
    return env.AUTH.fetch(url, {
      ...options,
      cf: { cacheEverything: url.includes("/.well-known") },
    });
  },
});

const getTokens = (): { access: string; refresh: string } | undefined => {
  const access = getCookie("access_token");
  const refresh = getCookie("refresh_token");

  if (access && refresh) {
    return { access, refresh };
  }
};

const setTokens = (tokens: Tokens) => {
  setCookie("access_token", tokens.access, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
  setCookie("refresh_token", tokens.refresh, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
};

const clearTokens = () => {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
};

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const tokens = getTokens();
  if (tokens) {
    const res = await authClient.verify(tokens);
    if (res.err) {
      clearTokens();
      return next<{ subject: Subject | null }>({
        context: { subject: null },
      });
    }
    if (res.tokens) {
      setTokens(res.tokens);
    }
    return next<{ subject: Subject | null }>({
      context: { subject: res.subject },
    });
  }
  return next<{ subject: Subject | null }>({
    context: { subject: null },
  });
});

export const authState = createServerFn()
  .middleware([authMiddleware])
  .handler(({ context }) => context.subject);

export const authLogout = createServerFn().handler(async () => {
  clearTokens();
  throw redirect({ href: "/" });
});

export const authRedirect = createServerFn().handler(async () => {
  const res = await authClient.authorize();
  setCookie("auth_challenge", JSON.stringify(res.challenge), {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
  throw redirect({ href: res.url });
});

export const authCallbackSchema = z.union([
  z.object({
    state: z.string(),
    code: z.string(),
  }),
  z.object({
    error: z.string(),
    error_description: z.string(),
  }),
]);

export const authCallback = createServerFn()
  .validator(authCallbackSchema)
  .handler(async ({ data }) => {
    if ("error" in data) {
      return data;
    }
    const challenge = JSON.parse(
      getCookie("auth_challenge") ?? "null"
    ) as Challenge | null;
    if (!challenge) {
      return { error: "no_challenge" };
    }
    deleteCookie("auth_challenge");
    if (data.state !== challenge.state) {
      return { error: "invalid_state" };
    }
    const res = await authClient.exchange(data.code, challenge.verifier);
    if (res.err) {
      return { error: "exchange_error" };
    }
    if (res.tokens) {
      setTokens(res.tokens);
    }
    throw redirect({ href: "/" });
  });
