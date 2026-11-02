"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionEase } from "@/utils/animations";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

const ctaSpring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.85 };

const ctaButtonVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: motionEase.standard, delay: 0.08 },
  },
  hover: { scale: 1.025, transition: ctaSpring },
  tap: { scale: 0.985, transition: { ...ctaSpring, stiffness: 520 } },
};

const ctaArrowVariants: Variants = {
  visible: { x: 0, opacity: 1 },
  hover: { x: 6, transition: ctaSpring },
  tap: { x: 3, transition: ctaSpring },
};

const ctaShineVariants: Variants = {
  visible: { x: "-120%" },
  hover: {
    x: "120%",
    transition: { duration: 0.7, ease: motionEase.standard },
  },
};

type OnboardingCtaButtonProps = {
  href: string;
  children: ReactNode;
};

const ctaSurfaceClass = cn(
  buttonVariants({ size: "lg" }),
  "relative inline-flex h-auto min-h-12 min-w-56 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl px-8 py-3.5 text-base font-semibold tracking-tight",
  "shadow-[0_1px_2px_oklch(0_0_0/0.06),0_8px_24px_-6px_oklch(0_0_0/0.18)] ring-1 ring-primary-foreground/15",
  "transition-[box-shadow,ring-color] hover:shadow-[0_2px_4px_oklch(0_0_0/0.08),0_12px_32px_-8px_oklch(0_0_0/0.22)] hover:ring-primary-foreground/25",
);

function CtaArrowBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 p-1.5",
        className,
      )}
      aria-hidden
    >
      <ArrowRight className="size-4" />
    </span>
  );
}

export function OnboardingCtaButton({ href, children }: OnboardingCtaButtonProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <Link href={href} className={cn(ctaSurfaceClass, "group/cta")}>
        <span>{children}</span>
        <CtaArrowBadge className="transition-transform group-hover/cta:translate-x-0.5" />
      </Link>
    );
  }

  return (
    <Link href={href} className="inline-block">
      <motion.span
        className={ctaSurfaceClass}
        variants={ctaButtonVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-linear-to-r from-transparent via-primary-foreground/25 to-transparent"
          variants={ctaShineVariants}
        />
        <span className="relative z-10">{children}</span>
        <motion.span className="relative z-10" variants={ctaArrowVariants}>
          <CtaArrowBadge />
        </motion.span>
      </motion.span>
    </Link>
  );
}
