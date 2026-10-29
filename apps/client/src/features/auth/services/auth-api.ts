import type { CurrentUser, LoginInput, LoginResponse, RegisterInput } from "@kosh/shared";

import type { AppDispatch } from "@/redux";
import { baseApi } from "@/redux/api/base-api";
import { authActions } from "@/redux/slices/auth-slice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", data: body }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Access + refresh land in httpOnly cookies via Set-Cookie.
          dispatch(authActions.setAuthenticated());
        } catch {
          // The form maps the unwrapped error.
        }
      },
    }),
    register: builder.mutation<{ status: "ok" }, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", data: body }),
      transformResponse: () => ({ status: "ok" as const }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authActions.setAuthenticated());
        } catch {
          // The form maps the unwrapped error.
        }
      },
    }),
    /** First call on load. Cookies go with the request (`withCredentials`). */
    getMe: builder.query<CurrentUser, void>({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authActions.setAuthenticated());
        } catch {
          // restoreSession clears when this fails after refresh.
        }
      },
    }),
    logout: builder.mutation<null, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      transformResponse: () => null,
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;

/** One check per page load. Strict Mode remounts effects. */
let sessionRestoreStarted = false;

/**
 * First request in the app. Access cookie (and refresh on 401) prove the
 * session. 200 → stay signed in. Final 401 → login.
 */
export function restoreSession(dispatch: AppDispatch) {
  if (sessionRestoreStarted) return;
  sessionRestoreStarted = true;

  const request = dispatch(authApi.endpoints.getMe.initiate());
  void request
    .unwrap()
    .catch(() => {
      dispatch(authActions.clear());
    })
    .finally(() => {
      request.unsubscribe();
    });
}
