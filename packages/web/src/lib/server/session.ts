import { useSession } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

interface AppSession {
  team?: string;
  challenge?: { state: string; verifier?: string };
}

export function useAppSession() {
  return useSession<AppSession>({
    password: env.SESSION_SECRET,
  });
}
