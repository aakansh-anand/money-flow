import { z } from "zod";

export const registerInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  /** Optional label so the sessions list can say "Pixel 8" instead of a raw UA. */
  deviceLabel: z.string().min(1).max(120).optional(),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  deviceLabel: z.string().min(1).max(120).optional(),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshInputSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Access token lifetime in seconds (matches JWT_ACCESS_TTL, default 900). */
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const sessionSchema = z.object({
  id: z.uuid(),
  deviceLabel: z.string().nullable(),
  userAgent: z.string().nullable(),
  lastUsedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  /** True for the session making the request (matched via the JWT `sid` claim). */
  current: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;
