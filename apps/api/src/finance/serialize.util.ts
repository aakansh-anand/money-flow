import type {
  Account,
  Contact,
  Debt,
  DebtDetail,
  DebtPayment,
  InvestmentTransaction,
  InvestmentType,
  Tag,
  Transaction,
} from "@kosh/shared";
import type {
  accounts,
  contacts,
  debtPayments,
  debts,
  investmentTransactions,
  investmentTypes,
  tags,
  transactions,
} from "@kosh/db";

type AccountRow = typeof accounts.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type TransactionRow = typeof transactions.$inferSelect;
type InvestmentTypeRow = typeof investmentTypes.$inferSelect;
type InvestmentTransactionRow = typeof investmentTransactions.$inferSelect;
type ContactRow = typeof contacts.$inferSelect;
type DebtRow = typeof debts.$inferSelect;
type DebtPaymentRow = typeof debtPayments.$inferSelect;

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

export function serializeInvestmentType(
  row: InvestmentTypeRow,
  investedTotal: number,
): InvestmentType {
  return {
    id: row.id,
    name: row.name,
    currentValue: row.currentValue,
    investedTotal,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeInvestmentTransaction(row: InvestmentTransactionRow): InvestmentTransaction {
  return {
    id: row.id,
    investmentTypeId: row.investmentTypeId,
    instrumentName: row.instrumentName,
    type: row.type,
    amount: row.amount,
    occurredAt: row.occurredAt.toISOString(),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeDebtPayment(row: DebtPaymentRow): DebtPayment {
  return {
    id: row.id,
    debtId: row.debtId,
    amount: row.amount,
    paidAt: row.paidAt.toISOString(),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeDebt(
  row: DebtRow,
  contactName: string,
  remaining: number,
): Debt {
  return {
    id: row.id,
    contactId: row.contactId,
    contactName,
    direction: row.direction,
    amount: row.amount,
    remaining,
    status: row.status,
    dueDate: row.dueDate?.toISOString() ?? null,
    settledAt: row.settledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeDebtDetail(
  row: DebtRow,
  contactName: string,
  remaining: number,
  payments: DebtPaymentRow[],
): DebtDetail {
  return {
    ...serializeDebt(row, contactName, remaining),
    payments: payments.map(serializeDebtPayment),
  };
}
