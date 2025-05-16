import { DurableObject } from "cloudflare:workers";
import type { Env } from "./types";

export class BuildCoordinator extends DurableObject<Env> {
  async fetch(request: Request) {
    return new Response("test");
  }
}
