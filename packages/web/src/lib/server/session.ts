import { useSession } from "@tanstack/react-start/server";
import { serverEnv } from "./env.server";
interface AppSession {
  team?: string;
  challenge?: { state: string; verifier?: string };
}

export function useAppSession() {
  return useSession<AppSession>({
    password: serverEnv.SESSION_SECRET,
  });
}
