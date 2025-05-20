import path from "path";
import { Build } from "./build";
import { readFile } from "fs/promises";

type WorkerBinding =
  | Omit<cloudflare.types.input.WorkersScriptBinding, "name">
  | string
  | sst.Secret
  | cloudflare.HyperdriveConfig
  | cloudflare.WorkersForPlatformsDispatchNamespace
  | cloudflare.WorkersKvNamespace
  | cloudflare.WorkersScript;

export interface WorkerProps
  extends Omit<
    cloudflare.WorkersScriptArgs,
    "accountId" | "content" | "mainModule" | "bindings"
  > {
  handler: {
    path: string;
    cwd: string;
    bundle?: boolean;
  };
  subdomain?: boolean;
  bindings?: Record<string, WorkerBinding>;
}

export function createWorker(name: string, props: WorkerProps) {
  let scriptPath: $util.Output<string>;
  const dependsOn: $util.Resource[] = [];
  if (props.handler.bundle !== false) {
    const build = new Build(`${name}-build`, {
      name,
      entry: path.join(props.handler.cwd, props.handler.path),
      outdir: path.join(props.handler.cwd, "dist", name),
    });
    dependsOn.push(build);
    scriptPath = build.scriptPath;
  } else {
    scriptPath = $util.output(path.join(props.handler.cwd, props.handler.path));
  }
  const content = scriptPath.apply((path) => readFile(path, "utf-8"));
  const worker = new cloudflare.WorkersScript(
    `${name}`,
    {
      ...props,
      mainModule: "index.js",
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
      content,
      bindings: props.bindings
        ? formatWorkerBindings(props.bindings)
        : undefined,
    },
    { dependsOn }
  );
  new cloudflare.WorkersScriptSubdomain(
    `${name}-subdomain`,
    {
      scriptName: worker.scriptName,
      enabled: props.subdomain ?? false,
      accountId: sst.cloudflare.DEFAULT_ACCOUNT_ID,
    },
    { dependsOn: [worker] }
  );
  return {
    worker,
  };
}

function formatWorkerBindings(
  bindings: $util.Input<Record<string, WorkerBinding>>
): cloudflare.types.input.WorkersScriptBinding[] {
  return Object.entries(bindings).map(
    ([name, binding]): cloudflare.types.input.WorkersScriptBinding => {
      if (typeof binding === "string") {
        return {
          name,
          type: "plain_text",
          text: binding,
        };
      }
      if (binding instanceof sst.Secret) {
        return {
          name,
          type: "secret_text",
          text: $util.secret(binding.value),
        };
      }
      if (binding instanceof cloudflare.HyperdriveConfig) {
        return {
          name,
          type: "hyperdrive",
          id: binding.id,
        };
      }
      if (binding instanceof cloudflare.WorkersForPlatformsDispatchNamespace) {
        return {
          name,
          type: "dispatch_namespace",
          namespace: binding.name.apply((name) => name!),
        };
      }
      if (binding instanceof cloudflare.WorkersKvNamespace) {
        return {
          name,
          type: "kv_namespace",
          namespaceId: binding.id,
        };
      }
      if (binding instanceof cloudflare.WorkersScript) {
        return {
          name,
          type: "service",
          service: binding.scriptName,
        };
      }
      return {
        name,
        ...binding,
      };
    }
  );
}
