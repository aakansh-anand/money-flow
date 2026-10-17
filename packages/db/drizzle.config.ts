import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Resolve the repo-root .env relative to THIS FILE, not the cwd —
// works no matter where drizzle-kit is invoked from.
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../.env") });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set — copy .env.example to .env at the repo root.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
