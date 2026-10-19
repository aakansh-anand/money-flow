import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

import { REFRESH_COOKIE_NAME } from "@/auth/auth.constants";

/**
 * CSRF check for cookie-authed unsafe routes. The refresh cookie is
 * SameSite=None, so a cross-site form could ride it. Requiring a custom
 * header forces a CORS preflight, which the origin allowlist already
 * rejects for untrusted origins.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const hasRefreshCookie = Boolean(req.cookies?.[REFRESH_COOKIE_NAME]);
    if (hasRefreshCookie && req.headers["x-kosh-csrf"] !== "1") {
      throw new ForbiddenException("Missing x-kosh-csrf header on cookie-authed request");
    }
    return true;
  }
}
