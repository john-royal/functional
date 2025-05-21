import type { WorkerMetadataInput } from "@functional/cloudflare-utils/validators";
import type {
  WorkerScriptProps,
  WorkerScriptState,
} from "../resources/worker-script";
import { cloudflare } from "./common";

export class WorkerScriptProvider
  implements
    $util.dynamic.ResourceProvider<WorkerScriptProps, WorkerScriptState>
{
  async create(
    props: WorkerScriptProps
  ): Promise<$util.dynamic.CreateResult<WorkerScriptState>> {
    const worker = await cloudflare.putWorker({
      scriptName: props.name,
      metadata: props.options,
      files: props.files ?? [],
    });

    return {
      id: props.name,
      outs: {
        ...props,
        worker,
      },
    };
  }

  async update(
    id: string,
    state: WorkerScriptState,
    props: WorkerScriptProps
  ): Promise<$util.dynamic.UpdateResult<WorkerScriptState>> {
    const input: WorkerMetadataInput = {
      compatibility_date: "2024-05-01",
      compatibility_flags: ["nodejs_compat"],
      ...props.options,
    };

    if (
      props.options?.assets?.jwt &&
      props.options.assets.jwt === state.options?.assets?.jwt
    ) {
      input.keep_assets = true;
    } else {
      input.assets = props.options?.assets;
    }

    const worker = await cloudflare.putWorker({
      scriptName: props.name,
      metadata: input,
      files: props.files,
    });

    return { outs: { ...props, worker } };
  }

  async diff(
    id: string,
    state: WorkerScriptState,
    props: WorkerScriptProps
  ): Promise<$util.dynamic.DiffResult> {
    const { worker: _, ...oldProps } = state;
    return {
      changes: !Bun.deepEquals(oldProps, props),
    };
  }

  async read(
    id: string,
    props?: WorkerScriptState
  ): Promise<$util.dynamic.ReadResult<WorkerScriptState>> {
    const worker = await cloudflare.getWorker({
      scriptName: id,
    });
    return {
      props: {
        name: id,
        ...props,
        worker,
      },
    };
  }

  async delete(id: string, state: WorkerScriptState): Promise<void> {
    await cloudflare.deleteWorker({
      scriptName: id,
    });
  }
}
