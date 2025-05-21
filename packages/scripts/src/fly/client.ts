import type { paths } from "./openapi.gen.ts";
import createFetchClient from "openapi-fetch";

const client = createFetchClient<paths>({
  baseUrl: "https://api.machines.dev/v1",
  headers: {
    Authorization: `Bearer ${process.env.FLY_API_TOKEN}`,
  },
});

const create = await client.request("post", "/apps/{app_name}/machines", {
  params: {
    path: {
      app_name: "functional",
    },
  },
  body: {
    config: {
      image: "registry.fly.io/functional:johnroyal",
    },
    skip_launch: true,
  },
});

if (!create.data) {
  console.error(create.error);
  throw new Error("Failed to create machine");
}

const ready = await client.request(
  "get",
  "/apps/{app_name}/machines/{machine_id}/wait",
  {
    params: {
      path: {
        app_name: "functional",
        machine_id: create.data.id!,
      },
      query: {
        state: "stopped",
      },
    },
  }
);

console.log(ready.data);

const enable = await client.request(
  "post",
  "/apps/{app_name}/machines/{machine_id}",
  {
    params: {
      path: {
        app_name: "functional",
        machine_id: create.data.id!,
      },
    },
    body: {
      config: {
        image: "registry.fly.io/functional:johnroyal",
        restart: {
          policy: "no",
        },
        auto_destroy: true,
      },
      skip_launch: false,
    },
  }
);

// const start = await client.request(
//   "post",
//   "/apps/{app_name}/machines/{machine_id}/start",
//   {
//     params: {
//       path: {
//         app_name: "functional",
//         machine_id: "d8d453daed0218",
//       },
//     },
//   }
// );

if (!enable.data) {
  console.error(enable.error);
  throw new Error("Failed to enable machine");
}

console.log(enable.data);

// console.log(res);

// const res = await client.request(
//   "delete",
//   "/apps/{app_name}/machines/{machine_id}",
//   {
//     params: {
//       path: {
//         app_name: "functional",
//         machine_id: "e822360a7772e8",
//       },
//     },
//   }
// );
// console.log(res);
