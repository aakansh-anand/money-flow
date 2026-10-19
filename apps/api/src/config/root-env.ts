import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { config } from "dotenv";

/**
 * Load the repo-root .env. Walks up from `fromDir` to the directory holding
 * pnpm-workspace.yaml (the monorepo root) instead of hardcoding ../../.. —
 * real env vars always win over file values.
 *
 * Returns the loaded file path, or undefined when no root/.env exists.
 */
export function loadRootEnv(fromDir: string): string | undefined {
  let dir = fromDir;
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      const envPath = join(dir, ".env");
      if (!existsSync(envPath)) return undefined;
      config({ path: envPath });
      return envPath;
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * Fail fast when the .env file is missing. Production gets its config from
 * real env vars (Fly.io secrets), so the file is only required elsewhere.
 */
export function requireRootEnv(fromDir: string): void {
  const loaded = loadRootEnv(fromDir);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (!loaded && nodeEnv !== "production") {
    throw new Error(
      `.env file not found at the repo root — copy .env.example to .env. ` +
        `(Searched upward from ${fromDir}.) ` +
        `In production, provide env vars directly instead.`,
    );
  }
}
