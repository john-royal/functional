Bun.serve({
  hostname: "::",
  port: process.env.PORT ?? 3000,
  fetch: async (request) => {
    return new Response("Hello, world!");
  },
});
