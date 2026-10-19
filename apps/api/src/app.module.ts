import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";

import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { GlobalExceptionFilter } from "./common/http-exception.filter";
import { ZodValidationPipe } from "./common/zod-validation.pipe";
import { ENV, type Env } from "./config/env";
import { EnvModule } from "./config/env.module";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    AuthModule,
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level:
            env.LOG_LEVEL ??
            (env.NODE_ENV === "production"
              ? "info"
              : env.NODE_ENV === "test"
                ? "silent"
                : "debug"),
          // Never log credentials — inbound or outbound.
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            'res.headers["set-cookie"]',
          ],
          transport:
            env.NODE_ENV === "production" || env.NODE_ENV === "test"
              ? undefined
              : { target: "pino-pretty", options: { singleLine: true } },
        },
      }),
    }),
    // Global ceiling; auth routes override with stricter per-route limits.
    // Skipped under test so e2e happy paths don't 429.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
      skipIf: () => process.env.NODE_ENV === "test",
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
