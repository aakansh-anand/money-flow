import { isAxiosError } from "axios";

export type LoginFieldError = {
  field: "root";
  message: string;
};

export function mapLoginApiError(error: unknown): LoginFieldError {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const apiMessage = Array.isArray(data?.message) ? data.message[0] : data?.message;

    if (status === 401) {
      return {
        field: "root",
        message:
          typeof apiMessage === "string" && apiMessage.length > 0
            ? apiMessage
            : "Email or password is incorrect",
      };
    }

    if (status === 429) {
      return {
        field: "root",
        message: "Too many attempts. Try again in a minute.",
      };
    }
  }

  return {
    field: "root",
    message: "Login failed. Try again.",
  };
}
