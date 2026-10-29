"use client";

import { useLogoutMutation } from "@/features/auth/services/auth-api";
import { cn } from "@/lib/utils";
import { baseApi } from "@/redux/api/base-api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { authActions } from "@/redux/slices/auth-slice";
import { LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const status = useAppSelector((state) => state.auth.status);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  if (status !== "authenticated") {
    return null;
  }

  const onLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // The cookie may already be gone. Leave the session either way.
    } finally {
      dispatch(authActions.clear());
      dispatch(baseApi.util.resetApiState());
      router.replace("/login");
    }
  };

  return (
    <motion.button
      type="button"
      aria-label="Log out"
      disabled={isLoading}
      onClick={() => {
        void onLogout();
      }}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-full border border-border bg-background/80 shadow-sm backdrop-blur-md transition-colors hover:bg-accent disabled:opacity-50",
        className,
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <LogOut className="size-5 text-foreground" aria-hidden />
    </motion.button>
  );
}
