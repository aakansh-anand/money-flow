import { isAxiosError } from "axios";

export type RegisterFieldError = {
  field: "email" | "root";
  message: string;
};

export function mapRegisterApiError(error: unknown): RegisterFieldError {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const apiMessage = Array.isArray(data?.message) ? data.message[0] : data?.message;

    if (status === 409) {
      return {
        field: "email",
        message:
          typeof apiMessage === "string" && apiMessage.length > 0
            ? apiMessage
            : "An account with this email already exists",
      };
    }
  }

  return {
    field: "root",
    message: "Registration failed. Try again.",
  };
}
