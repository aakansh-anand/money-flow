"use client";

import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AuthGuestGuardProps = {
  children: React.ReactNode;
};

/** Login and register are for signed-out users. A live session goes home. */
export function AuthGuestGuard({ children }: AuthGuestGuardProps) {
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  if (status !== "anonymous") {
    return null;
  }

  return children;
}
