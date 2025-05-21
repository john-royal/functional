export interface RawConfig {
  $schema?: string;
  /**
   * The `env` section defines overrides for the configuration for different environments.
   *
   * All environment fields can be specified at the top level of the config indicating the default environment settings.
   *
   * - Some fields are inherited and overridable in each environment.
   * - But some are not inherited and must be explicitly specified in every environment, if they are specified at the top level.
   *
   * For more information, see the documentation at https://developers.cloudflare.com/workers/cli-wrangler/configuration#environments
   */
  env?: Record<string, RawEnvironment>;
  /**
   * The name of your Worker. Alphanumeric + dashes only.
   */
  name?: string;
  /**
   * This is the ID of the account associated with your zone. You might have more than one account, so make sure to use the ID of the account associated with the zone/route you provide, if you provide one. It can also be specified through the CLOUDFLARE_ACCOUNT_ID environment variable.
   */
  account_id?: string;
  /**
   * A date in the form yyyy-mm-dd, which will be used to determine which version of the Workers runtime is used.
   *
   * More details at https://developers.cloudflare.com/workers/configuration/compatibility-dates
   */
  compatibility_date?: string;
  /**
   * A list of flags that enable features from upcoming features of the Workers runtime, usually used together with compatibility_date.
   *
   * More details at https://developers.cloudflare.com/workers/configuration/compatibility-flags/
   */
  compatibility_flags?: string[];
  /**
   * The entrypoint/path to the JavaScript file that will be executed.
   */
  main?: string;
  /**
   * If true then Wrangler will traverse the file tree below `base_dir`; Any files that match `rules` will be included in the deployed Worker. Defaults to true if `no_bundle` is true, otherwise false.
   */
  find_additional_modules?: boolean;
  /**
   * Determines whether Wrangler will preserve bundled file names. Defaults to false. If left unset, files will be named using the pattern ${fileHash}-${basename}, for example, `34de60b44167af5c5a709e62a4e20c4f18c9e3b6-favicon.ico`.
   */
  preserve_file_names?: boolean;
  /**
   * The directory in which module rules should be evaluated when including additional files into a Worker deployment. This defaults to the directory containing the `main` entry point of the Worker if not specified.
   */
  base_dir?: string;
  /**
   * Whether we use <name>.<subdomain>.workers.dev to test and deploy your Worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
   */
  workers_dev?: boolean;
  /**
   * Whether we use <version>-<name>.<subdomain>.workers.dev to serve Preview URLs for your Worker.
   */
  preview_urls?: boolean;
  /**
   * A list of routes that your Worker should be published to. Only one of `routes` or `route` is required.
   *
   * Only required when workers_dev is false, and there's no scheduled Worker (see `triggers`)
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#types-of-routes
   */
  routes?: Route[];
  /**
   * A route that your Worker should be published to. Literally the same as routes, but only one. Only one of `routes` or `route` is required.
   *
   * Only required when workers_dev is false, and there's no scheduled Worker
   */
  route?: Route;
  /**
   * Path to a custom tsconfig
   */
  tsconfig?: string;
  /**
   * The function to use to replace jsx syntax.
   */
  jsx_factory?: string;
  /**
   * The function to use to replace jsx fragment syntax.
   */
  jsx_fragment?: string;
  /**
   * A list of migrations that should be uploaded with your Worker.
   *
   * These define changes in your Durable Object declarations.
   *
   * More details at https://developers.cloudflare.com/workers/learning/using-durable-objects#configuring-durable-object-classes-with-migrations
   */
  migrations?: DurableObjectMigration[];
  /**
   * "Cron" definitions to trigger a Worker's "scheduled" function.
   *
   * Lets you call Workers periodically, much like a cron job.
   *
   * More details here https://developers.cloudflare.com/workers/platform/cron-triggers
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers
   */
  triggers?: {
    crons?: string[];
  };
  /**
   * Specify limits for runtime behavior. Only supported for the "standard" Usage Model
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#limits
   */
  limits?: UserLimits;
  /**
   * An ordered list of rules that define which modules to import, and what type to import them as. You will need to specify rules to use Text, Data, and CompiledWasm modules, or when you wish to have a .js file be treated as an ESModule instead of CommonJS.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#bundling
   */
  rules?: Rule[];
  /**
   * Configures a custom build step to be run by Wrangler when building your Worker.
   *
   * Refer to the [custom builds documentation](https://developers.cloudflare.com/workers/cli-wrangler/configuration#build) for more details.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#custom-builds
   */
  build?: {
    /**
     * The command used to build your Worker. On Linux and macOS, the command is executed in the `sh` shell and the `cmd` shell for Windows. The `&&` and `||` shell operators may be used.
     */
    command?: string;
    /**
     * The directory in which the command is executed.
     */
    cwd?: string;
    /**
     * The directory to watch for changes while using wrangler dev, defaults to the current working directory
     */
    watch_dir?: string | string[];
  };
  /**
   * Skip internal build steps and directly deploy script
   */
  no_bundle?: boolean;
  /**
   * Minify the script before uploading.
   */
  minify?: boolean;
  /**
   * Keep function names after javascript transpilations.
   */
  keep_names?: boolean;
  /**
   * Designates this Worker as an internal-only "first-party" Worker.
   */
  first_party_worker?: boolean;
  /**
   * List of bindings that you will send to logfwdr
   */
  logfwdr?: {
    bindings: Array<{
      /**
       * The binding name used to refer to logfwdr
       */
      name: string;
      /**
       * The destination for this logged message
       */
      destination: string;
    }>;
  };
  /**
   * Send Trace Events from this Worker to Workers Logpush.
   *
   * This will not configure a corresponding Logpush job automatically.
   *
   * For more information about Workers Logpush, see: https://blog.cloudflare.com/logpush-for-workers/
   */
  logpush?: boolean;
  /**
   * Include source maps when uploading this worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#source-maps
   */
  upload_source_maps?: boolean;
  /**
   * Specify how the Worker should be located to minimize round-trip time.
   *
   * More details: https://developers.cloudflare.com/workers/platform/smart-placement/
   */
  placement?: {
    mode: "off" | "smart";
    hint?: string;
  };
  /**
   * Specify the directory of static assets to deploy/serve
   *
   * More details at https://developers.cloudflare.com/workers/frameworks/
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#assets
   */
  assets?: Assets;
  /**
   * Specify the observability behavior of the Worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#observability
   */
  observability?: Observability;
  /**
   * A map of values to substitute when deploying your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  define?: Record<string, string>;
  /**
   * A map of environment variables to set when deploying your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables
   */
  vars?: Record<string, Json>;
  /**
   * A list of durable objects that your Worker should be bound to.
   *
   * For more information about Durable Objects, see the documentation at https://developers.cloudflare.com/workers/learning/using-durable-objects
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#durable-objects
   */
  durable_objects?: {
    bindings: DurableObjectBindings;
  };
  /**
   * A list of workflows that your Worker should be bound to.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  workflows?: WorkflowBinding[];
  /**
   * Cloudchamber configuration
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  cloudchamber?: CloudchamberConfig;
  /**
   * Container related configuration
   */
  containers?: ContainerApp[];
  /**
   * These specify any Workers KV Namespaces you want to access from inside your Worker.
   *
   * To learn more about KV Namespaces, see the documentation at https://developers.cloudflare.com/workers/learning/how-kv-works
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#kv-namespaces
   */
  kv_namespaces?: Array<{
    /**
     * The binding name used to refer to the KV Namespace
     */
    binding: string;
    /**
     * The ID of the KV namespace
     */
    id?: string;
    /**
     * The ID of the KV namespace used during `wrangler dev`
     */
    preview_id?: string;
    /**
     * Whether the KV namespace should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * These specify bindings to send email from inside your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#email-bindings
   */
  send_email?: Array<{
    /**
     * The binding name used to refer to the this binding
     */
    name: string;
    /**
     * If this binding should be restricted to a specific verified address
     */
    destination_address?: string;
    /**
     * If this binding should be restricted to a set of verified addresses
     */
    allowed_destination_addresses?: string[];
  }>;
  /**
   * Specifies Queues that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#queues
   */
  queues?: {
    /**
     * Producer bindings
     */
    producers?: Array<{
      /**
       * The binding name used to refer to the Queue in the Worker.
       */
      binding: string;
      /**
       * The name of this Queue.
       */
      queue: string;
      /**
       * The number of seconds to wait before delivering a message
       */
      delivery_delay?: number;
      /**
       * Whether the Queue producer should be remote or not (only available under `--x-mixed-mode`)
       */
      remote?: boolean;
    }>;
    /**
     * Consumer configuration
     */
    consumers?: Array<{
      /**
       * The name of the queue from which this consumer should consume.
       */
      queue: string;
      /**
       * The consumer type, e.g., worker, http-pull, r2-bucket, etc. Default is worker.
       */
      type?: string;
      /**
       * The maximum number of messages per batch
       */
      max_batch_size?: number;
      /**
       * The maximum number of seconds to wait to fill a batch with messages.
       */
      max_batch_timeout?: number;
      /**
       * The maximum number of retries for each message.
       */
      max_retries?: number;
      /**
       * The queue to send messages that failed to be consumed.
       */
      dead_letter_queue?: string;
      /**
       * The maximum number of concurrent consumer Worker invocations. Leaving this unset will allow your consumer to scale to the maximum concurrency needed to keep up with the message backlog.
       */
      max_concurrency?: number | null;
      /**
       * The number of milliseconds to wait for pulled messages to become visible again
       */
      visibility_timeout_ms?: number;
      /**
       * The number of seconds to wait before retrying a message
       */
      retry_delay?: number;
    }>;
  };
  /**
   * Specifies R2 buckets that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#r2-buckets
   */
  r2_buckets?: Array<{
    /**
     * The binding name used to refer to the R2 bucket in the Worker.
     */
    binding: string;
    /**
     * The name of this R2 bucket at the edge.
     */
    bucket_name?: string;
    /**
     * The preview name of this R2 bucket at the edge.
     */
    preview_bucket_name?: string;
    /**
     * The jurisdiction that the bucket exists in. Default if not present.
     */
    jurisdiction?: string;
    /**
     * Whether the R2 bucket should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * Specifies D1 databases that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases
   */
  d1_databases?: Array<{
    /**
     * The binding name used to refer to the D1 database in the Worker.
     */
    binding: string;
    /**
     * The name of this D1 database.
     */
    database_name?: string;
    /**
     * The UUID of this D1 database (not required).
     */
    database_id?: string;
    /**
     * The UUID of this D1 database for Wrangler Dev (if specified).
     */
    preview_database_id?: string;
    /**
     * The name of the migrations table for this D1 database (defaults to 'd1_migrations').
     */
    migrations_table?: string;
    /**
     * The path to the directory of migrations for this D1 database (defaults to './migrations').
     */
    migrations_dir?: string;
    /**
     * Internal use only.
     */
    database_internal_env?: string;
    /**
     * Whether the D1 database should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * Specifies Vectorize indexes that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#vectorize-indexes
   */
  vectorize?: Array<{
    /**
     * The binding name used to refer to the Vectorize index in the Worker.
     */
    binding: string;
    /**
     * The name of the index.
     */
    index_name: string;
  }>;
  /**
   * Specifies Hyperdrive configs that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#hyperdrive
   */
  hyperdrive?: Array<{
    /**
     * The binding name used to refer to the project in the Worker.
     */
    binding: string;
    /**
     * The id of the database.
     */
    id: string;
    /**
     * The local database connection string for `wrangler dev`
     */
    localConnectionString?: string;
  }>;
  /**
   * Specifies service bindings (Worker-to-Worker) that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#service-bindings
   */
  services?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * The name of the service.
     */
    service: string;
    /**
     * The environment of the service (e.g. production, staging, etc).
     */
    environment?: string;
    /**
     * Optionally, the entrypoint (named export) of the service to bind to.
     */
    entrypoint?: string;
    /**
     * Optional properties that will be made available to the service via ctx.props.
     */
    props?: Record<string, unknown>;
    /**
     * Whether the service binding should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * Specifies analytics engine datasets that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#analytics-engine-datasets
   */
  analytics_engine_datasets?: Array<{
    /**
     * The binding name used to refer to the dataset in the Worker.
     */
    binding: string;
    /**
     * The name of this dataset to write to.
     */
    dataset?: string;
  }>;
  /**
   * A browser that will be usable from the Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#browser-rendering
   */
  browser?: {
    binding: string;
  };
  /**
   * Binding to the AI project.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workers-ai
   */
  ai?: {
    binding: string;
    staging?: boolean;
  };
  /**
   * Binding to Cloudflare Images
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#images
   */
  images?: {
    binding: string;
  };
  /**
   * Binding to the Worker Version's metadata
   */
  version_metadata?: {
    binding: string;
  };
  /**
   * "Unsafe" tables for features that aren't directly supported by wrangler.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  unsafe?: {
    /**
     * A set of bindings that should be put into a Worker's upload metadata without changes. These can be used to implement bindings for features that haven't released and aren't supported directly by wrangler or miniflare.
     */
    bindings?: Array<{
      name: string;
      type: string;
      [key: string]: unknown;
    }>;
    /**
     * Arbitrary key/value pairs that will be included in the uploaded metadata.  Values specified here will always be applied to metadata last, so can add new or override existing fields.
     */
    metadata?: Record<string, unknown>;
    /**
     * Used for internal capnp uploads for the Workers runtime
     */
    capnp?:
      | {
          base_path: string;
          source_schemas: string[];
        }
      | {
          compiled_schema: string;
        };
  };
  /**
   * Specifies a list of mTLS certificates that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#mtls-certificates
   */
  mtls_certificates?: Array<{
    /**
     * The binding name used to refer to the certificate in the Worker
     */
    binding: string;
    /**
     * The uuid of the uploaded mTLS certificate
     */
    certificate_id: string;
  }>;
  /**
   * Specifies a list of Tail Workers that are bound to this Worker environment
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  tail_consumers?: TailConsumer[];
  /**
   * Specifies namespace bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#dispatch-namespace-bindings-workers-for-platforms
   */
  dispatch_namespaces?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * The namespace to bind to.
     */
    namespace: string;
    /**
     * Details about the outbound Worker which will handle outbound requests from your namespace
     */
    outbound?: DispatchNamespaceOutbound;
  }>;
  /**
   * Specifies list of Pipelines bound to this Worker environment
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  pipelines?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * Name of the Pipeline to bind
     */
    pipeline: string;
  }>;
  /**
   * Specifies Secret Store bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  secrets_store_secrets?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * Id of the secret store
     */
    store_id: string;
    /**
     * Name of the secret
     */
    secret_name: string;
  }>;
  /**
   * The directory of static assets to serve.
   *
   * The presence of this field in a Wrangler configuration file indicates a Pages project, and will prompt the handling of the configuration file according to the Pages-specific validation rules.
   */
  pages_build_output_dir?: string;
  /**
   * A boolean to enable "legacy" style wrangler environments (from Wrangler v1). These have been superseded by Services, but there may be projects that won't (or can't) use them. If you're using a legacy environment, you can set this to `true` to enable it.
   */
  legacy_env?: boolean;
  /**
   * Whether Wrangler should send usage metrics to Cloudflare for this project.
   *
   * When defined this will override any user settings. Otherwise, Wrangler will use the user's preference.
   */
  send_metrics?: boolean;
  /**
   * Options to configure the development server that your worker will use.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#local-development-settings
   */
  dev?: RawDevConfig;
  /**
   * The definition of a Worker Site, a feature that lets you upload static assets with your Worker.
   *
   * More details at https://developers.cloudflare.com/workers/platform/sites
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workers-sites
   */
  site?: {
    /**
     * The directory containing your static assets.
     *
     * It must be a path relative to your Wrangler configuration file. Example: bucket = "./public"
     *
     * If there is a `site` field then it must contain this `bucket` field.
     */
    bucket: string;
    /**
     * The location of your Worker script.
     *
     * @deprecated DO NOT use this (it's a holdover from Wrangler v1.x). Either use the top level `main` field, or pass the path to your entry file as a command line argument.
     */
    "entry-point"?: string;
    /**
     * An exclusive list of .gitignore-style patterns that match file or directory names from your bucket location. Only matched items will be uploaded. Example: include = ["upload_dir"]
     */
    include?: string[];
    /**
     * A list of .gitignore-style patterns that match files or directories in your bucket that should be excluded from uploads. Example: exclude = ["ignore_dir"]
     */
    exclude?: string[];
  };
  /**
   * A list of wasm modules that your worker should be bound to. This is the "legacy" way of binding to a wasm module. ES module workers should do proper module imports.
   */
  wasm_modules?: Record<string, string>;
  /**
   * A list of text files that your worker should be bound to. This is the "legacy" way of binding to a text file. ES module workers should do proper module imports.
   */
  text_blobs?: Record<string, string>;
  /**
   * A list of data files that your worker should be bound to. This is the "legacy" way of binding to a data file. ES module workers should do proper module imports.
   */
  data_blobs?: Record<string, string>;
  /**
   * A map of module aliases. Lets you swap out a module for any others. Corresponds with esbuild's `alias` config
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#module-aliasing
   */
  alias?: Record<string, string>;
  /**
   * By default, the Wrangler configuration file is the source of truth for your environment configuration, like a terraform file.
   *
   * If you change your vars in the dashboard, wrangler *will* override/delete them on its next deploy.
   *
   * If you want to keep your dashboard vars when wrangler deploys, set this field to true.
   */
  keep_vars?: boolean;
}

