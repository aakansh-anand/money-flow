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

import type { AccessTokenPayload, AuthContext } from "@/auth/auth.types";
import { IS_PUBLIC_KEY } from "@/auth/decorators/public.decorator";

/**
 * Global guard: verifies the Bearer access JWT on every non-@Public route
 * and attaches `{ userId, sessionId }` to the request. The `userId` claim is
 * the entire data-isolation boundary between users — handlers scope all
 * queries by it.
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
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
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
