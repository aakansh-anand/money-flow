"use client";

import { ThemeProvider } from "@/providers/theme-provider";
import { ModeToggle } from "@/theme/mode-toggle";

type ThemeShellProps = {
  children: React.ReactNode;
};

export function ThemeShell({ children }: ThemeShellProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>
      {children}
    </ThemeProvider>
  );
}
