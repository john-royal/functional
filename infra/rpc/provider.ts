import type { RPCRequest, RPCResponse, RPCError } from "./types";

export class RPCProvider<Inputs, Outputs>
  implements $util.dynamic.ResourceProvider
{
  constructor(
    readonly resource: string,
    readonly url: string = "http://localhost:5999"
  ) {}

  async create(inputs: Inputs): Promise<$util.dynamic.CreateResult<Outputs>> {
    const result = await this.request<
      [Inputs],
      $util.dynamic.CreateResult<Outputs>
    >(`${this.resource}.create`, [inputs]);
    return result;
  }

  async read(
    id: string,
    props: Outputs
  ): Promise<$util.dynamic.ReadResult<Outputs>> {
    const result = await this.request<
      [string, Outputs],
      $util.dynamic.ReadResult<Outputs>
    >(`${this.resource}.read`, [id, props]);
    return result;
  }

  async diff(
    id: string,
    olds: Outputs,
    news: Inputs
  ): Promise<$util.dynamic.DiffResult> {
    const result = await this.request<
      [string, Outputs, Inputs],
      $util.dynamic.DiffResult
    >(`${this.resource}.diff`, [id, olds, news]);
    return result;
  }

  async update(
    id: string,
    olds: Outputs,
    news: Inputs
  ): Promise<$util.dynamic.UpdateResult<Outputs>> {
    const result = await this.request<
      [string, Outputs, Inputs],
      $util.dynamic.UpdateResult<Outputs>
    >(`${this.resource}.update`, [id, olds, news]);
    return result;
  }

  async delete(id: string, props: Outputs): Promise<void> {
    await this.request<[string, Outputs], void>(`${this.resource}.delete`, [
      id,
      props,
    ]);
  }

  async request<TParams, TResult>(
    method: string,
    params: TParams
  ): Promise<TResult> {
    const request: RPCRequest<TParams> = {
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    };
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    const result = (await response.json()) as RPCResponse<TResult> | RPCError;
    if ("error" in result) {
      throw new Error(result.error.message);
    }
    return result.result;
  }
}
