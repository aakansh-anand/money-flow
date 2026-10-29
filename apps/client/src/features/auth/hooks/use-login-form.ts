"use client";

import { loginInputSchema, type LoginInput } from "@kosh/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { useLoginMutation } from "@/features/auth/services/auth-api";

export function useLoginForm() {
  const router = useRouter();
  const [login] = useLoginMutation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const submitLogin = useCallback(async (values: LoginInput) => {
    await login(values).unwrap();
    router.replace("/");
  }, [login, router]);

  return {
    form,
    submitLogin,
    isSubmitting: form.formState.isSubmitting,
  };
}
