"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/theme/mode-toggle";

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-card/90 px-3 backdrop-blur-md">
      <SidebarTrigger />
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </header>
  );
}
