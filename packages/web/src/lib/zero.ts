import { Zero, type ZeroOptions } from "@functional/zero";
import { type Schema, schema } from "@functional/zero/schema";
import { clientEnv } from "./env";
import { authState } from "./server/auth";

interface CreateZeroOptions
  extends Omit<ZeroOptions<Schema>, "auth" | "schema"> {
  userID: string;
  token: string | undefined;
}

let _zero: Zero<Schema> | undefined;

function createServerZero({ token, ...options }: CreateZeroOptions) {
  return new Zero({
    ...options,
    auth: token,
    schema,
    kvStore: "mem",
    logLevel: "error",
  });
}

function createClientZero({ token, ...options }: CreateZeroOptions) {
  let currentToken = token;
  _zero ??= new Zero({
    ...options,
    auth: async (error) => {
      if (error) {
        const state = await authState();
        currentToken = state?.token;
      }
      return currentToken;
    },
    schema,
    server: clientEnv.VITE_ZERO_URL,
    kvStore: "idb",
  });
  return _zero;
}

export function getZero(options: CreateZeroOptions) {
  return typeof window === "undefined"
    ? createServerZero(options)
    : createClientZero(options);
}
