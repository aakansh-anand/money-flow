import { Geist_Mono, Figtree, Merriweather } from "next/font/google"

import "./globals.css"
import { AppProviders } from "@/components/app-providers"
import { cn } from "@/lib/utils";

const merriweatherHeading = Merriweather({ subsets: ["latin"], variable: "--font-heading" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Kosh",
  description: "Personal finance tracker",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable,
        merriweatherHeading.variable,
      )}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
