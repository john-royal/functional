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
      FRONTEND_URL: string;
      AUTH_URL: string;
      API_URL: string;
      AUTH: Fetcher;
      API: Fetcher;
    }
  }
}

const authClient = new AuthClient({
  clientID: "api",
  issuer: env.AUTH_URL,
  redirectURI: `${env.FRONTEND_URL}/auth/callback`,
  fetch: async (url, options) => {
    const res = await env.AUTH.fetch(url, {
      ...options,
      cf: { cacheEverything: url.includes("/.well-known") },
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: res.headers,
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
    secure: false,
    sameSite: "lax",
  });
  setCookie("refresh_token", tokens.refresh, {
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
};

const clearTokens = () => {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
};

interface AuthenticatedContext {
  subject: Subject;
  token: string;
}

interface UnauthenticatedContext {
  subject: null;
  token: null;
}

type AuthContext = AuthenticatedContext | UnauthenticatedContext;

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const tokens = getTokens();
  if (tokens) {
    const res = await authClient.verify(tokens);
    if (res.err) {
      clearTokens();
      return next<AuthContext>({
        context: { subject: null, token: null },
      });
    }
    if (res.tokens) {
      setTokens(res.tokens);
    }
    return next<AuthContext>({
      context: {
        subject: res.subject,
        token: res.tokens?.access ?? tokens.access,
      },
    });
  }
  return next<AuthContext>({
    context: { subject: null, token: null },
  });
});

export const authState = createServerFn()
  .middleware([authMiddleware])
  .handler(({ context }) => ({
    subject: context.subject,
    token: context.token,
  }));

export const listTeams = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const res = await env.API.fetch(`${env.API_URL}/teams`, {
      headers: {
        Authorization: `Bearer ${context.token}`,
      },
    });
    return {
      subject: context.subject,
      teams: (await res.json()) as {
        id: string;
        name: string;
        slug: string;
      }[],
    };
  });

export const authLogout = createServerFn().handler(async () => {
  clearTokens();
  throw redirect({ href: "/" });
});

export const authRedirect = createServerFn().handler(async () => {
  const res = await authClient.authorize();
  setCookie("auth_challenge", JSON.stringify(res.challenge), {
    path: "/",
    httpOnly: true,
    secure: false,
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
