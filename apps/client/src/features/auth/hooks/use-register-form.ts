"use client";

import { registerInputSchema, type AuthTokens, type RegisterInput } from "@kosh/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { apiClient } from "@/redux/api-client";
import { useAppDispatch } from "@/redux/hooks";
import { authActions } from "@/redux/slices/auth-slice";

export function useRegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submitRegistration = useCallback(async (values: RegisterInput) => {
    const { data } = await apiClient.post<AuthTokens>("/auth/register", values);
    dispatch(authActions.setTokens(data));
    router.push("/");
  }, [dispatch, router]);

  return {
    form,
    submitRegistration,
    isSubmitting: form.formState.isSubmitting,
  };
}
