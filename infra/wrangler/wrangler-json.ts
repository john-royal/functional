import * as wrangler from "./types";

export interface WranglerJsonProps {
  path: string;
  config: wrangler.RawConfig;
  secrets?: Record<string, string>;
}

class WranglerJsonProvider
  implements
    $util.dynamic.ResourceProvider<WranglerJsonProps, WranglerJsonProps>
{
  async create(props: WranglerJsonProps) {
    await this.write(props);
    return {
      id: props.config.name!,
      outs: props,
    };
  }

  async update(id: string, olds: WranglerJsonProps, news: WranglerJsonProps) {
    await this.write(news);
    return {
      id,
      outs: news,
    };
  }

  async diff(id: string, olds: WranglerJsonProps, news: WranglerJsonProps) {
    const { isDeepStrictEqual } = await import("util");
    const changes = !isDeepStrictEqual(olds, news);
    return { changes };
  }

  async delete(id: string, props: WranglerJsonProps) {
    const { unlink } = await import("fs/promises");
    const { wrangler, env } = await this.resolve(props);
    await unlink(wrangler).catch(() => {});
    await unlink(env).catch(() => {});
  }

  private async write(props: WranglerJsonProps) {
    const { writeFile } = await import("fs/promises");
    const { wrangler, env } = await this.resolve(props);
    await writeFile(wrangler, JSON.stringify(props.config, null, 2));
    if (props.secrets) {
      await writeFile(
        env,
        Object.entries(props.secrets)
          .map(([key, value]) => `${key}="${value}"`)
          .join("\n")
      );
    }
  }

  private async resolve(props: WranglerJsonProps) {
    const { dirname, join } = await import("path");
    const wrangler = join($cli.paths.root, `${props.path}.wrangler.jsonc`);
    const env = join(dirname(wrangler), `.dev.vars.${props.config.name}`);
    return { wrangler, env };
  }
}

type Primitive = string | number | boolean | null | undefined;
export type Input<T> = T extends Primitive
  ? $util.Input<T>
  : T extends (infer U)[]
    ? Input<U>[]
    : { [K in keyof T]: Input<T[K]> };

export class WranglerJson extends $util.dynamic.Resource {
  declare public readonly path: $util.Output<string>;
  declare public readonly config: $util.Output<wrangler.RawConfig>;

  constructor(
    name: string,
    props: Input<WranglerJsonProps>,
    opts?: $util.CustomResourceOptions
  ) {
    super(new WranglerJsonProvider(), name, props, opts);
  }
}
