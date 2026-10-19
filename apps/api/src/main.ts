import { requireRootEnv } from "./config/root-env";

// Repo-root .env for local dev. Fatal when missing outside production —
// real env vars win over file values either way.
requireRootEnv(__dirname);

import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { loadEnv } from "./config/env";

async function bootstrap(): Promise<void> {
  const env = loadEnv();

  // bufferLogs: hold Nest's startup logs until pino takes over.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.enableCors({
    origin: env.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
    credentials: true,
  });

  await app.listen(env.API_PORT);
}

void bootstrap();
