"use client";

import { loginInputSchema, type AuthTokens, type LoginInput } from "@kosh/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { apiClient } from "@/redux/api-client";
import { useAppDispatch } from "@/redux/hooks";
import { authActions } from "@/redux/slices/auth-slice";

export function useLoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const submitLogin = useCallback(async (values: LoginInput) => {
    const { data } = await apiClient.post<AuthTokens>("/auth/login", values);
    dispatch(authActions.setTokens(data));
    router.push("/");
  }, [dispatch, router]);

  return {
    form,
    submitLogin,
    isSubmitting: form.formState.isSubmitting,
  };
}
