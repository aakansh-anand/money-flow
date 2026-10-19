import { loadRootEnv } from "@/config/root-env";

loadRootEnv(__dirname);

import { createDb, sessions, users, type Db } from "@kosh/db";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "@/app.module";

/**
 * Runs against the LOCAL Docker Postgres only — wipes users/sessions.
 * Refuses to touch anything that doesn't look like localhost.
 */
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://kosh:kosh@localhost:5436/kosh";
if (!databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
  throw new Error(`Refusing to run e2e against non-local DB: ${databaseUrl}`);
}

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-secret-test-secret-test-secret-42";
process.env.JWT_ACCESS_TTL = "900";
process.env.REFRESH_TOKEN_TTL = "2592000";

const EMAIL = "kosh-e2e@example.com";
const PASSWORD = "correct-horse-battery-staple";

function refreshCookie(setCookie: string[] | undefined): string {
  const raw = setCookie?.find((c) => c.startsWith("kosh_refresh="));
  if (!raw) throw new Error("kosh_refresh cookie not set");
  return raw.split(";")[0]!.split("=")[1]!;
}

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let db: Db;

  beforeAll(async () => {
    db = createDb(databaseUrl);
    await db.delete(sessions);
    await db.delete(users);

    // Rate limiting is disabled under NODE_ENV=test via throttler skipIf.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("register + login", () => {
    it("rejects an invalid payload", async () => {
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "not-an-email", password: "short" })
        .expect(400);
    });

    it("registers and returns a token pair + refresh cookie", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "e2e" })
        .expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.expiresIn).toBe(900);
      const setCookie = res.headers["set-cookie"] as unknown as
        | string[]
        | undefined;
      expect(refreshCookie(setCookie)).toBe(res.body.refreshToken);
    });

    it("rejects duplicate registration", async () => {
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: EMAIL, password: PASSWORD })
        .expect(409);
    });

    it("rejects wrong password and unknown email identically", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: "wrong-password" })
        .expect(401);
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "ghost@example.com", password: PASSWORD })
        .expect(401);
    });

    it("logs in with correct credentials", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "e2e-login" })
        .expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });
  });

  describe("error shape", () => {
    it("401 without token carries the consistent JSON body", async () => {
      const res = await request(app.getHttpServer())
        .get("/auth/sessions")
        .expect(401);
      expect(res.body).toMatchObject({
        statusCode: 401,
        message: "Missing access token",
        path: "/auth/sessions",
      });
      expect(res.body.timestamp).toEqual(expect.any(String));
    });

    it("404 on unknown routes uses the same shape", async () => {
      const res = await request(app.getHttpServer())
        .get("/definitely-not-a-route")
        .expect(404);
      expect(res.body).toMatchObject({
        statusCode: 404,
        path: "/definitely-not-a-route",
      });
    });

    it("400 validation errors keep the issues payload", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ email: "bad", password: "short" })
        .expect(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        message: "Validation failed",
      });
      expect(res.body.issues).toBeDefined();
    });
  });

  describe("authenticated routes", () => {
    it("rejects requests without a token", async () => {
      await request(app.getHttpServer()).get("/auth/sessions").expect(401);
    });

    it("lists sessions and flags the current one", async () => {
      const login = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "sessions-test" })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get("/auth/sessions")
        .set("Authorization", `Bearer ${login.body.accessToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const current = res.body.find(
        (s: { current: boolean }) => s.current,
      );
      expect(current.deviceLabel).toBe("sessions-test");
    });

    it("revokes another session remotely", async () => {
      const first = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "keep" })
        .expect(200);
      const second = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "revoke-me" })
        .expect(200);

      const list = await request(app.getHttpServer())
        .get("/auth/sessions")
        .set("Authorization", `Bearer ${first.body.accessToken}`)
        .expect(200);
      const target = list.body.find(
        (s: { deviceLabel: string }) => s.deviceLabel === "revoke-me",
      );

      await request(app.getHttpServer())
        .delete(`/auth/sessions/${target.id}`)
        .set("Authorization", `Bearer ${first.body.accessToken}`)
        .expect(204);

      // Revoked session's refresh token is now dead.
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: second.body.refreshToken })
        .expect(401);
    });

    it("404s when revoking an unknown session", async () => {
      const login = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD })
        .expect(200);
      await request(app.getHttpServer())
        .delete("/auth/sessions/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${login.body.accessToken}`)
        .expect(404);
    });
  });

  describe("refresh rotation + reuse detection", () => {
    it("rotates the refresh token; reusing the old one revokes the session", async () => {
      const login = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "rotation" })
        .expect(200);
      const original = login.body.refreshToken as string;

      // First use: rotates successfully.
      const rotated = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: original })
        .expect(200);
      const rotatedToken = rotated.body.refreshToken as string;
      expect(rotatedToken).not.toBe(original);

      // Reuse of the ORIGINAL (already-rotated) token: theft signal.
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: original })
        .expect(401);

      // The whole session is revoked — even the newest token is dead now.
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: rotatedToken })
        .expect(401);
    });
  });

  describe("CSRF on cookie-authed refresh", () => {
    it("rejects cookie refresh without the custom header, accepts with it", async () => {
      const login = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "csrf" })
        .expect(200);
      const cookie = `kosh_refresh=${login.body.refreshToken}`;

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", cookie)
        .expect(403);

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", cookie)
        .set("x-kosh-csrf", "1")
        .expect(200);
    });
  });

  describe("logout", () => {
    it("revokes the session and kills the refresh token", async () => {
      const login = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: EMAIL, password: PASSWORD, deviceLabel: "logout" })
        .expect(200);

      await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", `Bearer ${login.body.accessToken}`)
        .set("x-kosh-csrf", "1")
        .set("Cookie", `kosh_refresh=${login.body.refreshToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: login.body.refreshToken })
        .expect(401);
    });
  });
});
