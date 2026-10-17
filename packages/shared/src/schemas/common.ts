import { z } from "zod";

export const idSchema = z.uuid();
export const isoDateTimeSchema = z.iso.datetime();
/** YYYY-MM month key used by the reports endpoint, e.g. "2026-10". */
export const monthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
/** #RRGGBB hex color for tags. */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/);
