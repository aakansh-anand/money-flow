import type { Account, Tag, Transaction } from "@kosh/shared";
import type { accounts, tags, transactions } from "@kosh/db";

type AccountRow = typeof accounts.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type TransactionRow = typeof transactions.$inferSelect;

export function serializeAccount(row: AccountRow): Account {
  return {
    id: row.id,
    type: row.type,
    subtype: row.subtype,
    name: row.name,
    openingBalance: row.openingBalance,
    currentBalance: row.currentBalance,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    color: row.color,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    accountId: row.accountId,
    fromAccountId: row.fromAccountId,
    toAccountId: row.toAccountId,
    tagId: row.tagId,
    amount: row.amount,
    note: row.note,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
