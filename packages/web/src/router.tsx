import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { QueryClient } from "@tanstack/react-query";

import { routeTree } from "./routeTree.gen";

import "./styles.css";

// Create a new router instance
export const createRouter = () => {
  const queryClient = new QueryClient();
  const router = routerWithQueryClient(
    createTanstackRouter({
      routeTree,
      context: {
        queryClient,
      },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
    }),
    queryClient
  );

  return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
