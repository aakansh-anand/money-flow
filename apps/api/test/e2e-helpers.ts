import type { Account, AuthTokens, Tag, TagSortPreferences, TransactionPage } from "@kosh/shared";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

export const E2E_EMAIL = "kosh-finance-e2e@example.com";
export const E2E_NAME = "E2E User";
export const E2E_PASSWORD = "KoshE2e99";

export async function registerAndLogin(
  app: INestApplication,
  email = E2E_EMAIL,
  password = E2E_PASSWORD,
): Promise<string> {
  await request(app.getHttpServer())
    .post("/auth/register")
    .send({ name: E2E_NAME, email, password, confirmPassword: password, deviceLabel: "finance-e2e" })
    .expect(201);

  const login = await request(app.getHttpServer())
    .post("/auth/login")
    .send({ email, password })
    .expect(200);

  const tokens = login.body as AuthTokens;
  return tokens.accessToken;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export function asAccounts(body: unknown): Account[] {
  return body as Account[];
}

export function asTags(body: unknown): Tag[] {
  return body as Tag[];
}

export function findAccountByName(accounts: Account[], name: string): Account {
  const account = accounts.find((row) => row.name === name);
  if (!account) {
    throw new Error(`Expected account "${name}" in e2e fixture`);
  }
  return account;
}

export function findTagByName(tags: Tag[], name: string): Tag {
  const tag = tags.find((row) => row.name.toLowerCase() === name.toLowerCase());
  if (!tag) {
    throw new Error(`Expected tag "${name}" in e2e fixture`);
  }
  return tag;
}

export function tagNames(tags: Tag[]): string[] {
  return tags.map((tag) => tag.name);
}

export function asTagSortPreferences(body: unknown): TagSortPreferences {
  return body as TagSortPreferences;
}

export function asTransactionPage(body: unknown): TransactionPage {
  return body as TransactionPage;
}

export function asAccount(body: unknown): Account {
  return body as Account;
}

export function asTag(body: unknown): Tag {
  return body as Tag;
}
