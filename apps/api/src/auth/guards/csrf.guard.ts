import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/auth/auth.constants";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF check when an auth cookie is present on an unsafe method.
 * SameSite=None (prod) can ride cross-site forms; a custom header forces a
 * CORS preflight that untrusted origins fail.
 *
 * Bearer-only clients (no auth cookies) skip this — they are not cookie-authed.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return true;
    }

    const hasAuthCookie = Boolean(
      req.cookies?.[ACCESS_COOKIE_NAME] || req.cookies?.[REFRESH_COOKIE_NAME],
    );
    if (hasAuthCookie && req.headers["x-kosh-csrf"] !== "1") {
      throw new ForbiddenException("Missing x-kosh-csrf header on cookie-authed request");
    }
    return true;
  }
}
