import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { dropdownActions } from "@/redux/actions";
import { setDropdownLoading, setDropdownData, setDropdownError, clearDropdown, DropdownOption } from "@/redux/slices/dropdownSlice";
import { API } from "@/service/api";
import { useToast } from "@/hooks/useToast";

interface UseDropdownResult {
  /** The list of options fetched from the API */
  options: DropdownOption[];
  /** Whether the dropdown data is currently being fetched */
  loading: boolean;
  /** Any error that occurred during the fetch */
  error: string | null;
  /** Fetch the dropdown data. It is memoized. */
  fetchOptions: (params?: Record<string, string>) => void;
  /** Clear the dropdown data from the store */
  clearOptions: () => void;
}

/**
 * A custom hook to easily fetch and manage dropdown data.
 * @param key - The unique identifier for the dropdown (e.g. "roles", "branches"). This dictates where it's saved in the Redux store.
 * @param isAuth - Whether the dropdown endpoint requires authentication. If true, hits `/api/v1/dropdowns/auth/`, else `/api/v1/dropdowns/public/`. Defaults to false.
 * @returns An object containing the dropdown data, loading state, error, and functions to fetch or clear the data.
 */
export const useDropdown = (key: string, isAuth: boolean = false): UseDropdownResult => {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const dropdownState = useSelector((state: RootState) => state.dropdowns[key]);

  const options = dropdownState?.data || [];
  const loading = dropdownState?.loading || false;
  const error = dropdownState?.error || null;

  const fetchOptions = useCallback((params?: Record<string, string>) => {
    const endPoint = isAuth ? API.DROPDOWNS.AUTH(params) : API.DROPDOWNS.PUBLIC(params);

    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint,
      auth: isAuth,
      setLoading: (val: boolean) => dispatch(setDropdownLoading({ key, loading: val })),
      getResponse: (res: any) => {
        let rawData: any[] = [];
        
        if (Array.isArray(res?.data)) {
          rawData = res.data;
        } else if (res?.data && typeof res.data === 'object' && Array.isArray(res.data[key])) {
          rawData = res.data[key];
        } else if (res?.data && typeof res.data === 'object' && Array.isArray(res.data.data)) {
          rawData = res.data.data;
        } else if (Array.isArray(res?.results)) {
          rawData = res.results;
        } else if (Array.isArray(res)) {
          rawData = res;
        }

        // Normalize { id, name } to { value, label } if necessary
        const data = rawData.map((item) => {
          if (item.value !== undefined && item.label !== undefined) return item;
          if (item.id !== undefined && item.name !== undefined) {
            return { ...item, value: String(item.id), label: item.name };
          }
          return item;
        });

        dispatch(setDropdownData({ key, data }));
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || `Failed to fetch ${key} dropdown`;
        dispatch(setDropdownError({ key, error: msg }));
        toast.error(msg);
      },
    });
  }, [dispatch, key, isAuth, toast]);

  const clearOptions = useCallback(() => {
    dispatch(clearDropdown(key));
  }, [dispatch, key]);

  return {
    options,
    loading,
    error,
    fetchOptions,
    clearOptions,
  };
};
