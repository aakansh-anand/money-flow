import { pgEnum } from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", ["cash", "bank"]);
export const tagKindEnum = pgEnum("tag_kind", ["expense", "income"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "expense",
  "income",
  "transfer",
]);
export const investmentTxnTypeEnum = pgEnum("investment_txn_type", [
  "invest",
  "withdraw",
]);
export const contactTypeEnum = pgEnum("contact_type", [
  "person",
  "bank",
  "institution",
]);
export const debtDirectionEnum = pgEnum("debt_direction", ["lent", "borrowed"]);
export const debtStatusEnum = pgEnum("debt_status", ["open", "settled"]);
