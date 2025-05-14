import { db, env } from "./lib";

export default {
  port: env.PORT,
  fetch: async (request: Request) => {
    const data = await db.query.teams.findMany();
    return Response.json(data);
  },
} satisfies Bun.Serve;
