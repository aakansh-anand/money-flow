"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useGetProfileQuery } from "@/features/profile/services/profile-api";
import { UserRound } from "lucide-react";
import { initialsFromName } from "@/features/auth/hooks/use-current-user";

export function ProfileDetails() {
  const { data, isLoading, isError } = useGetProfileQuery();

  if (isLoading) {
    return (
      <section className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center justify-between">
          <dl className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-52" />
            </div>
          </dl>
          <Skeleton className="size-16 shrink-0 rounded-full" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">{"Couldn't"} load your profile.</p>;
  }

  const initials = initialsFromName(data.name);

  return (
    <section className="flex flex-col">
      <div className="flex justify-between items-center">
        <dl className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="text-base font-medium">{data.name}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="text-base font-medium">{data.email}</dd>
          </div>
        </dl>
        <span
          className="flex border-3 size-16 items-center justify-center rounded-full bg-primary text-lg font-medium text-white dark:text-neutral-900"
          aria-hidden={initials.length > 0}
        >
          {initials || <UserRound className="size-7" />}
        </span>
      </div>
      <div className=""></div>
    </section>
  );
}
