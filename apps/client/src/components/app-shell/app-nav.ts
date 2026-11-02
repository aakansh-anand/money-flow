import { LayoutDashboard, type LucideIcon } from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const appNavItems: AppNavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
];
