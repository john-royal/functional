import { subjects, type Subject } from "@functional/lib/subjects";
import { createClient, type Tokens } from "@openauthjs/openauth/client";
import { redirect } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import z from "zod";
import { useAppSession } from "./session";
import { decodeJwt } from "jose";

const redirectURI = `${env.FRONTEND_URL}/auth/callback`;

const authClient = createClient({
  clientID: "api",
  issuer: env.AUTH_ISSUER,
  fetch: async (url, options) => {
    if (url.includes("/.well-known")) {
      return env.AUTH.fetch(url, {
        ...options,
        cf: { cacheEverything: true },
      });
    }
    return await env.AUTH.fetch(url, options);
  },
});

const getTokens = ():
  | {
      access: string;
      refresh: string;
      expiresAt: number;
    }
  | undefined => {
  const access = getCookie("access_token");
  const refresh = getCookie("refresh_token");
  const expiresAt = getCookie("token_expires_at");
  if (access && refresh && expiresAt) {
    return { access, refresh, expiresAt: Number(expiresAt) };
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
  setCookie("token_expires_at", `${Date.now() + tokens.expiresIn * 1000}`, {
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
};

const clearTokens = () => {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  deleteCookie("token_expires_at");
};

interface AuthenticatedContext {
  subject: Subject;
  token: string;
  expiresAt: number;
}

interface UnauthenticatedContext {
  subject?: undefined;
  token?: undefined;
  expiresAt?: undefined;
}

type AuthContext = AuthenticatedContext | UnauthenticatedContext;

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const tokens = getTokens();
  if (tokens) {
    const res = await authClient.verify(subjects, tokens.access, {
      refresh: tokens.refresh,
    });
    if (res.err) {
      clearTokens();
      return next<AuthContext>({
        context: {},
      });
    }
    if (res.tokens) {
      setTokens(res.tokens);
    }
    return next<AuthContext>({
      context: {
        subject: res.subject,
        token: res.tokens?.access ?? tokens.access,
        expiresAt: res.tokens?.expiresIn
          ? Date.now() + res.tokens.expiresIn * 1000
          : tokens.expiresAt,
      },
    });
  }
  return next<AuthContext>({
    context: {},
  });
});

export const authState = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return {
      subject: context.subject,
      token: context.token,
      expiresAt: context.expiresAt,
    };
  });

export const authLogout = createServerFn().handler(async () => {
  clearTokens();
  throw redirect({ href: "/" });
});

export const authRedirect = createServerFn().handler(async () => {
  const res = await authClient.authorize(redirectURI, "code", {
    provider: "github",
  });
  const session = await useAppSession();
  await session.update({
    challenge: res.challenge,
  });
  throw redirect({ href: res.url });
});

export const authCallbackSchema = z.object({
  state: z.string(),
  code: z.string(),
});

export const authCallback = createServerFn()
  .validator(authCallbackSchema)
  .handler(async ({ data }) => {
    const session = await useAppSession();
    if (!session.data.challenge) {
      throw redirect({ to: "/auth" });
    }
    const { state, verifier } = session.data.challenge;
    await session.update({
      challenge: undefined,
    });
    if (data.state !== state) {
      throw redirect({ to: "/auth" });
    }
    const res = await authClient.exchange(data.code, redirectURI, verifier);
    if (res.err) {
      throw redirect({ to: "/auth" });
    }
    const subject = decodeJwt<Subject>(res.tokens.access);
    setTokens(res.tokens);
    throw redirect({
      to: "/$team",
      params: { team: subject.properties.defaultTeam.slug },
    });
  });

export const authSignOut = createServerFn().handler(async () => {
  clearTokens();
  const session = await useAppSession();
  await session.clear();
  throw redirect({ to: "/auth" });
});
