import { z } from "zod";
import { hexColorSchema, monthKeySchema } from "./common.js";
import { tagKindSchema } from "./tags.js";
import { debtDirectionSchema } from "./debts.js";

export const monthlyReportQuerySchema = z.object({
  month: monthKeySchema,
});
export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;

export const categoryBreakdownItemSchema = z.object({
  tagId: z.uuid(),
  tagName: z.string(),
  tagColor: hexColorSchema,
  kind: tagKindSchema,
  total: z.number().int(),
});
export type CategoryBreakdownItem = z.infer<typeof categoryBreakdownItemSchema>;

export const accountNetItemSchema = z.object({
  accountId: z.uuid(),
  accountName: z.string(),
  moneyIn: z.number().int(),
  moneyOut: z.number().int(),
  net: z.number().int(),
});
export type AccountNetItem = z.infer<typeof accountNetItemSchema>;

export const openDebtItemSchema = z.object({
  contactId: z.uuid(),
  contactName: z.string(),
  direction: debtDirectionSchema,
  /** Total remaining across all open debts with this contact. */
  remaining: z.number().int(),
});
export type OpenDebtItem = z.infer<typeof openDebtItemSchema>;

export const monthlyReportSchema = z.object({
  month: monthKeySchema,
  categoryBreakdown: z.array(categoryBreakdownItemSchema),
  perAccountNet: z.array(accountNetItemSchema),
  netWorth: z.object({
    liquid: z.number().int(),
    investments: z.number().int(),
    openDebtsOwedByYou: z.number().int(),
    total: z.number().int(),
  }),
  openDebts: z.array(openDebtItemSchema),
});
export type MonthlyReport = z.infer<typeof monthlyReportSchema>;
