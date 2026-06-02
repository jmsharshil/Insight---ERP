import type { RootState } from "../index";

export const selectUser = (state: RootState) => state.apiAuth.user;
export const selectIsAuthenticated = (state: RootState) => !!state.apiAuth.accessToken;
export const selectIsLoading = (state: RootState) => state.apiAuth.loading;
export const selectAuthError = (state: RootState) => state.apiAuth.error;
