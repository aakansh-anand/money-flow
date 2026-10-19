import { z } from "zod";
import { paiseSchema } from "../money.js";
import { idSchema, isoDateTimeSchema } from "./common.js";

export const contactTypeSchema = z.enum(["person", "bank", "institution"]);
export type ContactType = z.infer<typeof contactTypeSchema>;

export const contactSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: contactTypeSchema,
  createdAt: isoDateTimeSchema,
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactInputSchema = z.object({
  name: z.string().min(1).max(120),
  type: contactTypeSchema.default("person"),
});
export type CreateContactInput = z.infer<typeof createContactInputSchema>;

export const debtDirectionSchema = z.enum(["lent", "borrowed"]);
export type DebtDirection = z.infer<typeof debtDirectionSchema>;

export const debtStatusSchema = z.enum(["open", "settled"]);
export type DebtStatus = z.infer<typeof debtStatusSchema>;

export const debtPaymentSchema = z.object({
  id: idSchema,
  debtId: idSchema,
  amount: paiseSchema,
  paidAt: isoDateTimeSchema,
  note: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});
export type DebtPayment = z.infer<typeof debtPaymentSchema>;

export const debtSchema = z.object({
  id: idSchema,
  contactId: idSchema,
  contactName: z.string(),
  direction: debtDirectionSchema,
  /** Original principal in paise. */
  amount: paiseSchema,
  /** Computed on read: amount - SUM(payments). */
  remaining: z.number().int(),
  status: debtStatusSchema,
  dueDate: isoDateTimeSchema.nullable(),
  settledAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});
export type Debt = z.infer<typeof debtSchema>;

/** GET /debts/:id — the debt plus its full repayment history. */
export const debtDetailSchema = debtSchema.extend({
  payments: z.array(debtPaymentSchema),
});
export type DebtDetail = z.infer<typeof debtDetailSchema>;

export const createDebtInputSchema = z.object({
  contactId: idSchema,
  direction: debtDirectionSchema,
  amount: paiseSchema,
  dueDate: isoDateTimeSchema.optional(),
});
export type CreateDebtInput = z.infer<typeof createDebtInputSchema>;

export const updateDebtInputSchema = z.object({
  amount: paiseSchema.optional(),
  dueDate: isoDateTimeSchema.nullable().optional(),
});
export type UpdateDebtInput = z.infer<typeof updateDebtInputSchema>;

export const createDebtPaymentInputSchema = z.object({
  amount: paiseSchema,
  paidAt: isoDateTimeSchema,
  note: z.string().max(500).optional(),
});
export type CreateDebtPaymentInput = z.infer<typeof createDebtPaymentInputSchema>;

/** Query params for GET /debts. */
export const debtListQuerySchema = z.object({
  status: debtStatusSchema.optional(),
});
export type DebtListQuery = z.infer<typeof debtListQuerySchema>;
