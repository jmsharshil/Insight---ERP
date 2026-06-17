import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FeesStructure {
  id: string;
  name: string;
  course: string;
  course_name: string;
  batch: string;
  batch_name: string;
  total_amount: string | number;
  is_active: boolean;
  created_at: string;
  description?: string;
}

export interface StudentFee {
  id: string;
  student: string;
  student_name?: string;
  fee_structure: string;
  fee_name?: string;
  total_amount: string | number;
  discount: string | number;
  discount_reason?: string;
  amount_paid: string | number;
  amount_due: string | number;
  status: "unpaid" | "partially_paid" | "paid";
  due_date: string;
  created_at: string;
}

interface FeesState {
  feeStructure: FeesStructure[];
  studentFees: StudentFee[];
  loading: boolean;
  error: any;
}

const initialState: FeesState = {
  feeStructure: [],
  studentFees: [],
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
    addFeeStructure: (state, action: PayloadAction<FeesStructure>) => {
      state.feeStructure = [action.payload, ...state.feeStructure];
    },
    updateFeeStructure: (state, action: PayloadAction<FeesStructure>) => {
      state.feeStructure = state.feeStructure.map((fs) =>
        fs.id === action.payload.id ? action.payload : fs
      );
    },
    deleteFeeStructure: (state, action: PayloadAction<string>) => {
      state.feeStructure = state.feeStructure.filter((fs) => fs.id !== action.payload);
    },
    setStudentFees: (state, action: PayloadAction<StudentFee[]>) => {
      state.studentFees = action.payload;
    },
    addStudentFee: (state, action: PayloadAction<StudentFee>) => {
      state.studentFees = [action.payload, ...state.studentFees];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<Error | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setFeeStructure,
  addFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  setStudentFees,
  addStudentFee,
  setLoading,
  setError,
} = feesSlice.actions;
export const feesReducer = feesSlice.reducer;

