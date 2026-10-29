"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import { restoreSession } from "@/features/auth/services/auth-api";
import { makeStore, type AppStore } from "@/redux";

type ReduxProviderProps = {
  children: React.ReactNode;
};

export function ReduxProvider({ children }: ReduxProviderProps) {
  const [store] = useState<AppStore>(() => makeStore());

  useEffect(() => {
    restoreSession(store.dispatch);
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
