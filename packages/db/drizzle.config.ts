import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) {
  const databaseUrl = readFileSync(".env.local", "utf-8")
    .split("=")
    .slice(1)
    .join("=");
  console.log("databaseUrl", databaseUrl);
  process.env.DATABASE_URL = databaseUrl;
}

export default defineConfig({
  schema: "./src/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
