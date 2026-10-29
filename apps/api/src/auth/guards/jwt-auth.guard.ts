import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

import { ACCESS_COOKIE_NAME } from "@/auth/auth.constants";
import type { AccessTokenPayload, AuthContext } from "@/auth/auth.types";
import { IS_PUBLIC_KEY } from "@/auth/decorators/public.decorator";

/**
 * Global guard: verifies the access JWT from the httpOnly cookie (web) or
 * `Authorization: Bearer` (mobile / tests) and attaches `{ userId, sessionId }`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    // Explicit @Inject: type-only imports would erase the DI tokens.
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = readAccessToken(req);
    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      (req as Request & { auth: AuthContext }).auth = {
        userId: payload.sub,
        sessionId: payload.sid,
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}

function readAccessToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[ACCESS_COOKIE_NAME];
  if (typeof fromCookie === "string" && fromCookie.length > 0) {
    return fromCookie;
  }
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return undefined;
}
