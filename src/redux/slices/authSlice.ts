import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthUser } from "@/types/api.auth.types";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

const apiAuthSlice = createSlice({
  name: "apiAuth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("Insight_Login_Data");
    },
  },
});

export const { setCredentials, setAuthLoading, clearAuth } =
  apiAuthSlice.actions;
export default apiAuthSlice.reducer;
