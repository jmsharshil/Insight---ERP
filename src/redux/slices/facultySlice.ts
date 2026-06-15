import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FacultyRecord {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string | null;
  branch: string;
  branch_name: string;
  level: string;
  level_display: string;
  employment_type: string;
  employment_type_display: string;
  specialization: string;
  subject_expertise: string;
  joining_date: string;
  is_active: boolean;
  batch_count: number;
  created_at: string;
  // Detail-only fields (from GET /api/v1/faculty/{id}/)
  qualification?: string;
  salary?: string;
  hourly_rate?: string;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
  qr_code?: string | null;
  qr_code_url?: string | null;
}

interface FacultyState {
  facultyList: FacultyRecord[];
  loading: boolean;
  error: string | null;
  selectedFaculty: FacultyRecord | null;
  selectedFacultyLoading: boolean;
}

const initialState: FacultyState = {
  facultyList: [],
  loading: false,
  error: null,
  selectedFaculty: null,
  selectedFacultyLoading: false,
};

const facultySlice = createSlice({
  name: "faculty",
  initialState,
  reducers: {
    setFaculty(state, action: PayloadAction<FacultyRecord[]>) {
      state.facultyList = action.payload;
      state.error = null;
    },
    setFacultyLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setFacultyError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSelectedFaculty(state, action: PayloadAction<FacultyRecord | null>) {
      state.selectedFaculty = action.payload;
    },
    setSelectedFacultyLoading(state, action: PayloadAction<boolean>) {
      state.selectedFacultyLoading = action.payload;
    },
    updateFacultyInList(state, action: PayloadAction<Partial<FacultyRecord> & { id: string }>) {
      const idx = state.facultyList.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) {
        state.facultyList[idx] = { ...state.facultyList[idx], ...action.payload };
      }
      if (state.selectedFaculty?.id === action.payload.id) {
        state.selectedFaculty = { ...state.selectedFaculty, ...action.payload };
      }
    },
  },
});

export const {
  setFaculty,
  setFacultyLoading,
  setFacultyError,
  setSelectedFaculty,
  setSelectedFacultyLoading,
  updateFacultyInList,
} = facultySlice.actions;

export default facultySlice.reducer;
