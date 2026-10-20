"use client";

import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import type { CSSProperties } from "react";

import { useThemeToggle } from "@/hooks/use-theme-toggle";
import { cn } from "@/lib/utils";

type ModeToggleProps = {
  className?: string;
};

export function ModeToggle({ className }: ModeToggleProps) {
  const { mounted, resolvedTheme, toggleTheme } = useThemeToggle();

  if (!mounted) {
    return (
      <div
        className={cn(
          "relative size-10 rounded-full border border-border bg-background/50 backdrop-blur-md",
          className,
        )}
      />
    );
  }

  return (
    <motion.button
      type="button"
      data-theme-toggle=""
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        void toggleTheme();
      }}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-full border border-border bg-background/80 shadow-sm backdrop-blur-md transition-colors hover:bg-accent",
        className,
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span
        className="relative flex size-5 items-center justify-center"
        style={{ viewTransitionName: "mode-toggle" } as CSSProperties}
      >
        <AnimatePresence mode="wait" initial={false}>
          {resolvedTheme === "dark" ? (
            <motion.span
              key="moon"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <Moon className="size-5 text-foreground" aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <Sun className="size-5 text-foreground" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
