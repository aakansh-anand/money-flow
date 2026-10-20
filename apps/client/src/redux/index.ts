import { configureStore } from "@reduxjs/toolkit";

import { setupAxiosInterceptors } from "@/redux/axios-interceptor";

import { baseApi } from "./api/base-api";
import authReducer from "./slices/auth-slice";

import "./register-endpoints";

export function makeStore() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  setupAxiosInterceptors(store);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
