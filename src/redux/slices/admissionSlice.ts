import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AdmissionRecord {
  id: number;
  branch: { id: string; name: string; city: string };
  first_name: string;
  surname: string;
  email: string;
  phone_student: string;
  course: string;
  batch_attempt: string;
  status: string;
  status_display: string;
  location: string;
  city?: string;
  reference_name?: string;
  reference_display?: string;
  assigned_counsellor: { id: string; name: string; email: string; phone: string } | null;
  note: string;
  submitted_at: string;
  payment_type?: "token" | "full_payment" | "finance" | string;
  payment_mode?: "cash" | "cheque" | "online" | string;
  cheque_no?: string;
  attempt_year?: string | number;
  remaining_fees?: string | number | null;
  token_payment_terms_note?: string | null;
  fee_structure?: number | string | any;
}

export interface AdmissionDetail extends AdmissionRecord {
  father_name: string;
  mother_name: string;
  dob: string;
  category: string;
  email_parent: string;
  phone_student_2: string;
  phone_father: string;
  phone_father_2: string;
  street: string;
  apartment: string;
  state: string;
  pincode: string;
  country: string;
  group_module: string;
  qualification: string;
  reference: string;
  consent: boolean;
  tenth_medium: string;
  tenth_school: string;
  tenth_coaching: string;
  tenth_percentage: string;
  tenth_percentile: string;
  twelfth_medium: string;
  twelfth_school: string;
  twelfth_coaching: string;
  twelfth_percentage: string;
  twelfth_percentile: string;
  grad_university: string;
  grad_college: string;
  grad_last_sem: string;
  doc_signature: string | null;
  doc_photo: string | null;
  doc_dob_certificate: string | null;
  doc_id_card: string | null;
  doc_twelfth_receipt: string | null;
  doc_twelfth_marksheet: string | null;
  doc_category_cert: string | null;
  updated_at: string;
  assigned_bank_id: number;
  payment_screenshot: string | null;
  transaction_id: string;
  payment_amount: string;
  payment_note: string;
  payment_submitted_at: string | null;
  lead: number;
  fee_structure_detail?: any;
  icsi_fees_payment?: string;
  razorpay_payment_link?: string | null;
  razorpay_payment_id?: string | null;
}

interface AdmissionState {
  admissions: AdmissionRecord[];
  selectedAdmission: AdmissionDetail | null;
  selectedAdmissionLoading: boolean;
  loading: boolean;
  error: string | null;
  count: number;
}

const initialState: AdmissionState = {
  admissions: [],
  selectedAdmission: null,
  selectedAdmissionLoading: false,
  loading: false,
  error: null,
  count: 0,
};

const admissionSlice = createSlice({
  name: "admissions",
  initialState,
  reducers: {
    setAdmissions(
      state,
      action: PayloadAction<AdmissionRecord[] | { data: AdmissionRecord[]; count?: number }>
    ) {
      if (Array.isArray(action.payload)) {
        state.admissions = action.payload;
        state.count = action.payload.length;
      } else {
        state.admissions = action.payload.data;
        state.count = action.payload.count ?? action.payload.data.length;
      }
      state.loading = false;
      state.error = null;
    },
    setAdmissionsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAdmissionsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
      state.selectedAdmissionLoading = false;
    },
    setSelectedAdmission(state, action: PayloadAction<AdmissionDetail | null>) {
      state.selectedAdmission = action.payload;
      state.error = null;
    },
    setSelectedAdmissionLoading(state, action: PayloadAction<boolean>) {
      state.selectedAdmissionLoading = action.payload;
    },
  },
});

export const {
  setAdmissions,
  setAdmissionsLoading,
  setAdmissionsError,
  setSelectedAdmission,
  setSelectedAdmissionLoading,
} = admissionSlice.actions;
export default admissionSlice.reducer;
