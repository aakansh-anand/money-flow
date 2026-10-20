import type { Env } from "@/config/env";

/** Host/db name for logs — never print credentials. */
export function formatDatabaseTarget(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    const db = url.pathname.replace(/^\//, "") || "postgres";
    const host = url.hostname || "localhost";
    const port = url.port ? `:${url.port}` : "";
    return `${host}${port}/${db}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

export function logStartupSummary(env: Env, databaseTarget: string): void {
  const lines = [
    "",
    "────────────────────────────────────────",
    "  Kosh API is running (development)",
    "────────────────────────────────────────",
    `  Server:   http://localhost:${env.API_PORT}`,
    `  Database: connected (${databaseTarget})`,
    `  CORS:     ${env.CORS_ORIGINS}`,
    "────────────────────────────────────────",
    "",
  ];
  for (const line of lines) {
    // Plain stdout so turbo still prefixes once but the message stays readable.
    console.log(line);
  }
}

export function logDatabaseConnectionError(databaseTarget: string, cause: unknown): void {
  const detail = cause instanceof Error ? cause.message : String(cause);
  console.error("");
  console.error("────────────────────────────────────────");
  console.error("  Kosh API failed to start");
  console.error("────────────────────────────────────────");
  console.error(`  Database: NOT connected (${databaseTarget})`);
  console.error(`  Reason:   ${detail}`);
  console.error("");
  console.error("  Check DATABASE_URL in the repo-root .env and that Postgres is running.");
  console.error("────────────────────────────────────────");
  console.error("");
}
