import { loadRootEnv } from "@/config/root-env";

loadRootEnv(__dirname);

import {
  contacts,
  createDb,
  debtPayments,
  debts,
  investmentTypes,
  sessions,
  transactions,
  tags,
  accounts,
  users,
  type Db,
} from "@kosh/db";
import type { MonthlyReport } from "@kosh/shared";
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

function asMonthlyReport(body: unknown): MonthlyReport {
  return body as MonthlyReport;
}

describe("Reports (e2e)", () => {
  let app: INestApplication;
  let db: Db;
  let token: string;

  beforeAll(async () => {
    db = createDb(databaseUrl);
    await db.delete(debtPayments);
    await db.delete(debts);
    await db.delete(contacts);
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

    token = await registerAndLogin(app, "reports-e2e@example.com", E2E_PASSWORD);

    const cash = await request(app.getHttpServer())
      .post("/accounts")
      .set(authHeader(token))
      .send({ type: "cash", name: "Wallet", openingBalance: 20_000 })
      .expect(201);
    const bank = await request(app.getHttpServer())
      .post("/accounts")
      .set(authHeader(token))
      .send({ type: "bank", name: "Kotak", openingBalance: 100_000 })
      .expect(201);

    const meals = await request(app.getHttpServer())
      .post("/tags")
      .set(authHeader(token))
      .send({ name: "Meals", kind: "expense", color: "#DC2626" })
      .expect(201);
    const salary = await request(app.getHttpServer())
      .post("/tags")
      .set(authHeader(token))
      .send({ name: "Salary", kind: "income", color: "#16A34A" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/transactions")
      .set(authHeader(token))
      .send({
        type: "expense",
        accountId: cash.body.id,
        tagId: meals.body.id,
        amount: 3_000,
        occurredAt: "2026-10-05T12:00:00.000Z",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/transactions")
      .set(authHeader(token))
      .send({
        type: "income",
        accountId: bank.body.id,
        tagId: salary.body.id,
        amount: 50_000,
        occurredAt: "2026-10-10T12:00:00.000Z",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/transactions")
      .set(authHeader(token))
      .send({
        type: "transfer",
        fromAccountId: bank.body.id,
        toAccountId: cash.body.id,
        amount: 5_000,
        occurredAt: "2026-10-12T12:00:00.000Z",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/investment-types")
      .set(authHeader(token))
      .send({ name: "Mutual Funds", currentValue: 200_000 })
      .expect(201);

    const contact = await request(app.getHttpServer())
      .post("/contacts")
      .set(authHeader(token))
      .send({ name: "Ravi", type: "person" })
      .expect(201);

    const borrowed = await request(app.getHttpServer())
      .post("/debts")
      .set(authHeader(token))
      .send({
        contactId: contact.body.id,
        direction: "borrowed",
        amount: 10_000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/debts")
      .set(authHeader(token))
      .send({
        contactId: contact.body.id,
        direction: "lent",
        amount: 4_000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/debts/${borrowed.body.id}/payments`)
      .set(authHeader(token))
      .send({
        amount: 2_000,
        paidAt: "2026-10-15T12:00:00.000Z",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/transactions")
      .set(authHeader(token))
      .send({
        type: "expense",
        accountId: cash.body.id,
        tagId: meals.body.id,
        amount: 500,
        occurredAt: "2026-09-28T12:00:00.000Z",
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated access", async () => {
    await request(app.getHttpServer()).get("/reports/monthly").query({ month: "2026-10" }).expect(401);
  });

  it("returns monthly breakdown, account nets, net worth, and open debts", async () => {
    const res = await request(app.getHttpServer())
      .get("/reports/monthly")
      .set(authHeader(token))
      .query({ month: "2026-10" })
      .expect(200);

    const report = asMonthlyReport(res.body);
    expect(report.month).toBe("2026-10");

    expect(report.categoryBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tagName: "Meals", kind: "expense", total: 3_000 }),
        expect.objectContaining({ tagName: "Salary", kind: "income", total: 50_000 }),
      ]),
    );
    expect(report.categoryBreakdown).toHaveLength(2);

    const wallet = report.perAccountNet.find((row) => row.accountName === "Wallet");
    const kotak = report.perAccountNet.find((row) => row.accountName === "Kotak");
    expect(wallet).toMatchObject({ moneyIn: 5_000, moneyOut: 3_000, net: 2_000 });
    expect(kotak).toMatchObject({ moneyIn: 50_000, moneyOut: 5_000, net: 45_000 });

    expect(report.netWorth.liquid).toBe(21_500 + 145_000);
    expect(report.netWorth.investments).toBe(200_000);
    expect(report.netWorth.openDebtsOwedByYou).toBe(8_000);
    expect(report.netWorth.total).toBe(21_500 + 145_000 + 200_000 - 8_000);

    expect(report.openDebts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contactName: "Ravi",
          direction: "borrowed",
          remaining: 8_000,
        }),
        expect.objectContaining({
          contactName: "Ravi",
          direction: "lent",
          remaining: 4_000,
        }),
      ]),
    );
  });

  it("excludes transactions outside the requested month", async () => {
    const res = await request(app.getHttpServer())
      .get("/reports/monthly")
      .set(authHeader(token))
      .query({ month: "2026-09" })
      .expect(200);

    const report = asMonthlyReport(res.body);
    expect(report.categoryBreakdown).toEqual([
      expect.objectContaining({ tagName: "Meals", total: 500 }),
    ]);
    expect(report.perAccountNet.find((row) => row.accountName === "Wallet")).toMatchObject({
      moneyIn: 0,
      moneyOut: 500,
      net: -500,
    });
  });
});
