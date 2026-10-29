"use client";

import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils";
import {
  authCardMovingBorderContainerClassName,
  authCardMovingBorderInnerClassName,
  authCardMovingBorderPhases,
  authCardMovingBorderRadius,
  brandMarkEnter,
  linkUnderlineReveal,
  movingBorderDuration,
  movingBorderGlowClassName,
  pageFrameEnter,
  staggerContainer,
  staggerItem,
} from "@/utils/animations";
import { motion, type HTMLMotionProps, useReducedMotion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

export function AuthBrandMark() {
  return (
    <motion.p
      className="fixed top-8 left-1/2 z-10 -translate-x-1/2 font-heading text-4xl font-semibold tracking-tight"
      {...brandMarkEnter}
    >
      Kosh
    </motion.p>
  );
}

export function AuthPlusBackground() {
  return (
    <div
      aria-hidden
      className="auth-plus-pattern pointer-events-none fixed inset-0 -z-10 mask-[radial-gradient(ellipse_at_center,black_35%,transparent_88%)]"
    />
  );
}

type AuthAnimatedLinkProps = ComponentProps<typeof Link>;

export function AuthAnimatedLink({ className, children, ...props }: AuthAnimatedLinkProps) {
  return (
    <Link
      className={cn(
        "group relative inline-block font-medium no-underline hover:no-underline",
        className,
      )}
      {...props}
    >
      {children}
      <span aria-hidden className={linkUnderlineReveal} />
    </Link>
  );
}

type AuthPageFrameProps = {
  children: ReactNode;
  className?: string;
};

export function AuthPageFrame({ children, className }: AuthPageFrameProps) {
  return (
    <motion.main className={cn("mx-auto w-full max-w-md text-center", className)} {...pageFrameEnter}>
      {children}
    </motion.main>
  );
}

type AuthCardShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCardShell({ children, className }: AuthCardShellProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <motion.div
        className={cn("rounded-lg border border-border bg-card p-8", className)}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <MovingBorderButton
      as="div"
      borderRadius={authCardMovingBorderRadius}
      duration={movingBorderDuration}
      borderPhases={[...authCardMovingBorderPhases]}
      containerClassName={authCardMovingBorderContainerClassName}
      borderClassName={movingBorderGlowClassName}
      className={cn(authCardMovingBorderInnerClassName, className)}
    >
      <motion.div
        className="p-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    </MovingBorderButton>
  );
}

export function AuthMotionItem({
  className,
  children,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <motion.div className={className} variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
}
