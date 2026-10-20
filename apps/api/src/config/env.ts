import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  /** Access token lifetime in seconds (default 900 = 15 min). */
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  /** Refresh token lifetime in seconds (default 2592000 = 30 days). */
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(2_592_000),
  /** Comma-separated origin allowlist for credentialed CORS. */
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  /** pino level. Defaults: warn in dev (quieter boot), info in prod, silent in test. */
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

export const ENV = Symbol("ENV");

/** Parse + validate process.env. Throws (fails boot) on invalid config. */
export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
