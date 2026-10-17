/**
 * Minimal typed fetch wrapper shared by web and mobile.
 * RTK Query's baseQuery delegates to this so both clients get identical
 * auth-header and error behavior.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

type QueryValue = string | number | boolean | undefined;
type Query = Record<string, QueryValue>;

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function createApiClient(options: ApiClientOptions) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Query,
  ): Promise<T> {
    const token = await options.getAccessToken?.();
    const res = await fetch(buildUrl(options.baseUrl, path, query), {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) options.onUnauthorized?.();

    if (!res.ok) {
      const errorBody: unknown = await res.json().catch(() => null);
      throw new ApiError(res.status, errorBody);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    get: <T>(path: string, query?: Query) => request<T>("GET", path, undefined, query),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    del: <T>(path: string) => request<T>("DELETE", path),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
