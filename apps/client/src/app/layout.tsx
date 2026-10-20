import type { Metadata } from "next";
import { Figtree, Merriweather } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ReduxProvider } from "@/providers/redux-provider";
import { ThemeShell } from "@/theme/theme-shell";
import { cn } from "@/lib/utils";
import { themeBlockingScript } from "@/lib/theme-blocking-script";

const merriweatherHeading = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Kosh - Manage Finance",
  description:
    "Kosh helps you effortlessly track expenses, set budgets, and gain insights into your personal or business finances with a simple, intuitive interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        figtree.variable,
        merriweatherHeading.variable
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBlockingScript }} />
      </head>
      <body className="min-h-full">
        <Suspense fallback={<ThemeShell>{children}</ThemeShell>}>
          <ReduxProvider>
            <ThemeShell>{children}</ThemeShell>
          </ReduxProvider>
        </Suspense>
      </body>
    </html>
  );
}
