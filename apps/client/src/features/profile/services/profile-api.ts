import type {
  ChangePasswordInput,
  ChangePasswordResponse,
  Profile,
  SaveOnboardingInput,
} from "@kosh/shared";

import { baseApi } from "@/redux/api/base-api";

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<Profile, void>({
      query: () => ({ url: "/profile" }),
      providesTags: ["Profile"],
    }),
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordInput>({
      query: (body) => ({ url: "/profile/change-password", method: "POST", data: body }),
    }),
    saveOnboarding: builder.mutation<Profile, SaveOnboardingInput>({
      query: (body) => ({ url: "/profile/onboarding", method: "PATCH", data: body }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const { useGetProfileQuery, useChangePasswordMutation, useSaveOnboardingMutation } =
  profileApi;
