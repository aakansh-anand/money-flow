import { CURRENT_PASSWORD_INCORRECT_MESSAGE } from "@kosh/shared";

import { readApiError } from "@/features/auth/lib/read-api-error";

export type ChangePasswordField = "currentPassword" | "root";

export function mapChangePasswordError(error: unknown): {
  field: ChangePasswordField;
  message: string;
} {
  const { status, message } = readApiError(error);

  if (message === CURRENT_PASSWORD_INCORRECT_MESSAGE) {
    return { field: "currentPassword", message };
  }

  if (status === 429) {
    return { field: "root", message: "Too many attempts. Try again in a minute." };
  }

  return {
    field: "root",
    message: "Couldn't update the password. Try again.",
  };
}
