import { z } from "zod";
import { paiseSchema } from "../money.js";
import { idSchema, isoDateTimeSchema } from "./common.js";

export const investmentTypeSchema = z.object({
  id: idSchema,
  name: z.string(),
  /** Manual mark-to-market value in paise, updated by hand — distinct from the computed invested total. */
  currentValue: z.number().int(),
  /** Computed on read: SUM(invest) - SUM(withdraw) across this type's transactions. */
  investedTotal: z.number().int(),
  createdAt: isoDateTimeSchema,
});
export type InvestmentType = z.infer<typeof investmentTypeSchema>;

export const createInvestmentTypeInputSchema = z.object({
  name: z.string().min(1).max(120),
  currentValue: z.number().int().nonnegative().default(0),
});
export type CreateInvestmentTypeInput = z.infer<typeof createInvestmentTypeInputSchema>;

export const updateInvestmentTypeInputSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  currentValue: z.number().int().nonnegative().optional(),
});
export type UpdateInvestmentTypeInput = z.infer<typeof updateInvestmentTypeInputSchema>;

export const investmentTransactionTypeSchema = z.enum(["invest", "withdraw"]);
export type InvestmentTransactionType = z.infer<typeof investmentTransactionTypeSchema>;

export const investmentTransactionSchema = z.object({
  id: idSchema,
  investmentTypeId: idSchema,
  instrumentName: z.string(),
  type: investmentTransactionTypeSchema,
  amount: paiseSchema,
  occurredAt: isoDateTimeSchema,
  note: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});
export type InvestmentTransaction = z.infer<typeof investmentTransactionSchema>;

export const createInvestmentTransactionInputSchema = z.object({
  investmentTypeId: idSchema,
  instrumentName: z.string().min(1).max(160),
  type: investmentTransactionTypeSchema,
  amount: paiseSchema,
  occurredAt: isoDateTimeSchema,
  note: z.string().max(500).optional(),
});
export type CreateInvestmentTransactionInput = z.infer<
  typeof createInvestmentTransactionInputSchema
>;

/** Query params for GET /investment-transactions. */
export const investmentTransactionQuerySchema = z.object({
  investmentTypeId: idSchema.optional(),
});
export type InvestmentTransactionQuery = z.infer<typeof investmentTransactionQuerySchema>;
