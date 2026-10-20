"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import type { AppStore } from "@/redux";

type ReduxProviderProps = {
  children: React.ReactNode;
};

export function ReduxProvider({ children }: ReduxProviderProps) {
  const [store, setStore] = useState<AppStore | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("@/redux").then(({ makeStore }) => {
      if (cancelled) return;
      setStore(makeStore());
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!store) {
    return children;
  }

  return <Provider store={store}>{children}</Provider>;
}
