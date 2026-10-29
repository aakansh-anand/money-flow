"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { AuthFieldLabel } from "@/features/auth/components/auth-field-label";
import { AuthMotionItem } from "@/features/auth/components/auth-motion";
import { formShakeVariant, formStaggerContainer, tapScale } from "@/utils/animations";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";

import { registerPasswordGuide } from "@kosh/shared";

import { mapRegisterApiError } from "../lib/register-api-error";
import { useRegisterForm } from "../hooks/use-register-form";

const RegisterForm = () => {
  const { form, submitRegistration, isSubmitting } = useRegisterForm();
  const reduceMotion = useReducedMotion();
  const [shake, setShake] = useState(false);
  const {
    register,
    formState: { errors },
  } = form;

  const triggerShake = useCallback(() => {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
  }, []);

  const onShakeComplete = useCallback(() => {
    setShake(false);
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await submitRegistration(values);
    } catch (error) {
      const { field, message } = mapRegisterApiError(error);
      form.setError(field, { message });
      triggerShake();
    }
  }, triggerShake);

  return (
    <motion.form
      className="mt-8 flex flex-col gap-4 text-left"
      onSubmit={onSubmit}
      noValidate
      initial="hidden"
      animate={shake && !reduceMotion ? formShakeVariant : "show"}
      variants={formStaggerContainer}
      onAnimationComplete={(definition) => {
        if (definition === formShakeVariant) {
          onShakeComplete();
        }
      }}
    >
      <AuthMotionItem className="flex flex-col gap-2">
        <AuthFieldLabel
          htmlFor="email"
          label="Email"
          error={errors.email?.message}
          errorId="email-error"
        />
        <Input
          id="email"
          type="email"
          placeholder="name@gmail.com"
          autoComplete="off"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input"
          {...register("email")}
        />
      </AuthMotionItem>

      <AuthMotionItem className="flex flex-col gap-2">
        <AuthFieldLabel
          htmlFor="password"
          label="Password"
          error={errors.password?.message}
          errorId="password-error"
        />
        <PasswordInput
          id="password"
          placeholder="e.g. MyPass99"
          autoComplete="new-password"
          className="ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error password-guide" : "password-guide"}
          {...register("password")}
        />
        <p id="password-guide" className="text-sm text-muted-foreground">
          {registerPasswordGuide}
        </p>
      </AuthMotionItem>

      <AuthMotionItem className="flex flex-col gap-2">
        <AuthFieldLabel
          htmlFor="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
          errorId="confirm-password-error"
        />
        <PasswordInput
          id="confirmPassword"
          placeholder="Re-enter your password"
          className="ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          {...register("confirmPassword")}
        />
      </AuthMotionItem>

      {errors.root ? (
        <AuthMotionItem>
          <p className="text-base text-destructive" role="alert">
            {errors.root.message}
          </p>
        </AuthMotionItem>
      ) : null}

      <AuthMotionItem {...tapScale}>
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-base">
          {isSubmitting ? <Spinner className="size-4" /> : "Create account"}
        </Button>
      </AuthMotionItem>
    </motion.form>
  );
};

export default RegisterForm;
