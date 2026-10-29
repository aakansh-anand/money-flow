"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { ModeToggle } from "@/theme/mode-toggle";

type ThemeShellProps = {
  children: React.ReactNode;
  /** Extra controls beside the theme toggle. Omit outside the Redux provider. */
  controls?: React.ReactNode;
};

export function ThemeShell({ children, controls }: ThemeShellProps) {
  return (
    <ThemeProvider defaultTheme="system" disableTransitionOnChange>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {controls}
        <ModeToggle />
      </div>
      {children}
      <Toaster richColors closeButton position="top-center" />
    </ThemeProvider>
  );
}
