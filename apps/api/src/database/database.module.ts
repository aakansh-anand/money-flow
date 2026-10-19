import { createDb, type Db } from "@kosh/db";
import { Global, Inject, Module } from "@nestjs/common";

import { ENV, type Env } from "@/config/env";

export const DB = Symbol("DB");

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: (env: Env): Db => createDb(env.DATABASE_URL),
      inject: [ENV],
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}

/** Type-safe injector helper for the DB token. */
export const InjectDb = () => Inject(DB);
