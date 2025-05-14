export default {
  fetch: async (request: Request) => {
    return Response.json({
      message: "Hello, world!",
    });
  },
} satisfies Bun.Serve;
