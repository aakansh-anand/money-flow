import { createParamDecorator, type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

import type { AuthContext } from "@/auth/auth.types";

/** Injects the authenticated `{ userId, sessionId }` context into a handler. */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = (req as Request & { auth?: AuthContext }).auth;
    if (!auth) {
      throw new UnauthorizedException();
    }
    return auth;
  },
);
