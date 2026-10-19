/** Shape attached to `request.auth` by JwtAuthGuard. */
export interface AuthContext {
  /** JWT `sub` — the authenticated user. Every query filters by this. */
  userId: string;
  /** JWT `sid` — the session this access token belongs to. */
  sessionId: string;
}

/** Claims carried in the short-lived access JWT. */
export interface AccessTokenPayload {
  sub: string;
  sid: string;
}