/**
 * The raw environment configuration that we read from the config file.
 *
 * All the properties are optional, and will be replaced with defaults in the configuration that is used in the rest of the codebase.
 */
export interface RawEnvironment {
  /**
   * The name of your Worker. Alphanumeric + dashes only.
   */
  name?: string;
  /**
   * This is the ID of the account associated with your zone. You might have more than one account, so make sure to use the ID of the account associated with the zone/route you provide, if you provide one. It can also be specified through the CLOUDFLARE_ACCOUNT_ID environment variable.
   */
  account_id?: string;
  /**
   * A date in the form yyyy-mm-dd, which will be used to determine which version of the Workers runtime is used.
   *
   * More details at https://developers.cloudflare.com/workers/configuration/compatibility-dates
   */
  compatibility_date?: string;
  /**
   * A list of flags that enable features from upcoming features of the Workers runtime, usually used together with compatibility_date.
   *
   * More details at https://developers.cloudflare.com/workers/configuration/compatibility-flags/
   */
  compatibility_flags?: string[];
  /**
   * The entrypoint/path to the JavaScript file that will be executed.
   */
  main?: string;
  /**
   * If true then Wrangler will traverse the file tree below `base_dir`; Any files that match `rules` will be included in the deployed Worker. Defaults to true if `no_bundle` is true, otherwise false.
   */
  find_additional_modules?: boolean;
  /**
   * Determines whether Wrangler will preserve bundled file names. Defaults to false. If left unset, files will be named using the pattern ${fileHash}-${basename}, for example, `34de60b44167af5c5a709e62a4e20c4f18c9e3b6-favicon.ico`.
   */
  preserve_file_names?: boolean;
  /**
   * The directory in which module rules should be evaluated when including additional files into a Worker deployment. This defaults to the directory containing the `main` entry point of the Worker if not specified.
   */
  base_dir?: string;
  /**
   * Whether we use <name>.<subdomain>.workers.dev to test and deploy your Worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
   */
  workers_dev?: boolean;
  /**
   * Whether we use <version>-<name>.<subdomain>.workers.dev to serve Preview URLs for your Worker.
   */
  preview_urls?: boolean;
  /**
   * A list of routes that your Worker should be published to. Only one of `routes` or `route` is required.
   *
   * Only required when workers_dev is false, and there's no scheduled Worker (see `triggers`)
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#types-of-routes
   */
  routes?: Route[];
  /**
   * A route that your Worker should be published to. Literally the same as routes, but only one. Only one of `routes` or `route` is required.
   *
   * Only required when workers_dev is false, and there's no scheduled Worker
   */
  route?: Route;
  /**
   * Path to a custom tsconfig
   */
  tsconfig?: string;
  /**
   * The function to use to replace jsx syntax.
   */
  jsx_factory?: string;
  /**
   * The function to use to replace jsx fragment syntax.
   */
  jsx_fragment?: string;
  /**
   * A list of migrations that should be uploaded with your Worker.
   *
   * These define changes in your Durable Object declarations.
   *
   * More details at https://developers.cloudflare.com/workers/learning/using-durable-objects#configuring-durable-object-classes-with-migrations
   */
  migrations?: DurableObjectMigration[];
  /**
   * "Cron" definitions to trigger a Worker's "scheduled" function.
   *
   * Lets you call Workers periodically, much like a cron job.
   *
   * More details here https://developers.cloudflare.com/workers/platform/cron-triggers
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers
   */
  triggers?: {
    crons?: string[];
  };
  /**
   * Specify limits for runtime behavior. Only supported for the "standard" Usage Model
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#limits
   */
  limits?: UserLimits;
  /**
   * An ordered list of rules that define which modules to import, and what type to import them as. You will need to specify rules to use Text, Data, and CompiledWasm modules, or when you wish to have a .js file be treated as an ESModule instead of CommonJS.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#bundling
   */
  rules?: Rule[];
  /**
   * Configures a custom build step to be run by Wrangler when building your Worker.
   *
   * Refer to the [custom builds documentation](https://developers.cloudflare.com/workers/cli-wrangler/configuration#build) for more details.
   *
   * For reference, see https://developers.com/workers/wrangler/configuration/#custom-builds
   */
  build?: {
    /**
     * The command used to build your Worker. On Linux and macOS, the command is executed in the `sh` shell and the `cmd` shell for Windows. The `&&` and `||` shell operators may be used.
     */
    command?: string;
    /**
     * The directory in which the command is executed.
     */
    cwd?: string;
    /**
     * The directory to watch for changes while using wrangler dev, defaults to the current working directory
     */
    watch_dir?: string | string[];
  };
  /**
   * Skip internal build steps and directly deploy script
   */
  no_bundle?: boolean;
  /**
   * Minify the script before uploading.
   */
  minify?: boolean;
  /**
   * Keep function names after javascript transpilations.
   */
  keep_names?: boolean;
  /**
   * Designates this Worker as an internal-only "first-party" Worker.
   */
  first_party_worker?: boolean;
  /**
   * List of bindings that you will send to logfwdr
   */
  logfwdr?: {
    bindings: Array<{
      /**
       * The binding name used to refer to logfwdr
       */
      name: string;
      /**
       * The destination for this logged message
       */
      destination: string;
    }>;
  };
  /**
   * Send Trace Events from this Worker to Workers Logpush.
   *
   * This will not configure a corresponding Logpush job automatically.
   *
   * For more information about Workers Logpush, see: https://blog.cloudflare.com/logpush-for-workers/
   */
  logpush?: boolean;
  /**
   * Include source maps when uploading this worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#source-maps
   */
  upload_source_maps?: boolean;
  /**
   * Specify how the Worker should be located to minimize round-trip time.
   *
   * More details: https://developers.cloudflare.com/workers/platform/smart-placement/
   */
  placement?: {
    mode: "off" | "smart";
    hint?: string;
  };
  /**
   * Specify the directory of static assets to deploy/serve
   *
   * More details at https://developers.cloudflare.com/workers/frameworks/
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#assets
   */
  assets?: Assets;
  /**
   * Specify the observability behavior of the Worker.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#observability
   */
  observability?: Observability;
  /**
   * A map of values to substitute when deploying your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  define?: Record<string, string>;
  /**
   * A map of environment variables to set when deploying your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables
   */
  vars?: Record<string, Json>;
  /**
   * A list of durable objects that your Worker should be bound to.
   *
   * For more information about Durable Objects, see the documentation at https://developers.cloudflare.com/workers/learning/using-durable-objects
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#durable-objects
   */
  durable_objects?: {
    bindings: DurableObjectBindings;
  };
  /**
   * A list of workflows that your Worker should be bound to.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  workflows?: WorkflowBinding[];
  /**
   * Cloudchamber configuration
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  cloudchamber?: CloudchamberConfig;
  /**
   * Container related configuration
   */
  containers?: ContainerApp[];
  /**
   * These specify any Workers KV Namespaces you want to access from inside your Worker.
   *
   * To learn more about KV Namespaces, see the documentation at https://developers.cloudflare.com/workers/learning/how-kv-works
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#kv-namespaces
   */
  kv_namespaces?: Array<{
    /**
     * The binding name used to refer to the KV Namespace
     */
    binding: string;
    /**
     * The ID of the KV namespace
     */
    id?: string;
    /**
     * The ID of the KV namespace used during `wrangler dev`
     */
    preview_id?: string;
    /**
     * Whether the KV namespace should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * These specify bindings to send email from inside your Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#email-bindings
   */
  send_email?: Array<{
    /**
     * The binding name used to refer to the this binding
     */
    name: string;
    /**
     * If this binding should be restricted to a specific verified address
     */
    destination_address?: string;
    /**
     * If this binding should be restricted to a set of verified addresses
     */
    allowed_destination_addresses?: string[];
  }>;
  /**
   * Specifies Queues that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#queues
   */
  queues?: {
    /**
     * Producer bindings
     */
    producers?: Array<{
      /**
       * The binding name used to refer to the Queue in the Worker.
       */
      binding: string;
      /**
       * The name of this Queue.
       */
      queue: string;
      /**
       * The number of seconds to wait before delivering a message
       */
      delivery_delay?: number;
      /**
       * Whether the Queue producer should be remote or not (only available under `--x-mixed-mode`)
       */
      remote?: boolean;
    }>;
    /**
     * Consumer configuration
     */
    consumers?: Array<{
      /**
       * The name of the queue from which this consumer should consume.
       */
      queue: string;
      /**
       * The consumer type, e.g., worker, http-pull, r2-bucket, etc. Default is worker.
       */
      type?: string;
      /**
       * The maximum number of messages per batch
       */
      max_batch_size?: number;
      /**
       * The maximum number of seconds to wait to fill a batch with messages.
       */
      max_batch_timeout?: number;
      /**
       * The maximum number of retries for each message.
       */
      max_retries?: number;
      /**
       * The queue to send messages that failed to be consumed.
       */
      dead_letter_queue?: string;
      /**
       * The maximum number of concurrent consumer Worker invocations. Leaving this unset will allow your consumer to scale to the maximum concurrency needed to keep up with the message backlog.
       */
      max_concurrency?: number | null;
      /**
       * The number of milliseconds to wait for pulled messages to become visible again
       */
      visibility_timeout_ms?: number;
      /**
       * The number of seconds to wait before retrying a message
       */
      retry_delay?: number;
    }>;
  };
  /**
   * Specifies R2 buckets that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#r2-buckets
   */
  r2_buckets?: Array<{
    /**
     * The binding name used to refer to the R2 bucket in the Worker.
     */
    binding: string;
    /**
     * The name of this R2 bucket at the edge.
     */
    bucket_name?: string;
    /**
     * The preview name of this R2 bucket at the edge.
     */
    preview_bucket_name?: string;
    /**
     * The jurisdiction that the bucket exists in. Default if not present.
     */
    jurisdiction?: string;
    /**
     * Whether the R2 bucket should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * Specifies D1 databases that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#d1-databases
   */
  d1_databases?: Array<{
    /**
     * The binding name used to refer to the D1 database in the Worker.
     */
    binding: string;
    /**
     * The name of this D1 database.
     */
    database_name?: string;
    /**
     * The UUID of this D1 database (not required).
     */
    database_id?: string;
    /**
     * The UUID of this D1 database for Wrangler Dev (if specified).
     */
    preview_database_id?: string;
    /**
     * The name of the migrations table for this D1 database (defaults to 'd1_migrations').
     */
    migrations_table?: string;
    /**
     * The path to the directory of migrations for this D1 database (defaults to './migrations').
     */
    migrations_dir?: string;
    /**
     * Internal use only.
     */
    database_internal_env?: string;
    /**
     * Whether the D1 database should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * Specifies Vectorize indexes that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#vectorize-indexes
   */
  vectorize?: Array<{
    /**
     * The binding name used to refer to the Vectorize index in the Worker.
     */
    binding: string;
    /**
     * The name of the index.
     */
    index_name: string;
  }>;
  /**
   * Specifies Hyperdrive configs that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#hyperdrive
   */
  hyperdrive?: Array<{
    /**
     * The binding name used to refer to the project in the Worker.
     */
    binding: string;
    /**
     * The id of the database.
     */
    id: string;
    /**
     * The local database connection string for `wrangler dev`
     */
    localConnectionString?: string;
  }>;
  /**
   * Specifies service bindings (Worker-to-Worker) that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#service-bindings
   */
  services?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * The name of the service.
     */
    service: string;
    /**
     * The environment of the service (e.g. production, staging, etc).
     */
    environment?: string;
    /**
     * Optionally, the entrypoint (named export) of the service to bind to.
     */
    entrypoint?: string;
    /**
     * Optional properties that will be made available to the service via ctx.props.
     */
    props?: Record<string, unknown>;
    /**
     * Whether the service binding should be remote or not (only available under `--x-mixed-mode`)
     */
    remote?: boolean;
  }>;
  /**
   * Specifies analytics engine datasets that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#analytics-engine-datasets
   */
  analytics_engine_datasets?: Array<{
    /**
     * The binding name used to refer to the dataset in the Worker.
     */
    binding: string;
    /**
     * The name of this dataset to write to.
     */
    dataset?: string;
  }>;
  /**
   * A browser that will be usable from the Worker.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#browser-rendering
   */
  browser?: {
    binding: string;
  };
  /**
   * Binding to the AI project.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#workers-ai
   */
  ai?: {
    binding: string;
    staging?: boolean;
  };
  /**
   * Binding to Cloudflare Images
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#images
   */
  images?: {
    binding: string;
  };
  /**
   * Binding to the Worker Version's metadata
   */
  version_metadata?: {
    binding: string;
  };
  /**
   * "Unsafe" tables for features that aren't directly supported by wrangler.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  unsafe?: {
    /**
     * A set of bindings that should be put into a Worker's upload metadata without changes. These can be used to implement bindings for features that haven't released and aren't supported directly by wrangler or miniflare.
     */
    bindings?: Array<{
      name: string;
      type: string;
      [key: string]: unknown;
    }>;
    /**
     * Arbitrary key/value pairs that will be included in the uploaded metadata.  Values specified here will always be applied to metadata last, so can add new or override existing fields.
     */
    metadata?: Record<string, unknown>;
    /**
     * Used for internal capnp uploads for the Workers runtime
     */
    capnp?:
      | {
          base_path: string;
          source_schemas: string[];
        }
      | {
          compiled_schema: string;
        };
  };
  /**
   * Specifies a list of mTLS certificates that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#mtls-certificates
   */
  mtls_certificates?: Array<{
    /**
     * The binding name used to refer to the certificate in the Worker
     */
    binding: string;
    /**
     * The uuid of the uploaded mTLS certificate
     */
    certificate_id: string;
  }>;
  /**
   * Specifies a list of Tail Workers that are bound to this Worker environment
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  tail_consumers?: TailConsumer[];
  /**
   * Specifies namespace bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   *
   * For reference, see https://developers.cloudflare.com/workers/wrangler/configuration/#dispatch-namespace-bindings-workers-for-platforms
   */
  dispatch_namespaces?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * The namespace to bind to.
     */
    namespace: string;
    /**
     * Details about the outbound Worker which will handle outbound requests from your namespace
     */
    outbound?: DispatchNamespaceOutbound;
  }>;
  /**
   * Specifies list of Pipelines bound to this Worker environment
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  pipelines?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * Name of the Pipeline to bind
     */
    pipeline: string;
  }>;
  /**
   * Specifies Secret Store bindings that are bound to this Worker environment.
   *
   * NOTE: This field is not automatically inherited from the top level environment, and so must be specified in every named environment.
   */
  secrets_store_secrets?: Array<{
    /**
     * The binding name used to refer to the bound service.
     */
    binding: string;
    /**
     * Id of the secret store
     */
    store_id: string;
    /**
     * Name of the secret
     */
    secret_name: string;
  }>;
}

