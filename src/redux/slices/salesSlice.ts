import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SalesDailyPlan, OdometerReading } from "@/types/salesActivity";

interface SalesState {
  plans: SalesDailyPlan[];
  odometerReadings: OdometerReading[];
  loading: boolean;
  error: string | null;
}

const initialState: SalesState = {
  plans: [],
  odometerReadings: [],
  loading: false,
  error: null,
};

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setPlans(state, action: PayloadAction<SalesDailyPlan[]>) {
      state.plans = action.payload;
      state.error = null;
    },
    setOdometerReadings(state, action: PayloadAction<OdometerReading[]>) {
      state.odometerReadings = action.payload;
    },
    setSalesLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSalesError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setPlans,
  setOdometerReadings,
  setSalesLoading,
  setSalesError
} = salesSlice.actions;

export default salesSlice.reducer;
