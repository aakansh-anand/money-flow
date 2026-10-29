import { createSlice } from "@reduxjs/toolkit";

/** `unknown` until GET /auth/me finishes (after cookies / refresh). */
export type AuthStatus = "unknown" | "authenticated" | "anonymous";

export type AuthState = {
  status: AuthStatus;
};

const initialState: AuthState = {
  status: "unknown",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated(state) {
      state.status = "authenticated";
    },
    clear(state) {
      state.status = "anonymous";
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