export type Route = string | ZoneIdRoute | ZoneNameRoute | CustomDomainRoute;

export interface ZoneIdRoute {
  pattern: string;
  zone_id: string;
  custom_domain?: boolean;
}

export interface ZoneNameRoute {
  pattern: string;
  zone_name: string;
  custom_domain?: boolean;
}

export interface CustomDomainRoute {
  pattern: string;
  custom_domain: boolean;
}

/**
 * Configuration in wrangler for Durable Object Migrations
 */
export interface DurableObjectMigration {
  /**
   * A unique identifier for this migration.
   */
  tag: string;
  /**
   * The new Durable Objects being defined.
   */
  new_classes?: string[];
  /**
   * The new SQLite Durable Objects being defined.
   */
  new_sqlite_classes?: string[];
  /**
   * The Durable Objects being renamed.
   */
  renamed_classes?: Array<{
    from: string;
    to: string;
  }>;
  /**
   * The Durable Objects being removed.
   */
  deleted_classes?: string[];
}

export interface UserLimits {
  /**
   * Maximum allowed CPU time for a Worker's invocation in milliseconds
   */
  cpu_ms: number;
}

/**
 * A bundling resolver rule, defining the modules type for paths that match the specified globs.
 */
export interface Rule {
  type: ConfigModuleRuleType;
  globs: string[];
  fallthrough?: boolean;
}

