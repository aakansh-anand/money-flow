"use client";

import { registerInputSchema, type RegisterInput } from "@kosh/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { useRegisterMutation } from "@/features/auth/services/auth-api";

export function useRegisterForm() {
  const router = useRouter();
  const [registerUser] = useRegisterMutation();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submitRegistration = useCallback(async (values: RegisterInput) => {
    await registerUser(values).unwrap();
    router.replace("/");
  }, [registerUser, router]);

  return {
    form,
    submitRegistration,
    isSubmitting: form.formState.isSubmitting,
  };
}
