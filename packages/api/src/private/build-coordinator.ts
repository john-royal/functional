import { DurableObject } from "cloudflare:workers";
import type { Env } from "./types";
import type { SelectModel } from "@functional/db";

export class BuildCoordinator extends DurableObject<Env> {
  async start(deployment: SelectModel<"deployments">) {
    // 1. Generate build token
    // 2. Start build container
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const { 0: client, 1: server } = new WebSocketPair();
      this.ctx.acceptWebSocket(server);
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    return new Response(null, { status: 204 });
  }

  webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer
  ): void | Promise<void> {}

  webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): void | Promise<void> {}

  webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {}
}