/**
 * The possible types for a `Rule`.
 */
export type ConfigModuleRuleType =
  | "ESModule"
  | "CommonJS"
  | "CompiledWasm"
  | "Text"
  | "Data"
  | "PythonModule"
  | "PythonRequirement";

export interface Assets {
  /**
   * Absolute path to assets directory
   */
  directory?: string;
  /**
   * Name of `env` binding property in the User Worker.
   */
  binding?: string;
  /**
   * How to handle HTML requests.
   */
  html_handling?:
    | "auto-trailing-slash"
    | "force-trailing-slash"
    | "drop-trailing-slash"
    | "none";
  /**
   * How to handle requests that do not match an asset.
   */
  not_found_handling?: "single-page-application" | "404-page" | "none";
  /**
   * If true, route every request to the User Worker, whether or not it matches an asset. If false, then respond to requests that match an asset with that asset directly.
   */
  run_worker_first?: boolean;
}

export interface Observability {
  /**
   * If observability is enabled for this Worker
   */
  enabled?: boolean;
  /**
   * The sampling rate
   */
  head_sampling_rate?: number;
  logs?: {
    enabled?: boolean;
    /**
     * The sampling rate
     */
    head_sampling_rate?: number;
    /**
     * Set to false to disable invocation logs
     */
    invocation_logs?: boolean;
  };
}

