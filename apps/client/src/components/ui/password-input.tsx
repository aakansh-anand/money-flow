"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import { motion } from "motion/react";
import * as React from "react";
import { useState } from "react";

import { passwordSlashTransition } from "@/utils/animations";

function PasswordVisibilityIcon({ hidden }: { hidden: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
      <motion.path
        d="M5 5 L19 19"
        initial={false}
        animate={{
          pathLength: hidden ? 1 : 0,
          opacity: hidden ? 1 : 0,
        }}
        transition={passwordSlashTransition}
      />
    </motion.svg>
  );
}

function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute inset-y-0 right-1 my-auto size-8 translate-y-0 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((show) => !show)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <PasswordVisibilityIcon hidden={!visible} />
      </Button>
    </div>
  );
}

export { PasswordInput };
