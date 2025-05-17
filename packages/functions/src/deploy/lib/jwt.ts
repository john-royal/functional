import { createMiddleware } from "hono/factory";
import type { JWTPayload } from "hono/utils/jwt/types";
import { jwtVerify, SignJWT } from "jose";
import { APIError } from "../../api/lib/error";
import type { Env } from "./env";
import { JWTExpired } from "jose/errors";

export interface RepositoryDownloadToken {
  type: "repository-download";
  properties: {
    installationId: number;
    owner: string;
    repo: string;
    ref: string;
  };
}

export interface ArtifactUploadToken {
  type: "artifact-upload";
  properties: {
    projectId: string;
    deploymentId: string;
  };
}

export interface CompleteDeploymentToken {
  type: "complete-deployment";
  properties: {
    teamId: string;
    projectId: string;
    deploymentId: string;
  };
}

export type DeploymentToken =
  | RepositoryDownloadToken
  | ArtifactUploadToken
  | CompleteDeploymentToken;

export interface JWTContext {
  verify: <T extends DeploymentToken["type"]>(
    type: T
  ) => Promise<Extract<DeploymentToken, { type: T }>>;
}

export class JWT {
  private secret: Uint8Array;

  static middleware() {
    return createMiddleware<{ Bindings: Env; Variables: { jwt: JWTContext } }>(
      async (c, next) => {
        const token = c.req.header("Authorization")?.split(" ")[1];
        if (!token) {
          throw new APIError({
            code: "UNAUTHORIZED",
            message: "Missing bearer token",
          });
        }
        const jwt = new JWT(c.env.DEPLOYMENT_JWT_SECRET);
        c.set("jwt", {
          verify: (type) => jwt.verify(type, token),
        });
        await next();
      }
    );
  }

  constructor(secret: string) {
    this.secret = new TextEncoder().encode(secret);
  }

  async sign(payload: DeploymentToken) {
    return new SignJWT(payload as DeploymentToken & JWTPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(this.secret);
  }

  async verify<T extends DeploymentToken["type"]>(
    type: T,
    token: string
  ): Promise<Extract<DeploymentToken, { type: T }>> {
    try {
      const { payload } = await jwtVerify<
        Extract<DeploymentToken, { type: T }>
      >(token, this.secret);
      if (payload.type !== type) {
        throw new APIError({
          code: "UNAUTHORIZED",
          message: "Invalid token type",
        });
      }
      return payload;
    } catch (error) {
      if (error instanceof JWTExpired) {
        throw new APIError({
          code: "UNAUTHORIZED",
          message: "Token expired",
        });
      }
      throw new APIError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  }
}
