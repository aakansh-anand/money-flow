"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { ModeToggle } from "@/theme/mode-toggle";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/register"];

type ThemeShellProps = {
  children: React.ReactNode;
};

export function ThemeShell({ children }: ThemeShellProps) {
  const pathname = usePathname();
  const showFloatingToggle = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return (
    <ThemeProvider defaultTheme="system" disableTransitionOnChange>
      {showFloatingToggle ? (
        <div className="fixed top-4 right-4 z-50">
          <ModeToggle />
        </div>
      ) : null}
      {children}
      <Toaster richColors closeButton position="top-center" />
    </ThemeProvider>
  );
}
