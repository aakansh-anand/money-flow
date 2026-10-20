import type { InternalAxiosRequestConfig } from "axios";
import { isAxiosError } from "axios";

import { apiClient } from "./api-client";
import { authActions } from "./slices/auth-slice";

const CSRF_HEADER = "1";

type AuthAwareStore = {
  getState: () => {
    auth: { accessToken: string | null; expiresIn: number | null };
  };
  dispatch: (action: unknown) => unknown;
};

export function setupAxiosInterceptors(store: AuthAwareStore) {
  apiClient.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const method = config.method?.toLowerCase();
    if (method && method !== "get" && method !== "head") {
      config.headers["x-kosh-csrf"] = CSRF_HEADER;
    }
    return config;
  });

  let refreshPromise: Promise<string | null> | null = null;

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!isAxiosError(error) || !error.config) {
        return Promise.reject(error);
      }

      const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }

      original._retry = true;

      refreshPromise ??= apiClient
        .post("/auth/refresh", {}, { headers: { "x-kosh-csrf": CSRF_HEADER } })
        .then((response) => {
          store.dispatch(authActions.setTokens(response.data));
          return response.data.accessToken as string;
        })
        .catch(() => {
          store.dispatch(authActions.clear());
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });

      const accessToken = await refreshPromise;
      if (!accessToken) {
        return Promise.reject(error);
      }

      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    },
  );
}
