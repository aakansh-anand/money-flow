import { loadRootEnv } from "@/config/root-env";

loadRootEnv(__dirname);

import {
  contacts,
  createDb,
  debtPayments,
  debts,
  investmentTransactions,
  investmentTypes,
  sessions,
  transactions,
  tags,
  accounts,
  users,
  type Db,
} from "@kosh/db";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "@/app.module";
import { authHeader, E2E_PASSWORD, registerAndLogin } from "./e2e-helpers";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://kosh:kosh@localhost:5436/kosh";
if (!databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
  throw new Error(`Refusing to run e2e against non-local DB: ${databaseUrl}`);
}

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-secret-test-secret-test-secret-42";
process.env.JWT_ACCESS_TTL = "900";
process.env.REFRESH_TOKEN_TTL = "2592000";

describe("Investments & debts (e2e)", () => {
  let app: INestApplication;
  let db: Db;
  let token: string;

  beforeAll(async () => {
    db = createDb(databaseUrl);
    await db.delete(debtPayments);
    await db.delete(debts);
    await db.delete(contacts);
    await db.delete(investmentTransactions);
    await db.delete(investmentTypes);
    await db.delete(transactions);
    await db.delete(tags);
    await db.delete(accounts);
    await db.delete(sessions);
    await db.delete(users);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    token = await registerAndLogin(app, "invest-debt-e2e@example.com", E2E_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  it("tracks invested totals and manual current value", async () => {
    const typeRes = await request(app.getHttpServer())
      .post("/investment-types")
      .set(authHeader(token))
      .send({ name: "Mutual Funds", currentValue: 120_000 })
      .expect(201);
    const typeId = typeRes.body.id as string;
    expect(typeRes.body.investedTotal).toBe(0);

    await request(app.getHttpServer())
      .post("/investment-transactions")
      .set(authHeader(token))
      .send({
        investmentTypeId: typeId,
        instrumentName: "Nifty Index",
        type: "invest",
        amount: 50_000,
        occurredAt: "2026-10-01T10:00:00.000Z",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/investment-transactions")
      .set(authHeader(token))
      .send({
        investmentTypeId: typeId,
        instrumentName: "Nifty Index",
        type: "withdraw",
        amount: 10_000,
        occurredAt: "2026-10-15T10:00:00.000Z",
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get("/investment-types")
      .set(authHeader(token))
      .expect(200);
    expect(listRes.body[0].investedTotal).toBe(40_000);

    const filtered = await request(app.getHttpServer())
      .get("/investment-transactions")
      .set(authHeader(token))
      .query({ investmentTypeId: typeId })
      .expect(200);
    expect(filtered.body).toHaveLength(2);

    const patched = await request(app.getHttpServer())
      .patch(`/investment-types/${typeId}`)
      .set(authHeader(token))
      .send({ currentValue: 130_000 })
      .expect(200);
    expect(patched.body.currentValue).toBe(130_000);
    expect(patched.body.investedTotal).toBe(40_000);
  });

  it("records partial debt payments and auto-settles at zero", async () => {
    const contact = await request(app.getHttpServer())
      .post("/contacts")
      .set(authHeader(token))
      .send({ name: "Ravi", type: "person" })
      .expect(201);

    const debt = await request(app.getHttpServer())
      .post("/debts")
      .set(authHeader(token))
      .send({
        contactId: contact.body.id,
        direction: "borrowed",
        amount: 10_000,
        dueDate: "2026-11-01T00:00:00.000Z",
      })
      .expect(201);
    expect(debt.body.remaining).toBe(10_000);
    expect(debt.body.status).toBe("open");

    await request(app.getHttpServer())
      .post(`/debts/${debt.body.id}/payments`)
      .set(authHeader(token))
      .send({
        amount: 4_000,
        paidAt: "2026-10-05T12:00:00.000Z",
        note: "First chunk",
      })
      .expect(201);

    const detailMid = await request(app.getHttpServer())
      .get(`/debts/${debt.body.id}`)
      .set(authHeader(token))
      .expect(200);
    expect(detailMid.body.remaining).toBe(6_000);
    expect(detailMid.body.payments).toHaveLength(1);
    expect(detailMid.body.status).toBe("open");

    await request(app.getHttpServer())
      .post(`/debts/${debt.body.id}/payments`)
      .set(authHeader(token))
      .send({
        amount: 6_000,
        paidAt: "2026-10-20T12:00:00.000Z",
      })
      .expect(201);

    const openList = await request(app.getHttpServer())
      .get("/debts")
      .set(authHeader(token))
      .query({ status: "open" })
      .expect(200);
    expect(openList.body).toHaveLength(0);

    const settledList = await request(app.getHttpServer())
      .get("/debts")
      .set(authHeader(token))
      .query({ status: "settled" })
      .expect(200);
    expect(settledList.body).toHaveLength(1);
    expect(settledList.body[0].remaining).toBe(0);
    expect(settledList.body[0].settledAt).toBe("2026-10-20T12:00:00.000Z");

    await request(app.getHttpServer())
      .post(`/debts/${debt.body.id}/payments`)
      .set(authHeader(token))
      .send({
        amount: 100,
        paidAt: "2026-10-21T12:00:00.000Z",
      })
      .expect(400);
  });

  it("deletes open debts and rejects overpayment", async () => {
    const contact = await request(app.getHttpServer())
      .post("/contacts")
      .set(authHeader(token))
      .send({ name: "Priya", type: "person" })
      .expect(201);

    const debt = await request(app.getHttpServer())
      .post("/debts")
      .set(authHeader(token))
      .send({
        contactId: contact.body.id,
        direction: "lent",
        amount: 5_000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/debts/${debt.body.id}/payments`)
      .set(authHeader(token))
      .send({
        amount: 6_000,
        paidAt: "2026-10-01T12:00:00.000Z",
      })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/debts/${debt.body.id}`)
      .set(authHeader(token))
      .expect(204);

    await request(app.getHttpServer())
      .get(`/debts/${debt.body.id}`)
      .set(authHeader(token))
      .expect(404);
  });
});
