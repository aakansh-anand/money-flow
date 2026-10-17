import { z } from "zod";
import { paiseSchema } from "../money.js";
import { idSchema, isoDateTimeSchema } from "./common.js";

export const transactionTypeSchema = z.enum(["expense", "income", "transfer"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionSchema = z.object({
  id: idSchema,
  type: transactionTypeSchema,
  /** Set for expense/income — the account the money left / landed in. */
  accountId: idSchema.nullable(),
  /** Set for transfers (bank -> bank, or bank -> cash for ATM withdrawals). */
  fromAccountId: idSchema.nullable(),
  toAccountId: idSchema.nullable(),
  tagId: idSchema.nullable(),
  amount: paiseSchema,
  note: z.string().nullable(),
  occurredAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
});
export type Transaction = z.infer<typeof transactionSchema>;

const baseInput = {
  amount: paiseSchema,
  note: z.string().max(500).optional(),
  occurredAt: isoDateTimeSchema,
  tagId: idSchema.optional(),
};

export const createTransactionInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("expense"),
    accountId: idSchema,
    ...baseInput,
  }),
  z.object({
    type: z.literal("income"),
    accountId: idSchema,
    ...baseInput,
  }),
  z.object({
    type: z.literal("transfer"),
    fromAccountId: idSchema,
    toAccountId: idSchema,
    note: z.string().max(500).optional(),
    occurredAt: isoDateTimeSchema,
  }),
]);
export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const updateTransactionInputSchema = z.object({
  amount: paiseSchema.optional(),
  note: z.string().max(500).nullable().optional(),
  occurredAt: isoDateTimeSchema.optional(),
  tagId: idSchema.nullable().optional(),
  accountId: idSchema.optional(),
});
export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

/** Query params for GET /transactions. Cursor pagination feeds the "Load more" button. */
export const transactionQuerySchema = z.object({
  accountId: idSchema.optional(),
  tagId: idSchema.optional(),
  /** ISO datetimes bounding occurredAt. */
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
  cursor: idSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;

export const transactionPageSchema = z.object({
  items: z.array(transactionSchema),
  nextCursor: idSchema.nullable(),
});
export type TransactionPage = z.infer<typeof transactionPageSchema>;
