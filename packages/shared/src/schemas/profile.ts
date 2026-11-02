import { z } from "zod";

import { accountPasswordSchema } from "./auth.js";

export const onboardingStatusSchema = z.enum(["started", "in-progress", "completed"]);
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

/**
 * Signed-in profile. Name and email are display-only.
 * `onboardingStep` is set only while status is `in-progress`.
 */
export const profileSchema = z.object({
  name: z.string(),
  email: z.email(),
  onboardingStatus: onboardingStatusSchema,
  onboardingStep: z.number().int().positive().nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

/**
 * Save onboarding. `in-progress` must include the step the client is on.
 * `started` and `completed` clear the step.
 */
export const saveOnboardingInputSchema = z.discriminatedUnion("onboardingStatus", [
  z.object({
    onboardingStatus: z.literal("started"),
  }),
  z.object({
    onboardingStatus: z.literal("in-progress"),
    onboardingStep: z.number().int().positive(),
  }),
  z.object({
    onboardingStatus: z.literal("completed"),
  }),
]);
export type SaveOnboardingInput = z.infer<typeof saveOnboardingInputSchema>;

export const CURRENT_PASSWORD_INCORRECT_MESSAGE = "Current password is incorrect";
export const CHANGE_PASSWORD_SUCCESS_MESSAGE = "Password updated";

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Enter your current password" }),
    newPassword: accountPasswordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Choose a different password",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const changePasswordResponseSchema = z.object({
  message: z.literal(CHANGE_PASSWORD_SUCCESS_MESSAGE),
});
export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>;
