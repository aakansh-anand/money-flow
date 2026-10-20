"use client";

import { useTheme } from "@/providers/theme-provider";
import { useCallback, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function useThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useIsClient();

  const toggleTheme = useCallback(async () => {
    if (!resolvedTheme) {
      return;
    }

    const isDark = resolvedTheme === "dark";
    const nextTheme = isDark ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    document.documentElement.classList.add("switching-theme");
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    try {
      await transition.finished;
    } finally {
      document.documentElement.classList.remove("switching-theme");
    }
  }, [resolvedTheme, setTheme]);

  return { mounted, resolvedTheme, toggleTheme };
}
