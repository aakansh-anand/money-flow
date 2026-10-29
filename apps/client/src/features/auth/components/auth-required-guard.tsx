"use client";

import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AuthRequiredGuardProps = {
  children: React.ReactNode;
};

/** App routes need a confirmed session. Anyone else goes to login. */
export function AuthRequiredGuard({ children }: AuthRequiredGuardProps) {
  const status = useAppSelector((state) => state.auth.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status !== "authenticated") {
    return null;
  }

  return children;
}
