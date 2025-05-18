import { join } from "node:path";

interface PackageManager {
  packageManager: "bun" | "npm" | "pnpm" | "yarn";
  lockfile: string;
  installCommand: string[];
}

const PACKAGE_MANAGERS: PackageManager[] = [
  {
    packageManager: "bun",
    lockfile: "bun.lock",
    installCommand: ["bun", "install", "--frozen-lockfile"],
  },
  {
    packageManager: "bun",
    lockfile: "bun.lockb",
    installCommand: ["bun", "install", "--frozen-lockfile"],
  },
  {
    packageManager: "npm",
    lockfile: "package-lock.json",
    installCommand: ["npm", "ci"],
  },
  {
    packageManager: "pnpm",
    lockfile: "pnpm-lock.yaml",
    installCommand: ["pnpm", "install", "--frozen-lockfile"],
  },
  {
    packageManager: "yarn",
    lockfile: "yarn.lock",
    installCommand: ["yarn", "install", "--immutable"],
  },
] as const;

export async function detectPackageManager(dir: string) {
  const packageManagers: PackageManager[] = [];
  await Promise.all(
    PACKAGE_MANAGERS.map(async (config) => {
      if (await Bun.file(join(dir, config.lockfile)).exists()) {
        packageManagers.push(config);
      }
    })
  );
  if (!packageManagers[0]) {
    throw new Error("No lockfile found");
  }
  if (packageManagers.length > 1) {
    throw new Error("Multiple lockfiles found");
  }
  return packageManagers[0];
}
