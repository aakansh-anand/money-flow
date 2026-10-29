import type { Transition, Variants } from "motion/react";

/** Default product motion easing. */
export const motionEase = {
  standard: [0.32, 0.72, 0, 1] as const,
  shake: [0.36, 0.07, 0.19, 0.97] as const,
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: motionEase.standard },
  },
};

export const formStaggerContainer: Variants = {
  hidden: { opacity: 1, x: 0 },
  show: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
  shake: {
    x: [0, -10, 10, -6, 6, 0],
    transition: { duration: 0.45, ease: motionEase.shake },
  },
};

export const brandMarkEnter = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: motionEase.standard },
} as const;

export const pageFrameEnter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: motionEase.standard, delay: 0.06 },
} as const;

export const formShakeVariant = "shake" as const;

export const tapScale = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 },
} as const;

export const passwordSlashTransition: Transition = {
  duration: 0.22,
  ease: motionEase.standard,
};

/** Aceternity moving border (see `@/components/ui/moving-border`). */
export const movingBorderDuration = 6000;

export const movingBorderGlowClassName =
  "size-20 bg-[radial-gradient(circle,rgb(152_152_152/_0.9)_0%,transparent_52%)]";

/** One glow per phase; 0.5 = opposite side for a dual parallel border. */
export const authCardMovingBorderPhases = [0, 0.5] as const;

export const authCardMovingBorderRadius = "var(--radius-md)";

export const authCardMovingBorderContainerClassName =
  "relative h-auto w-full overflow-hidden bg-transparent p-px text-base";

export const authCardMovingBorderInnerClassName =
  "relative flex w-full min-w-0 flex-col items-stretch justify-start border border-border bg-card text-base text-foreground antialiased backdrop-blur-none";

/** Tailwind classes for simple CSS motion (no keyframes in globals.css). */
export const linkUnderlineReveal =
  "absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none motion-reduce:scale-x-100";
