import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/redux/slices/authSlice";
import {
  selectUser, selectIsAuthenticated, selectIsLoading, selectAuthError,
} from "@/store/selectors/authSelectors";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  return {
    user: useAppSelector(selectUser),
    isAuthenticated: useAppSelector(selectIsAuthenticated),
    isLoading: useAppSelector(selectIsLoading),
    error: useAppSelector(selectAuthError),
    logout: () => dispatch(clearAuth()),
  };
};
