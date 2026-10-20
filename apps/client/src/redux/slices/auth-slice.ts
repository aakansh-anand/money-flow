import type { AuthTokens } from "@kosh/shared";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthState = {
  accessToken: string | null;
  /** Seconds until access token expiry (from last token response). */
  expiresIn: number | null;
};

const initialState: AuthState = {
  accessToken: null,
  expiresIn: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.accessToken = action.payload.accessToken;
      state.expiresIn = action.payload.expiresIn;
    },
    clear(state) {
      state.accessToken = null;
      state.expiresIn = null;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
