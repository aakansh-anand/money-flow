import { loadRootEnv } from "@/config/root-env";

loadRootEnv(__dirname);

import { createDb, users, type Db } from "@kosh/db";
import { CURRENT_PASSWORD_INCORRECT_MESSAGE } from "@kosh/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "@/app.module";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://kosh:kosh@localhost:5436/kosh";
if (!databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
  throw new Error(`Refusing to run e2e against non-local DB: ${databaseUrl}`);
}

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-secret-test-secret-test-secret-42";
process.env.JWT_ACCESS_TTL = "900";
process.env.REFRESH_TOKEN_TTL = "2592000";

const EMAIL = "kosh-profile-e2e@example.com";
const NAME = "Profile E2E";
const PASSWORD = "KoshE2e99";
const NEXT_PASSWORD = "KoshNew88";

describe("Profile (e2e)", () => {
  let app: INestApplication;
  let db: Db;
  let accessToken: string;

  beforeAll(async () => {
    db = createDb(databaseUrl);
    await db.delete(users).where(eq(users.email, EMAIL));

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ name: NAME, email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    accessToken = login.body.accessToken as string;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, EMAIL));
    await app.close();
  });

  it("rejects profile without a token", async () => {
    await request(app.getHttpServer()).get("/profile").expect(401);
  });

  it("returns name, email, and isOnboarded false for a new user", async () => {
    const res = await request(app.getHttpServer())
      .get("/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      name: NAME,
      email: EMAIL,
      onboardingStatus: "started",
      onboardingStep: null,
    });
  });

  it("requires a step when onboarding is saved as in-progress", async () => {
    await request(app.getHttpServer())
      .patch("/profile/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ onboardingStatus: "in-progress" })
      .expect(400);
  });

  it("stores the step sent with an in-progress save", async () => {
    const res = await request(app.getHttpServer())
      .patch("/profile/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ onboardingStatus: "in-progress", onboardingStep: 2 })
      .expect(200);

    expect(res.body).toEqual({
      name: NAME,
      email: EMAIL,
      onboardingStatus: "in-progress",
      onboardingStep: 2,
    });
  });

  it("clears the step when onboarding is completed", async () => {
    const res = await request(app.getHttpServer())
      .patch("/profile/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ onboardingStatus: "completed" })
      .expect(200);

    expect(res.body).toEqual({
      name: NAME,
      email: EMAIL,
      onboardingStatus: "completed",
      onboardingStep: null,
    });
  });

  it("rejects a wrong current password without changing login", async () => {
    const res = await request(app.getHttpServer())
      .post("/profile/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "NotTheOne1", newPassword: NEXT_PASSWORD })
      .expect(400);

    expect(res.body.message).toBe(CURRENT_PASSWORD_INCORRECT_MESSAGE);

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
  });

  it("rejects a new password that breaks the password rules", async () => {
    await request(app.getHttpServer())
      .post("/profile/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword: "short" })
      .expect(400);
  });

  it("updates the password only after the current password matches", async () => {
    const res = await request(app.getHttpServer())
      .post("/profile/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword: NEXT_PASSWORD })
      .expect(200);

    expect(res.body).toEqual({ message: "Password updated" });

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: EMAIL, password: PASSWORD })
      .expect(401);

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: EMAIL, password: NEXT_PASSWORD })
      .expect(200);
  });
});
