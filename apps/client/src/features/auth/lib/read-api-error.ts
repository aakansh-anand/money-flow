type ApiErrorData = {
  message?: string | string[];
};

/** RTK Query base-query error: `{ status, data }`, not an Axios error. */
export function readApiError(error: unknown): { status?: number; message?: string } {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return {};
  }

  const status = (error as { status?: number }).status;
  const data = (error as { data?: ApiErrorData }).data;
  const raw = data?.message;
  const message = Array.isArray(raw) ? raw[0] : raw;

  return {
    status,
    message: typeof message === "string" && message.length > 0 ? message : undefined,
  };
}
