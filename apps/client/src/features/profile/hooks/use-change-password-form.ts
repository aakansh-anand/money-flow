"use client";

import { changePasswordInputSchema, CHANGE_PASSWORD_SUCCESS_MESSAGE, type ChangePasswordInput } from "@kosh/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useChangePasswordMutation } from "@/features/profile/services/profile-api";

export function useChangePasswordForm() {
  const [changePassword] = useChangePasswordMutation();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordInputSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const submitChangePassword = useCallback(
    async (values: ChangePasswordInput) => {
      await changePassword(values).unwrap();
      form.reset();
      toast.success(CHANGE_PASSWORD_SUCCESS_MESSAGE);
    },
    [changePassword, form],
  );

  return {
    form,
    submitChangePassword,
    isSubmitting: form.formState.isSubmitting,
  };
}
