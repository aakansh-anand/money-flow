import { z } from "zod";
import { paiseSchema } from "../money.js";

export const accountTypeSchema = z.enum(["cash", "bank"]);
export type AccountType = z.infer<typeof accountTypeSchema>;

/**
 * Free-text label the user gives a bank account ("Salary", "Savings",
 * "Chai fund" — their choice). Pure labeling, no effect on balance math.
 * Cash accounts carry no subtype.
 */
export const accountSubtypeSchema = z.string().min(1).max(60);

export const accountSchema = z.object({
  id: z.uuid(),
  type: accountTypeSchema,
  subtype: accountSubtypeSchema.nullable(),
  name: z.string(),
  openingBalance: z.number().int(),
  currentBalance: z.number().int(),
  createdAt: z.iso.datetime(),
});
export type Account = z.infer<typeof accountSchema>;

export const createAccountInputSchema = z
  .object({
    type: accountTypeSchema,
    subtype: accountSubtypeSchema.optional(),
    name: z.string().min(1).max(120),
    openingBalance: z.number().int().nonnegative().default(0),
  })
  .check((ctx) => {
    if (ctx.value.type === "cash" && ctx.value.subtype !== undefined) {
      ctx.issues.push({
        code: "custom",
        message: "Cash accounts cannot have a subtype",
        input: ctx.value.subtype,
      });
    }
  });
export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

export const updateAccountInputSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  subtype: accountSubtypeSchema.nullable().optional(),
  openingBalance: z.number().int().nonnegative().optional(),
});
export type UpdateAccountInput = z.infer<typeof updateAccountInputSchema>;

export { paiseSchema };
