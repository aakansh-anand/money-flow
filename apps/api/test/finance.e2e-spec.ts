import { loadRootEnv } from "@/config/root-env";

loadRootEnv(__dirname);

import { accounts, createDb, sessions, tags, transactions, users, type Db } from "@kosh/db";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "@/app.module";
import {
  asAccount,
  asAccounts,
  asTag,
  asTags,
  asTagSortPreferences,
  asTransactionPage,
  authHeader,
  E2E_PASSWORD,
  findAccountByName,
  findTagByName,
  registerAndLogin,
  tagNames,
} from "./e2e-helpers";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://kosh:kosh@localhost:5436/kosh";
if (!databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
  throw new Error(`Refusing to run e2e against non-local DB: ${databaseUrl}`);
}

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-secret-test-secret-test-secret-42";
process.env.JWT_ACCESS_TTL = "900";
process.env.REFRESH_TOKEN_TTL = "2592000";

describe("Finance (e2e)", () => {
  let app: INestApplication;
  let db: Db;
  let token: string;

  beforeAll(async () => {
    db = createDb(databaseUrl);
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

    token = await registerAndLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated access", async () => {
    await request(app.getHttpServer()).get("/accounts").expect(401);
  });

  describe("accounts + tags", () => {
    it("creates accounts and rejects cash subtype", async () => {
      const cash = await request(app.getHttpServer())
        .post("/accounts")
        .set(authHeader(token))
        .send({ type: "cash", name: "Wallet", openingBalance: 10_000 })
        .expect(201);
      expect(cash.body.currentBalance).toBe(10_000);

      await request(app.getHttpServer())
        .post("/accounts")
        .set(authHeader(token))
        .send({
          type: "cash",
          name: "Bad",
          subtype: "nope",
          openingBalance: 0,
        })
        .expect(400);

      const bank = await request(app.getHttpServer())
        .post("/accounts")
        .set(authHeader(token))
        .send({
          type: "bank",
          name: "Kotak",
          subtype: "Salary",
          openingBalance: 50_000,
        })
        .expect(201);
      expect(bank.body.subtype).toBe("Salary");
    });

    it("lists accounts and patches opening balance onto current balance", async () => {
      const listRes = await request(app.getHttpServer())
        .get("/accounts")
        .set(authHeader(token))
        .expect(200);
      const list = asAccounts(listRes.body);
      expect(list.length).toBeGreaterThanOrEqual(2);

      const cash = findAccountByName(list, "Wallet");
      const patched = await request(app.getHttpServer())
        .patch(`/accounts/${cash.id}`)
        .set(authHeader(token))
        .send({ openingBalance: 12_000 })
        .expect(200);
      expect(patched.body.openingBalance).toBe(12_000);
      expect(patched.body.currentBalance).toBe(12_000);
    });

    it("creates tags", async () => {
      await request(app.getHttpServer())
        .post("/tags")
        .set(authHeader(token))
        .send({ name: "Meals", kind: "expense", color: "#DC2626" })
        .expect(201);
    });

    it("rejects duplicate tag names regardless of casing", async () => {
      await request(app.getHttpServer())
        .post("/tags")
        .set(authHeader(token))
        .send({ name: "meals", kind: "expense", color: "#000000" })
        .expect(409);

      await request(app.getHttpServer())
        .post("/tags")
        .set(authHeader(token))
        .send({ name: "MEALS", kind: "income", color: "#111111" })
        .expect(409);
    });

    it("defaults to automatic mode (creation order until transactions exist)", async () => {
      const prefs = await request(app.getHttpServer())
        .get("/tags/preferences")
        .set(authHeader(token))
        .expect(200);
      expect(asTagSortPreferences(prefs.body).sortMode).toBe("automatic");
    });

    it("lists tags in creation order until user saves a custom order", async () => {
      const userToken = await registerAndLogin(app, "tags-order@example.com", E2E_PASSWORD);

      const first = await request(app.getHttpServer())
        .post("/tags")
        .set(authHeader(userToken))
        .send({ name: "Alpha", kind: "expense", color: "#111111" })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post("/tags")
        .set(authHeader(userToken))
        .send({ name: "Beta", kind: "expense", color: "#222222" })
        .expect(201);
      const third = await request(app.getHttpServer())
        .post("/tags")
        .set(authHeader(userToken))
        .send({ name: "Gamma", kind: "expense", color: "#333333" })
        .expect(201);

      const alpha = asTag(first.body);
      const beta = asTag(second.body);
      const gamma = asTag(third.body);

      let listRes = await request(app.getHttpServer())
        .get("/tags")
        .set(authHeader(userToken))
        .expect(200);
      expect(tagNames(asTags(listRes.body))).toEqual(["Alpha", "Beta", "Gamma"]);

      listRes = await request(app.getHttpServer())
        .put("/tags/order")
        .set(authHeader(userToken))
        .send({
          tagIds: [gamma.id, alpha.id, beta.id],
        })
        .expect(200);
      expect(tagNames(asTags(listRes.body))).toEqual(["Gamma", "Alpha", "Beta"]);

      const persistedRes = await request(app.getHttpServer())
        .get("/tags")
        .set(authHeader(userToken))
        .expect(200);
      expect(tagNames(asTags(persistedRes.body))).toEqual(["Gamma", "Alpha", "Beta"]);

      const prefs = await request(app.getHttpServer())
        .get("/tags/preferences")
        .set(authHeader(userToken))
        .expect(200);
      expect(asTagSortPreferences(prefs.body).sortMode).toBe("manual");
    });

    it("orders tags by transaction frequency in automatic mode", async () => {
      const userToken = await registerAndLogin(app, "tags-freq@example.com", E2E_PASSWORD);

      const cashRes = await request(app.getHttpServer())
        .post("/accounts")
        .set(authHeader(userToken))
        .send({ type: "cash", name: "Cash", openingBalance: 100_000 })
        .expect(201);
      const cash = asAccount(cashRes.body);

      const rare = asTag(
        (
          await request(app.getHttpServer())
            .post("/tags")
            .set(authHeader(userToken))
            .send({ name: "Rare", kind: "expense", color: "#111111" })
            .expect(201)
        ).body,
      );
      const popular = asTag(
        (
          await request(app.getHttpServer())
            .post("/tags")
            .set(authHeader(userToken))
            .send({ name: "Popular", kind: "expense", color: "#222222" })
            .expect(201)
        ).body,
      );
      await request(app.getHttpServer())
        .post("/tags")
        .set(authHeader(userToken))
        .send({ name: "Unused", kind: "expense", color: "#333333" })
        .expect(201);

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post("/transactions")
          .set(authHeader(userToken))
          .send({
            type: "expense",
            accountId: cash.id,
            tagId: popular.id,
            amount: 100,
            occurredAt: `2026-10-0${(i % 9) + 1}T12:00:00.000Z`,
          })
          .expect(201);
      }
      await request(app.getHttpServer())
        .post("/transactions")
        .set(authHeader(userToken))
        .send({
          type: "expense",
          accountId: cash.id,
          tagId: rare.id,
          amount: 100,
          occurredAt: "2026-10-05T12:00:00.000Z",
        })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get("/tags")
        .set(authHeader(userToken))
        .expect(200);
      expect(tagNames(asTags(listRes.body))).toEqual(["Popular", "Rare", "Unused"]);
    });

    it("allows renaming a tag to different casing of its own name", async () => {
      const listRes = await request(app.getHttpServer())
        .get("/tags")
        .set(authHeader(token))
        .expect(200);
      const meals = findTagByName(asTags(listRes.body), "Meals");

      await request(app.getHttpServer())
        .patch(`/tags/${meals.id}`)
        .set(authHeader(token))
        .send({ name: "MEALS" })
        .expect(200);

      const updatedRes = await request(app.getHttpServer())
        .get("/tags")
        .set(authHeader(token))
        .expect(200);
      expect(
        asTags(updatedRes.body).filter((tag) => tag.name.toLowerCase().includes("meal")),
      ).toHaveLength(1);
    });
  });

  describe("balance maintenance", () => {
    let cashId: string;
    let bankId: string;
    let mealTagId: string;

    beforeAll(async () => {
      const acctsRes = await request(app.getHttpServer())
        .get("/accounts")
        .set(authHeader(token))
        .expect(200);
      const accts = asAccounts(acctsRes.body);
      cashId = findAccountByName(accts, "Wallet").id;
      bankId = findAccountByName(accts, "Kotak").id;

      const tagListRes = await request(app.getHttpServer())
        .get("/tags")
        .set(authHeader(token))
        .expect(200);
      mealTagId = findTagByName(asTags(tagListRes.body), "meals").id;

      await request(app.getHttpServer())
        .patch(`/accounts/${cashId}`)
        .set(authHeader(token))
        .send({ openingBalance: 10_000, name: "Wallet" })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/accounts/${bankId}`)
        .set(authHeader(token))
        .send({ openingBalance: 50_000 })
        .expect(200);
    });

    it("applies expense, income, and transfer balance changes", async () => {
      await request(app.getHttpServer())
        .post("/transactions")
        .set(authHeader(token))
        .send({
          type: "expense",
          accountId: cashId,
          tagId: mealTagId,
          amount: 2_500,
          occurredAt: "2026-10-01T12:00:00.000Z",
        })
        .expect(201);

      await request(app.getHttpServer())
        .post("/transactions")
        .set(authHeader(token))
        .send({
          type: "income",
          accountId: bankId,
          amount: 15_000,
          occurredAt: "2026-10-02T12:00:00.000Z",
        })
        .expect(201);

      await request(app.getHttpServer())
        .post("/transactions")
        .set(authHeader(token))
        .send({
          type: "transfer",
          fromAccountId: bankId,
          toAccountId: cashId,
          amount: 5_000,
          occurredAt: "2026-10-03T12:00:00.000Z",
          note: "ATM",
        })
        .expect(201);

      const accts = asAccounts(
        (await request(app.getHttpServer()).get("/accounts").set(authHeader(token)).expect(200))
          .body,
      );
      const cash = accts.find((account) => account.id === cashId);
      const bank = accts.find((account) => account.id === bankId);
      if (!cash || !bank) throw new Error("Expected cash and bank accounts in e2e fixture");
      expect(cash.currentBalance).toBe(12_500);
      expect(bank.currentBalance).toBe(60_000);
    });

    it("reverses and reapplies on patch and delete", async () => {
      const page = asTransactionPage(
        (
          await request(app.getHttpServer())
            .get("/transactions")
            .set(authHeader(token))
            .query({ accountId: cashId, limit: 10 })
            .expect(200)
        ).body,
      );
      const expense = page.items.find((txn) => txn.type === "expense");
      if (!expense) throw new Error("Expected expense transaction in e2e fixture");

      await request(app.getHttpServer())
        .patch(`/transactions/${expense.id}`)
        .set(authHeader(token))
        .send({ amount: 1_000 })
        .expect(200);

      let accts = asAccounts(
        (await request(app.getHttpServer()).get("/accounts").set(authHeader(token)).expect(200))
          .body,
      );
      let cash = accts.find((account) => account.id === cashId);
      if (!cash) throw new Error("Expected cash account in e2e fixture");
      expect(cash.currentBalance).toBe(14_000);

      await request(app.getHttpServer())
        .delete(`/transactions/${expense.id}`)
        .set(authHeader(token))
        .expect(204);

      accts = asAccounts(
        (await request(app.getHttpServer()).get("/accounts").set(authHeader(token)).expect(200))
          .body,
      );
      cash = accts.find((account) => account.id === cashId);
      if (!cash) throw new Error("Expected cash account in e2e fixture");
      expect(cash.currentBalance).toBe(15_000);
    });

    it("paginates with cursor", async () => {
      const first = asTransactionPage(
        (
          await request(app.getHttpServer())
            .get("/transactions")
            .set(authHeader(token))
            .query({ limit: 1 })
            .expect(200)
        ).body,
      );
      expect(first.items).toHaveLength(1);
      expect(first.nextCursor).toEqual(expect.any(String));

      const second = asTransactionPage(
        (
          await request(app.getHttpServer())
            .get("/transactions")
            .set(authHeader(token))
            .query({ limit: 1, cursor: first.nextCursor })
            .expect(200)
        ).body,
      );
      expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
    });
  });
});
