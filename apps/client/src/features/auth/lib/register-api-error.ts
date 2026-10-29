import { readApiError } from "./read-api-error";

export type RegisterFieldError = {
  field: "email" | "root";
  message: string;
};

export function mapRegisterApiError(error: unknown): RegisterFieldError {
  const { status, message } = readApiError(error);

  if (status === 409) {
    return {
      field: "email",
      message: message ?? "An account with this email already exists",
    };
  }

  return {
    field: "root",
    message: "Registration failed. Try again.",
  };
}
