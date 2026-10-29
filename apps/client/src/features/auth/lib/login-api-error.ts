import { readApiError } from "./read-api-error";

export type LoginFieldError = {
  field: "root";
  message: string;
};

export function mapLoginApiError(error: unknown): LoginFieldError {
  const { status, message } = readApiError(error);

  if (status === 401) {
    return {
      field: "root",
      message: message ?? "Email or password is incorrect",
    };
  }

  if (status === 429) {
    return {
      field: "root",
      message: "Too many attempts. Try again in a minute.",
    };
  }

  return {
    field: "root",
    message: "Login failed. Try again.",
  };
}
