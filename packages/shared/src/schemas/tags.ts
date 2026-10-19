import { z } from "zod";
import { hexColorSchema, idSchema } from "./common.js";

export const tagKindSchema = z.enum(["expense", "income"]);
export type TagKind = z.infer<typeof tagKindSchema>;

/** automatic = order by transaction frequency; manual = saved drag-and-drop order. */
export const tagSortModeSchema = z.enum(["automatic", "manual"]);
export type TagSortMode = z.infer<typeof tagSortModeSchema>;

export const tagSortPreferencesSchema = z.object({
  sortMode: tagSortModeSchema,
});
export type TagSortPreferences = z.infer<typeof tagSortPreferencesSchema>;

export const updateTagSortPreferencesSchema = z.object({
  sortMode: tagSortModeSchema,
});
export type UpdateTagSortPreferences = z.infer<typeof updateTagSortPreferencesSchema>;

export const tagSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  kind: tagKindSchema,
  color: hexColorSchema,
  /** Display order (0 = top). Matches saved user preference. */
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: tagKindSchema,
  color: hexColorSchema,
});
export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: hexColorSchema.optional(),
});
export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

/** Save drag-and-drop order from the tags settings screen. */
export const reorderTagsInputSchema = z.object({
  tagIds: z.array(idSchema).min(1),
});
export type ReorderTagsInput = z.infer<typeof reorderTagsInputSchema>;
