import path from "node:path";
import type { RawConfig } from "./types";
import { WranglerJson, type Input } from "./wrangler-json";

export interface WranglerProps {
  directory: string;
  config: Input<RawConfig>;
  secrets?: Record<string, $util.Input<string>>;
  dev?: {
    port: number;
  };
  build?: {
    command: string;
    environment?: Record<string, $util.Input<string>>;
  };
}

export class Wrangler extends $util.ComponentResource<WranglerProps> {
  public readonly scriptName: $util.Output<string>;
  declare public readonly dev: $util.Output<
    | {
        port: number;
      }
    | undefined
  >;
  declare public readonly config: $util.Output<RawConfig>;
  declare public readonly path: $util.Output<string>;

  private readonly wranglerJson: WranglerJson;

  constructor(
    name: string,
    props: WranglerProps,
    opts?: $util.ComponentResourceOptions
  ) {
    super(__pulumiType, name, props, opts);
    this.scriptName = $util
      .output(props.config.name)
      .apply((scriptName) => (scriptName ?? name).toLowerCase());
    this.wranglerJson = new WranglerJson(
      `${name}WranglerJson`,
      {
        path: $interpolate`${props.directory}/${this.scriptName}`,
        config: {
          ...props.config,
          name: this.scriptName,
        },
        secrets: props.secrets,
      },
      {
        parent: this,
      }
    );
    if (!$dev) {
      const commands: command.local.Command[] = [];
      const dir = path.join($cli.paths.root, props.directory);
      if (props.secrets) {
        commands.push(
          new command.local.Command(
            `${name}SecretsCommand`,
            {
              create: $interpolate`wrangler secret bulk --name ${this.scriptName} .dev.vars.${this.scriptName}`,
              dir,
              triggers: [props.secrets],
            },
            { parent: this, dependsOn: [this.wranglerJson] }
          )
        );
      }
      if (props.build) {
        commands.push(
          new command.local.Command(
            `${name}BuildCommand`,
            {
              create: props.build.command,
              update: props.build.command,
              dir,
              environment: props.build.environment,
            },
            { parent: this, dependsOn: [this.wranglerJson] }
          )
        );
      }
      new command.local.Command(
        `${name}DeployCommand`,
        {
          create: $interpolate`wrangler deploy -c ${this.scriptName}.wrangler.jsonc`,
          update: $interpolate`wrangler deploy -c ${this.scriptName}.wrangler.jsonc`,
          dir,
        },
        { parent: this, dependsOn: commands }
      );
    }
    const { main: _, ...trigger } = props.config;
    new command.local.Command(
      `${name}TypesCommand`,
      {
        create: $interpolate`wrangler types ${this.scriptName}.d.ts --env ${this.scriptName} --env-interface ${name}Env --config ${this.scriptName}.wrangler.jsonc --strict-vars=false`,
        dir: path.join($cli.paths.root, props.directory),
        triggers: [trigger, props.secrets],
      },
      { parent: this, dependsOn: [this.wranglerJson] }
    );
    if (props.dev) {
      new sst.x.DevCommand(
        `${name}DevCommand`,
        {
          dev: {
            title: name,
            command: $interpolate`wrangler dev --remote --port ${props.dev.port} --inspector-port ${9000 + props.dev.port} --config ${this.scriptName}.wrangler.jsonc --env ${this.scriptName}`,
            directory: props.directory,
          },
        },
        { parent: this, dependsOn: [this.wranglerJson] }
      );
    }
    this.registerOutputs({
      dev: this.dev,
      config: this.wranglerJson.config,
      path: this.wranglerJson.path,
    });
  }

  get url() {
    if ($dev) {
      return this.dev.apply((dev) => {
        if (!dev) {
          throw new Error("Dev is not set");
        }
        return $interpolate`http://localhost:${dev.port}`;
      });
    }
    return $interpolate`https://${this.scriptName}.johnroyal.workers.dev`;
  }
}
const __pulumiType = "functional:functional:wrangler";
// @ts-expect-error
Wrangler.__pulumiType = __pulumiType;
