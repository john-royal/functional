import type { Subject } from "@functional/auth/client";
import type { Database } from "@functional/db/neon";
import { createRoute } from "@hono/zod-openapi";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { App } from "octokit";

interface Bindings {
  DB: Database;
  AUTH: Fetcher;
  HYPERDRIVE: Hyperdrive;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  LOCAL?: boolean;
}

interface Variables {
  subject: Subject;
  github: App;
}

export interface HonoEnv {
  Bindings: Bindings;
  Variables: Variables;
}

export type HonoContext<TPath extends string> = Context<HonoEnv, TPath>;

export const defineRoute: typeof createRoute = (route) => {
  return createRoute({
    ...route,
    responses: {
      ...route.responses,
      default: {
        $ref: "#/components/responses/ErrorResponse",
      },
    },
  });
};

const HTTP_ERRORS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

type HTTPErrorCode = keyof typeof HTTP_ERRORS;

interface APIErrorProps {
  code: HTTPErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export class APIError extends HTTPException implements APIErrorProps {
  code: HTTPErrorCode;
  details?: Record<string, unknown>;

  constructor(props: APIErrorProps) {
    super(HTTP_ERRORS[props.code], {
      message: props.message,
    });
    this.code = props.code;
    this.details = props.details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  static fromUnknown(error: unknown) {
    if (error instanceof APIError) {
      return error;
    }
    if (error instanceof HTTPException) {
      return new APIError({
        code: (Object.keys(HTTP_ERRORS).find(
          (key) => HTTP_ERRORS[key as HTTPErrorCode] === error.status
        ) ?? "INTERNAL_SERVER_ERROR") as HTTPErrorCode,
        message: error.message,
        details: {
          cause: error,
        },
      });
    }
    if (error instanceof Error) {
      return new APIError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
        details: {
          cause: error,
        },
      });
    }
    if (typeof error === "string") {
      return new APIError({
        code: "INTERNAL_SERVER_ERROR",
        message: error,
      });
    }
    return new APIError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unknown error occurred",
      details: {
        cause: error,
      },
    });
  }
}
