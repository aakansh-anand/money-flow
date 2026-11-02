"use client";

import { usePathname } from "next/navigation";

import { appNavItems } from "@/components/app-shell/app-nav";

export function useAppNav() {
  const pathname = usePathname();

  return {
    pathname,
    items: appNavItems,
  };
}
