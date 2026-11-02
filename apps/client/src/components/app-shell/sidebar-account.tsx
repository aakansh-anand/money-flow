"use client";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { initialsFromName } from "@/features/auth/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRound } from "lucide-react";
import Link from "next/link";

export function SidebarAccount() {
  const { user, isLoading } = useCurrentUser();
  const initials = initialsFromName(user?.name ?? "");

  return (
    <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
      {isLoading ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ) : (
        <Link
          href="/profile"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          title={user ? `${user.name} · ${user.email}` : undefined}
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-md font-semibold text-primary"
            aria-hidden={initials.length > 0}
          >
            {initials || <UserRound className="size-4" />}
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              {user?.name ?? "Account"}
            </span>
            {user?.email ? (
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            ) : null}
          </span>
          <span className="sr-only">{user ? `${user.name}, ${user.email}` : "Account"}</span>
        </Link>
      )}
      <LogoutButton className="size-9 shrink-0 shadow-none" />
    </div>
  );
}
