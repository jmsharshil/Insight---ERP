import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ──────────────────────────────────────────────────── */

export interface DropdownOption {
  value: string | number;
  label: string;
  [key: string]: unknown; // allow extra fields from the API
}

interface DropdownEntry {
  data: DropdownOption[];
  loading: boolean;
  error: string | null;
}

interface DropdownState {
  /** Keyed by dropdown name, e.g. "roles", "branches", "countries" */
  [key: string]: DropdownEntry;
}

const initialState: DropdownState = {};

/* ─── Default entry ──────────────────────────────────────────── */

const defaultEntry: DropdownEntry = { data: [], loading: false, error: null };

/* ─── Slice ──────────────────────────────────────────────────── */

const dropdownSlice = createSlice({
  name: "dropdowns",
  initialState,
  reducers: {
    setDropdownLoading(state, action: PayloadAction<{ key: string; loading: boolean }>) {
      const { key, loading } = action.payload;
      if (!state[key]) state[key] = { ...defaultEntry };
      state[key].loading = loading;
    },
    setDropdownData(state, action: PayloadAction<{ key: string; data: DropdownOption[] }>) {
      const { key, data } = action.payload;
      if (!state[key]) state[key] = { ...defaultEntry };
      state[key].data = data;
      state[key].loading = false;
      state[key].error = null;
    },
    setDropdownError(state, action: PayloadAction<{ key: string; error: string }>) {
      const { key, error } = action.payload;
      if (!state[key]) state[key] = { ...defaultEntry };
      state[key].error = error;
      state[key].loading = false;
    },
    clearDropdown(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
    clearAllDropdowns() {
      return {};
    },
  },
});

export const {
  setDropdownLoading,
  setDropdownData,
  setDropdownError,
  clearDropdown,
  clearAllDropdowns,
} = dropdownSlice.actions;

export default dropdownSlice.reducer;
