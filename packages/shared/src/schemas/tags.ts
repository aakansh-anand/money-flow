import { z } from "zod";
import { hexColorSchema } from "./common.js";

export const tagKindSchema = z.enum(["expense", "income"]);
export type TagKind = z.infer<typeof tagKindSchema>;

export const tagSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  kind: tagKindSchema,
  color: hexColorSchema,
  createdAt: z.iso.datetime(),
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  name: z.string().min(1).max(60),
  kind: tagKindSchema,
  color: hexColorSchema,
});
export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: hexColorSchema.optional(),
});
export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;
