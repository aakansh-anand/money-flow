"use client";

import { registerPasswordGuide } from "@kosh/shared";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useChangePasswordForm } from "@/features/profile/hooks/use-change-password-form";
import { mapChangePasswordError } from "@/features/profile/lib/change-password-api-error";

export function ChangePasswordForm() {
  const { form, submitChangePassword, isSubmitting } = useChangePasswordForm();
  const {
    register,
    formState: { errors },
  } = form;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await submitChangePassword(values);
    } catch (error) {
      const mapped = mapChangePasswordError(error);
      form.setError(mapped.field, { message: mapped.message });
    }
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold">Change password</h2>
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="current-password">Current password</Label>
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword ? true : undefined}
            aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
            {...register("currentPassword")}
          />
          {errors.currentPassword ? (
            <p id="current-password-error" role="alert" className="text-sm text-destructive">
              {errors.currentPassword.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            aria-invalid={errors.newPassword ? true : undefined}
            aria-describedby={errors.newPassword ? "new-password-error" : "new-password-guide"}
            {...register("newPassword")}
          />
          {errors.newPassword ? (
            <p id="new-password-error" role="alert" className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          ) : (
            <p id="new-password-guide" className="text-sm text-muted-foreground">
              {registerPasswordGuide}
            </p>
          )}
        </div>

        {errors.root ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="self-start w-full py-6"
          size={"lg"}
        >
          {isSubmitting ? <Spinner className="size-4" /> : "Update password"}
        </Button>
      </form>
    </section>
  );
}
