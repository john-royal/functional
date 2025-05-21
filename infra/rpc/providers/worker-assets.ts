import { readAssets } from "@functional/cloudflare-utils/assets";
import type { AssetsUploadSession } from "@functional/cloudflare-utils/validators";
import { join } from "path";
import type {
  WorkerAssetsArgs,
  WorkerAssetsState,
} from "../resources/worker-assets";
import { cloudflare, cwd } from "./common";

export class WorkerAssetsProvider
  implements $util.dynamic.ResourceProvider<WorkerAssetsArgs, WorkerAssetsState>
{
  async create(
    args: WorkerAssetsArgs
  ): Promise<$util.dynamic.CreateResult<WorkerAssetsState>> {
    const { manifest, files } = await readAssets(join(cwd, args.path));
    const uploadSession = await cloudflare.createAssetsUploadSession({
      scriptName: args.scriptName,
      manifest,
    });
    let jwt = uploadSession?.jwt;
    if (uploadSession?.jwt && uploadSession?.buckets) {
      jwt = await cloudflare.uploadAssets(
        uploadSession as AssetsUploadSession,
        files
      );
    }
    return {
      id: args.scriptName + "-assets",
      outs: {
        scriptName: args.scriptName,
        path: args.path,
        manifest,
        assets: {
          jwt,
          config: args.config,
        },
      },
    };
  }

  async update(
    id: $util.ID,
    olds: WorkerAssetsState,
    news: WorkerAssetsArgs
  ): Promise<$util.dynamic.UpdateResult<WorkerAssetsState>> {
    const { outs } = await this.create(news);
    return {
      outs,
    };
  }

  async diff(
    id: $util.ID,
    olds: WorkerAssetsState,
    news: WorkerAssetsArgs
  ): Promise<$util.dynamic.DiffResult> {
    if (
      olds.path !== news.path ||
      olds.scriptName !== news.scriptName ||
      !Bun.deepEquals(olds.config, news.config)
    ) {
      return {
        changes: true,
      };
    }
    const { manifest: newManifest } = await readAssets(join(cwd, news.path));
    if (Bun.deepEquals(olds.manifest, newManifest)) {
      return {
        changes: false,
      };
    }
    return {
      changes: true,
    };
  }
}
