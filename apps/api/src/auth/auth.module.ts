import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { ENV, type Env } from "@/config/env";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ENV],
      useFactory: (env: Env) => ({
        secret: env.JWT_ACCESS_SECRET,
        signOptions: { expiresIn: env.JWT_ACCESS_TTL },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