export type Json = Literal | Record<string, Json> | Json[];

export type Literal = string | number | boolean | null;

export type DurableObjectBindings = Array<{
  /**
   * The name of the binding used to refer to the Durable Object
   */
  name: string;
  /**
   * The exported class name of the Durable Object
   */
  class_name: string;
  /**
   * The script where the Durable Object is defined (if it's external to this Worker)
   */
  script_name?: string;
  /**
   * The service environment of the script_name to bind to
   */
  environment?: string;
}>;

export interface WorkflowBinding {
  /**
   * The name of the binding used to refer to the Workflow
   */
  binding: string;
  /**
   * The name of the Workflow
   */
  name: string;
  /**
   * The exported class name of the Workflow
   */
  class_name: string;
  /**
   * The script where the Workflow is defined (if it's external to this Worker)
   */
  script_name?: string;
  /**
   * Whether the Workflow should be remote or not (only available under `--x-mixed-mode`)
   */
  remote?: boolean;
}

/**
 * Configuration in wrangler for Cloudchamber
 */
export interface CloudchamberConfig {
  image?: string;
  location?: string;
  vcpu?: number;
  memory?: string;
  ipv4?: boolean;
}

/**
 * Configuration for a container application
 */
export interface ContainerApp {
  /**
   * Name of the application
   */
  name: string;
  /**
   * Number of application instances
   */
  instances?: number;
  /**
   * Number of maximum application instances. Only applicable to Durable Object container applications
   */
  max_instances?: number;
  /**
   * The path to a Dockerfile, or an image URI. Can be defined both here or by setting the `image` key in the `ContainerApp` configuration
   */
  image?: string;
  /**
   * Build context of the application. By default it is the directory of `image`.
   */
  image_build_context?: string;
  /**
   * Image variables to be passed along the image
   */
  image_vars?: Record<string, string>;
  class_name: string;
  /**
   * The scheduling policy of the application, default is regional
   */
  scheduling_policy?: "regional" | "moon";
  configuration: {
    image: string;
    labels?: Array<{
      name: string;
      value: string;
    }>;
    secrets?: Array<{
      name: string;
      type: "env";
      secret: string;
    }>;
  };
  /**
   * Scheduling constraints
   */
  constraints?: {
    regions?: string[];
    cities?: string[];
    tier?: number;
  };
  durable_objects?: {
    namespace_id: string;
  };
  /**
   * How a rollout should be done, defining the size of it
   */
  rollout_step_percentage?: number;
  /**
   * How a rollout should be created. It supports the following modes:  - full_auto: The container application will be rolled out fully automatically.  - none: The container application won't have a roll out or update.  - manual: The container application will be rollout fully by manually actioning progress steps.
   */
  rollout_kind?: "full_auto" | "none" | "full_manual";
}

export interface TailConsumer {
  /**
   * The name of the service tail events will be forwarded to.
   */
  service: string;
  /**
   * (Optional) The environment of the service.
   */
  environment?: string;
}

export interface DispatchNamespaceOutbound {
  /**
   * Name of the service handling the outbound requests
   */
  service: string;
  /**
   * (Optional) Name of the environment handling the outbound requests.
   */
  environment?: string;
  /**
   * (Optional) List of parameter names, for sending context from your dispatch Worker to the outbound handler
   */
  parameters?: string[];
}

export interface RawDevConfig {
  /**
   * IP address for the local dev server to listen on,
   */
  ip?: string;
  /**
   * Port for the local dev server to listen on
   */
  port?: number;
  /**
   * Port for the local dev server's inspector to listen on
   */
  inspector_port?: number;
  /**
   * Protocol that local wrangler dev server listens to requests on.
   */
  local_protocol?: "http" | "https";
  /**
   * Protocol that wrangler dev forwards requests on
   *
   * Setting this to `http` is not currently implemented for remote mode. See https://github.com/cloudflare/workers-sdk/issues/583
   */
  upstream_protocol?: "https" | "http";
  /**
   * Host to forward requests to, defaults to the host of the first route of project
   */
  host?: string;
}
