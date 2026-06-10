import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimetableSlot, Day } from "@/constants/dummy/timetable";

interface TimetableState {
  slots: TimetableSlot[];
  loading: boolean;
}

const initialState: TimetableState = {
  slots: [],
  loading: false,
};

export const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    setSlots: (state, action: PayloadAction<TimetableSlot[]>) => {
      state.slots = action.payload;
    },
    addSlot: (state, action: PayloadAction<TimetableSlot>) => {
      state.slots.push(action.payload);
    },
    updateSlot: (state, action: PayloadAction<TimetableSlot>) => {
      const index = state.slots.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.slots[index] = action.payload;
      }
    },
    deleteSlot: (state, action: PayloadAction<string>) => {
      state.slots = state.slots.filter((s) => s.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setSlots, addSlot, updateSlot, deleteSlot, setLoading } = timetableSlice.actions;

export default timetableSlice.reducer;
