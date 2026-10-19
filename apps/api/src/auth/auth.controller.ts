import {
  type AuthTokens,
  type LoginInput,
  loginInputSchema,
  type RefreshInput,
  refreshInputSchema,
  type RegisterInput,
  registerInputSchema,
  type Session,
} from "@kosh/shared";
import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";

import { ZodBody } from "@/common/zod-validation.pipe";
import { ENV, type Env } from "@/config/env";
import { REFRESH_COOKIE_NAME } from "./auth.constants";
import { AuthService } from "./auth.service";
import type { AuthContext } from "./auth.types";
import { CurrentAuth } from "./decorators/current-auth.decorator";
import { Public } from "./decorators/public.decorator";
import { CsrfGuard } from "./guards/csrf.guard";

/** Credential brute-force ceiling: 5 attempts / minute on register + login. */
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller("auth")
export class AuthController {
  constructor(
    // Explicit @Inject: a type-only import here would erase the DI token.
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post("register")
  async register(
    @ZodBody(registerInputSchema) body: RegisterInput,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens> {
    const { tokens } = await this.auth.register(
      body.email,
      body.password,
      body.deviceLabel,
      userAgent,
    );
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(200)
  @Post("login")
  async login(
    @ZodBody(loginInputSchema) body: LoginInput,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens> {
    const { tokens } = await this.auth.login(
      body.email,
      body.password,
      body.deviceLabel,
      userAgent,
    );
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  /**
   * Accepts the refresh token from the httpOnly cookie (web) or the JSON
   * body (mobile). Rotates on every use; reuse revokes the session.
   */
  @Public()
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  @Post("refresh")
  async refresh(
    // `.default({})`: cookie-authed clients POST with no body at all.
    @ZodBody(refreshInputSchema.partial().default({}))
    body: Partial<RefreshInput>,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens> {
    const rawToken =
      body.refreshToken ??
      (res.req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined);
    if (!rawToken) {
      throw new UnauthorizedException("Missing refresh token");
    }
    const { tokens } = await this.auth.refresh(rawToken, userAgent);
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @UseGuards(CsrfGuard)
  @HttpCode(204)
  @Post("logout")
  async logout(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(auth.sessionId);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth" });
  }

  @Get("sessions")
  listSessions(@CurrentAuth() auth: AuthContext): Promise<Session[]> {
    return this.auth.listSessions(auth.userId, auth.sessionId);
  }

  @HttpCode(204)
  @Delete("sessions/:id")
  async revokeSession(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.auth.revokeSession(auth.userId, id);
  }

  /**
   * SameSite=None requires Secure, which browsers refuse on http://localhost
   * — so local dev falls back to Lax. Production gets the full
   * httpOnly+Secure+None cookie per the PRD.
   */
  private setRefreshCookie(res: Response, token: string): void {
    const isProd = this.env.NODE_ENV === "production";
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/auth",
      maxAge: this.env.REFRESH_TOKEN_TTL * 1000,
    });
  }
}
