import { requireRootEnv } from "./config/root-env";

// Repo-root .env for local dev. Fatal when missing outside production —
// real env vars win over file values either way.
requireRootEnv(__dirname);

import type { Db } from "@kosh/db";
import { Logger as NestLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { sql } from "drizzle-orm";
import { Logger } from "nestjs-pino";

import {
  formatDatabaseTarget,
  logDatabaseConnectionError,
  logStartupSummary,
} from "./bootstrap/startup-log";
import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";
import { DB } from "./database/database.module";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const databaseTarget = formatDatabaseTarget(env.DATABASE_URL);

  if (env.NODE_ENV === "development") {
    // Nest's default boot logs (every route mapping, module init) drown out useful output.
    NestLogger.overrideLogger(["error", "warn"]);
  }

  // bufferLogs: hold Nest's startup logs until pino takes over.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: env.NODE_ENV === "development" ? ["error", "warn"] : undefined,
  });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.enableCors({
    origin: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
    credentials: true,
  });

  const db = app.get<Db>(DB);
  try {
    await db.execute(sql`SELECT 1`);
  } catch (error) {
    logDatabaseConnectionError(databaseTarget, error);
    await app.close();
    process.exit(1);
  }

  await app.listen(env.API_PORT);

  if (env.NODE_ENV === "development") {
    logStartupSummary(env, databaseTarget);
  } else {
    const logger = app.get(Logger);
    logger.log(`API listening on port ${env.API_PORT} (database: ${databaseTarget})`);
  }
}

void bootstrap();
