import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FeesStructure {
  id: string;
  name: string;
  course: string;
  course_name: string;
  batch: string;
  batch_name: string;
  total_amount: string;
  is_active: boolean;
  created_at: string;
}

const initialState = {
  feeStructure: [] as FeesStructure[],
  loading: false,
  error: null,
};

export const feesSlice = createSlice({
  name: "fees",
  initialState,
  reducers: {
    setFeeStructure: (state, action: PayloadAction<FeesStructure[]>) => {
      state.feeStructure = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<Error | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setFeeStructure, setLoading, setError } = feesSlice.actions;
export const feesReducer = feesSlice.reducer;
