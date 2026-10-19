import { randomBytes, randomUUID } from "node:crypto";

import { sessions, users, type Db } from "@kosh/db";
import type { AuthTokens, Session } from "@kosh/shared";
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { and, eq, gt, isNull } from "drizzle-orm";

import { ENV, type Env } from "@/config/env";
import { DB } from "@/database/database.module";
import { BCRYPT_ROUNDS } from "./auth.constants";

interface IssuedSession {
  sessionId: string;
  refreshToken: string;
}

/** Valid-format bcrypt hash used for timing-safe failed logins. */
let dummyHash: string | undefined;
async function getDummyHash(): Promise<string> {
  dummyHash ??= await bcrypt.hash(
    randomBytes(16).toString("hex"),
    BCRYPT_ROUNDS,
  );
  return dummyHash;
}

@Injectable()
export class AuthService {
  // Static Logger routes through pino once main.ts calls app.useLogger().
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
    // Explicit @Inject: a type-only import here would erase the DI token.
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    deviceLabel: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ tokens: AuthTokens; sessionId: string }> {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [user] = await this.db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id });
    if (!user) throw new Error("Failed to create user");

    const session = await this.createSession(user.id, deviceLabel, userAgent);
    return { tokens: this.issueTokens(user.id, session), sessionId: session.sessionId };
  }

  async login(
    email: string,
    password: string,
    deviceLabel: string | undefined,
    userAgent: string | undefined,
  ): Promise<{ tokens: AuthTokens; sessionId: string }> {
    // check if user exists
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    // Constant-shape failure: compare against a dummy hash when the user
    // doesn't exist so timing doesn't reveal which emails are registered.
    const hash = user?.passwordHash ?? (await getDummyHash());
    const valid = await bcrypt.compare(password, hash);
    if (!user || !valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const session = await this.createSession(user.id, deviceLabel, userAgent);
    return { tokens: this.issueTokens(user.id, session), sessionId: session.sessionId };
  }

  /**
   * Rotate a refresh token. Format: `<sessionId>.<secret>`.
   * Reuse detection: a presented secret that doesn't match the stored hash
   * on an active session means the token was already rotated (stolen copy)
   * — the whole session is revoked.
   */
  async refresh(
    rawToken: string,
    userAgent: string | undefined,
  ): Promise<{ tokens: AuthTokens; sessionId: string }> {
    const separator = rawToken.indexOf(".");
    if (separator <= 0) {
      throw new UnauthorizedException("Malformed refresh token");
    }
    const sessionId = rawToken.slice(0, separator);
    const secret = rawToken.slice(separator + 1);

    const session = await this.db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Session expired or revoked");
    }

    const matches = await bcrypt.compare(secret, session.tokenHash);
    if (!matches) {
      await this.revokeById(session.id);
      // Security event: someone presented an already-rotated token.
      this.logger.warn(
        { sessionId: session.id, userId: session.userId },
        "Refresh token reuse detected — session revoked",
      );
      throw new UnauthorizedException(
        "Refresh token reuse detected — session revoked",
      );
    }

    const rotated = await this.rotateSession(session.id, userAgent);
    return {
      tokens: this.issueTokens(session.userId, rotated),
      sessionId: session.id,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.revokeById(sessionId);
  }

  async listSessions(userId: string, currentSessionId: string): Promise<Session[]> {
    const rows = await this.db.query.sessions.findMany({
      where: and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
      orderBy: (t, { desc }) => [desc(t.lastUsedAt)],
    });
    return rows.map((row) => ({
      id: row.id,
      deviceLabel: row.deviceLabel,
      userAgent: row.userAgent,
      lastUsedAt: row.lastUsedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      current: row.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const revoked = await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
        ),
      )
      .returning({ id: sessions.id });
    if (revoked.length === 0) {
      throw new NotFoundException("Session not found");
    }
  }

  // --- internals -----------------------------------------------------------

  private async createSession(
    userId: string,
    deviceLabel: string | undefined,
    userAgent: string | undefined,
  ): Promise<IssuedSession> {
    const sessionId = randomUUID();
    const secret = randomBytes(48).toString("base64url");
    const tokenHash = await bcrypt.hash(secret, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + this.env.REFRESH_TOKEN_TTL * 1000);

    await this.db.insert(sessions).values({
      id: sessionId,
      userId,
      tokenHash,
      deviceLabel,
      userAgent,
      expiresAt,
    });
    return { sessionId, refreshToken: `${sessionId}.${secret}` };
  }

  private async rotateSession(
    sessionId: string,
    userAgent: string | undefined,
  ): Promise<IssuedSession> {
    const secret = randomBytes(48).toString("base64url");
    const tokenHash = await bcrypt.hash(secret, BCRYPT_ROUNDS);

    await this.db
      .update(sessions)
      .set({ tokenHash, lastUsedAt: new Date(), userAgent })
      .where(eq(sessions.id, sessionId));
    return { sessionId, refreshToken: `${sessionId}.${secret}` };
  }

  private async revokeById(sessionId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }

  private issueTokens(userId: string, session: IssuedSession): AuthTokens {
    const accessToken = this.jwt.sign({ sub: userId, sid: session.sessionId });
    return {
      accessToken,
      refreshToken: session.refreshToken,
      expiresIn: this.env.JWT_ACCESS_TTL,
    };
  }
}
