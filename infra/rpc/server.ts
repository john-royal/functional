import type { RPCRequest } from "./types";
import { BuildProvider } from "./providers/build";
import { WorkerAssetsProvider } from "./providers/worker-assets";

const resources = {
  build: new BuildProvider(),
  WorkerAssets: new WorkerAssetsProvider(),
};

Bun.serve({
  port: 5999,
  async fetch(req) {
    const body = (await req.json()) as RPCRequest<any>;
    if (!body.method) {
      return Response.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "Invalid request",
          },
          id: body.id,
        },
        { status: 400 }
      );
    }
    const [resource, method] = body.method.split(".");
    if (!resource || !method) {
      return Response.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "Invalid method",
          },
          id: body.id,
        },
        { status: 400 }
      );
    }
    if (!(resource in resources)) {
      return Response.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: "Method not found",
          },
          id: body.id,
        },
        { status: 404 }
      );
    }
    const handler = resources[resource as keyof typeof resources];
    if (!(method in handler)) {
      return Response.json({
        jsonrpc: "2.0",
        result: null,
        id: body.id,
      });
    }
    if (!Array.isArray(body.params)) {
      return Response.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32602,
            message: "Invalid params",
          },
          id: body.id,
        },
        { status: 400 }
      );
    }
    const params = body.params as any[];
    // @ts-expect-error
    const result = await handler[method as keyof typeof handler](...params);
    return Response.json({
      jsonrpc: "2.0",
      result,
      id: body.id,
    });
  },
});
