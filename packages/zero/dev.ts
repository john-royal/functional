import { $ } from "bun";
import { mkdir } from "node:fs/promises";

await mkdir(".local", { recursive: true });
await $`zero-cache`;
