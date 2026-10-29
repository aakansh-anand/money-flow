import type { InternalAxiosRequestConfig } from "axios";
import { isAxiosError } from "axios";

import { apiClient } from "./api-client";
import { authActions } from "./slices/auth-slice";

const CSRF_HEADER = "1";

/** These 401s are the answer, not a cue to rotate the session. */
const REFRESH_EXEMPT = ["/auth/login", "/auth/register", "/auth/refresh"];

function isRefreshExempt(url: string | undefined): boolean {
  if (!url) return false;
  return REFRESH_EXEMPT.some((path) => url.includes(path));
}

type AuthAwareStore = {
  dispatch: (action: unknown) => unknown;
};

/**
 * Web auth is cookie-based (`withCredentials`). No Bearer header.
 * On 401, rotate via the refresh cookie, then retry — Set-Cookie updates
 * the access cookie for the retry.
 */
export function setupAxiosInterceptors(store: AuthAwareStore) {
  apiClient.interceptors.request.use((config) => {
    const method = config.method?.toLowerCase();
    if (method && method !== "get" && method !== "head") {
      config.headers["x-kosh-csrf"] = CSRF_HEADER;
    }
    return config;
  });

  let refreshPromise: Promise<boolean> | null = null;

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!isAxiosError(error) || !error.config) {
        return Promise.reject(error);
      }

      const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (
        error.response?.status !== 401 ||
        original._retry ||
        isRefreshExempt(original.url)
      ) {
        return Promise.reject(error);
      }

      original._retry = true;

      refreshPromise ??= apiClient
        .post("/auth/refresh", {}, { headers: { "x-kosh-csrf": CSRF_HEADER } })
        .then(() => true)
        .catch(() => {
          store.dispatch(authActions.clear());
          return false;
        })
        .finally(() => {
          refreshPromise = null;
        });

      const refreshed = await refreshPromise;
      if (!refreshed) {
        return Promise.reject(error);
      }

      return apiClient(original);
    },
  );
}
