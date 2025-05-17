import { jwtVerify, createLocalJWKSet, type JSONWebKeySet } from "jose";
import type { Subject } from "@functional/lib/subjects";
import { JWTExpired } from "jose/errors";
import { APIError } from "./error";
import { createMiddleware } from "hono/factory";

interface AuthContext {
  Bindings: {
    AUTH_ISSUER: string;
    AUTH: Fetcher;
  };
  Variables: {
    subject: Subject;
  };
}

export class Auth {
  private jwks: Promise<ReturnType<typeof createLocalJWKSet>>;

  static middleware() {
    return createMiddleware<AuthContext>(async (c, next) => {
      const token = c.req.header("Authorization")?.split(" ")[1];
      if (!token) {
        throw new APIError({
          code: "UNAUTHORIZED",
          message: "Missing bearer token",
        });
      }
      const auth = new Auth(c.env);
      const payload = await auth.verify(token);
      c.set("subject", payload);
      await next();
    });
  }

  constructor(readonly env: AuthContext["Bindings"]) {
    this.jwks = this.fetchJWKs();
  }

  async verify(token: string) {
    try {
      const { payload } = await jwtVerify<Subject>(token, await this.jwks, {
        issuer: this.env.AUTH_ISSUER,
      });
      return payload;
    } catch (error) {
      if (error instanceof JWTExpired) {
        throw new APIError({
          code: "UNAUTHORIZED",
          message: "Token expired",
        });
      } else {
        throw new APIError({
          code: "UNAUTHORIZED",
          message: "Invalid token",
        });
      }
    }
  }

  private async fetchJWKs() {
    const res = await this.env.AUTH.fetch(
      `${this.env.AUTH_ISSUER}/.well-known/jwks.json`,
      {
        cf: { cacheTtl: 60 * 60 * 24 },
      }
    );
    const jwks = await res.json<JSONWebKeySet>();
    return createLocalJWKSet(jwks);
  }
}
