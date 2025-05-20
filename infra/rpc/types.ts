export interface RPCResponse<T> {
  jsonrpc: "2.0";
  result: T;
  id: number;
}

export interface RPCRequest<T> {
  jsonrpc: "2.0";
  method: string;
  params: T;
  id: number;
}

export interface RPCError {
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
  };
  id: number;
}
