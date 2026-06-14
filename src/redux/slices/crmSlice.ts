import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ──────────────────────────────────────────────────── */

export interface BySourceItem {
  source: string;
  count: number;
}

export interface ByCounsellorItem {
  counsellor: string;
  count: number;
}

export interface DailyTrendItem {
  date: string;
  count: number;
}

export interface CRMAnalytics {
  total_leads: number;
  new: number;
  contacted: number;
  interested: number;
  converted: number;
  follow_up: number;
  lost: number;
  conversion_rate: number;
  avg_conversion_days: number;
  by_source: BySourceItem[];
  by_counsellor: ByCounsellorItem[];
  daily_trend: DailyTrendItem[];
}

export interface APILead {
  id: number;
  branch: string;
  branch_name: string;
  form_type: string;
  form_type_display: string;
  first_name: string;
  surname: string;
  father_name?: string;
  email: string | null;
  phone_student: string;
  phone_father?: string;
  course: string;
  group_module?: string;
  batch_attempt?: string;
  current_stage: string;
  location: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  country?: string;
  note: string;
  consent?: boolean;
  qualification?: string;
  reference?: string;
  inquiry_date?: string | null;
  tenth_medium?: string;
  tenth_school?: string;
  tenth_coaching?: string;
  tenth_percentage?: number | null;
  tenth_percentile?: number | null;
  twelfth_medium?: string;
  twelfth_school?: string;
  twelfth_coaching?: string;
  twelfth_percentage?: number | null;
  twelfth_percentile?: number | null;
  grad_university?: string;
  grad_college?: string;
  grad_last_sem?: string;
  created_at: string;
  updated_at?: string;
  followup_date?:string;
  visit_date?:string;
  reference_display?:string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  assigned_by?: string | null;
  
}

interface CRMState {
  analytics: CRMAnalytics | null;
  leads: APILead[];
  leadsLoading: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: CRMState = {
  analytics: null,
  leads: [],
  leadsLoading: false,
  loading: false,
  error: null,
};

/* ─── Slice ──────────────────────────────────────────────────── */

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {
    setCRMAnalytics(state, action: PayloadAction<CRMAnalytics>) {
      state.analytics = action.payload;
      state.error = null;
    },
    setCRMLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setCRMError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    setLeads(state, action: PayloadAction<APILead[]>) {
      state.leads = action.payload;
    },
    setLeadsLoading(state, action: PayloadAction<boolean>) {
      state.leadsLoading = action.payload;
    },
  },
});

export const {
  setCRMAnalytics,
  setCRMLoading,
  setCRMError,
  setLeads,
  setLeadsLoading,
} = crmSlice.actions;
export default crmSlice.reducer;
