import {
  type AuthTokens,
  type CurrentUser,
  LOGIN_SUCCESS_MESSAGE,
  type LoginInput,
  type LoginResponse,
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
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";

import { ZodBody } from "@/common/zod-validation.pipe";
import { ENV, type Env } from "@/config/env";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_PATH,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from "./auth.constants";
import { AuthService } from "./auth.service";
import type { AuthContext } from "./auth.types";
import { CurrentAuth } from "./decorators/current-auth.decorator";
import { Public } from "./decorators/public.decorator";

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
      body.name,
      body.email,
      body.password,
      body.deviceLabel,
      userAgent,
    );
    this.setAuthCookies(res, tokens);
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
  ): Promise<LoginResponse> {
    const { tokens } = await this.auth.login(
      body.email,
      body.password,
      body.deviceLabel,
      userAgent,
    );
    this.setAuthCookies(res, tokens);
    return {
      statusCode: 200,
      message: LOGIN_SUCCESS_MESSAGE,
      ...tokens,
    };
  }

  /**
   * Accepts the refresh token from the httpOnly cookie (web) or the JSON
   * body (mobile). Rotates on every use; reuse revokes the session.
   */
  @Public()
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
      body.refreshToken ?? (res.req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined);
    if (!rawToken) {
      throw new UnauthorizedException("Missing refresh token");
    }
    const { tokens } = await this.auth.refresh(rawToken, userAgent);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @HttpCode(204)
  @Post("logout")
  async logout(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(auth.sessionId);
    this.clearAuthCookies(res);
  }

  /** Cookie or Bearer access token. 200 means the session is still valid. */
  @Get("me")
  me(@CurrentAuth() auth: AuthContext): Promise<CurrentUser> {
    return this.auth.me(auth.userId);
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
   *
   * Body tokens remain for mobile / e2e Bearer clients.
   */
  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProd = this.env.NODE_ENV === "production";
    const cookieBase = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    };

    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      ...cookieBase,
      path: ACCESS_COOKIE_PATH,
      maxAge: this.env.JWT_ACCESS_TTL * 1000,
    });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...cookieBase,
      path: REFRESH_COOKIE_PATH,
      maxAge: this.env.REFRESH_TOKEN_TTL * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    const isProd = this.env.NODE_ENV === "production";
    const cookieBase = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    };
    res.clearCookie(ACCESS_COOKIE_NAME, { ...cookieBase, path: ACCESS_COOKIE_PATH });
    res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieBase, path: REFRESH_COOKIE_PATH });
  }
}
