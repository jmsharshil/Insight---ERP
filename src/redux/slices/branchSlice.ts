import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BranchList {
  id: string;
  name: string;
  city: string;
  created_at: string;
  is_active: boolean;
}

export interface BranchState {
  branchList: BranchList[];
  loading: boolean;
  error: string | null;
}

export const initialState: BranchState = {
  branchList: [],
  loading: false,
  error: null,
};

export const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    setBranchList: (state: any, action: PayloadAction<any>) => {
      state.branchList = action.payload;
    },
    updateBranchInList: (state: any, action: PayloadAction<any>) => {
      const index = state.branchList.findIndex((b: any) => b.id === action.payload.id);
      if (index !== -1) {
        state.branchList[index] = { ...state.branchList[index], ...action.payload };
      }
    },
    deleteBranchFromList: (state: any, action: PayloadAction<string>) => {
      state.branchList = state.branchList.filter((b: any) => b.id !== action.payload);
    },
    addBranchToList: (state: any, action: PayloadAction<any>) => {
      state.branchList.unshift(action.payload);
    },
  },
});

export const { setBranchList, updateBranchInList, deleteBranchFromList, addBranchToList } = branchSlice.actions;

export default branchSlice.reducer
