import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RealStudent {
  id: string;
  admission_number: string;
  full_name: string;
  email: string;
  phone_student: string;
  course: string;
  group_module: string;
  batch_attempt: string;
  branch_name: string;
  batch_name: string;
  status: string;
  status_display: string;
  enrolled_at: string;
  photo_url: string;
  gender_display: string;
  blood_group_display: string;
  emergency_contact_relationship_display: string;
}

export interface StudentDetail extends RealStudent {
  first_name: string;
  surname: string;
  father_name: string;
  mother_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  category: string;
  nationality: string;
  email_parent: string;
  phone_student_2: string;
  phone_father: string;
  phone_father_2: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  qualification: string;
  location: string;
  photo: string;
  doc_signature: string;
  doc_dob_certificate: string;
  doc_id_proof: string;
  doc_tenth_marksheet: string | null;
  doc_twelfth_marksheet: string | null;
  doc_category_cert: string | null;
  doc_graduation_cert: string | null;
  notes: string;
  admission: number;
  user: string;
  batch: string | null;
  branch: { id: string; name: string; city: string };
  current_batch_name: string;
  assigned_counsellor: { id: string; name: string; email: string; phone: string } | null;
  parent_links: any[];
  batch_history: any[];
  inventory_issues: any[];
  id_card: {
    id: string; qr_data: string; qr_image: string; card_image: string;
    is_active: boolean; generated_at: string; regenerated_at: string | null;
  } | null;
  status_history: any[];
  id_card_ready: boolean;
  roll_number: string;
  is_active: boolean;
  qr_blocked: boolean;
  created_at: string;
  updated_at: string;
}

interface StudentState {
  students: RealStudent[];
  loading: boolean;
  error: string | null;
  count: number;
  currentStudent: StudentDetail | null;
  loadingDetail: boolean;
  detailError: string | null;
}

const initialState: StudentState = {
  students: [],
  loading: false,
  error: null,
  count: 0,
  currentStudent: null,
  loadingDetail: false,
  detailError: null,
};

const studentSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    setStudentsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      state.error = null;
    },
    setStudents: (state, action: PayloadAction<{ data: RealStudent[]; count: number }>) => {
      state.students = action.payload.data;
      state.count = action.payload.count;
      state.loading = false;
      state.error = null;
    },
    setStudentsError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setStudentDetailLoading: (state, action: PayloadAction<boolean>) => {
      state.loadingDetail = action.payload;
      state.detailError = null;
    },
    setStudentDetail: (state, action: PayloadAction<StudentDetail>) => {
      state.currentStudent = action.payload;
      state.loadingDetail = false;
      state.detailError = null;
    },
    setStudentDetailError: (state, action: PayloadAction<string>) => {
      state.loadingDetail = false;
      state.detailError = action.payload;
    },
  },
});

export const { 
  setStudentsLoading, setStudents, setStudentsError,
  setStudentDetailLoading, setStudentDetail, setStudentDetailError
} = studentSlice.actions;
export default studentSlice.reducer;
