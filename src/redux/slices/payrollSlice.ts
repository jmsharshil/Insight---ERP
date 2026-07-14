import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayrollRun {
  id: string;
  status: "draft" | "pending_approval" | "approved" | "disbursed";
  month: number;
  year: number;
  branch?: string;
  branch_name?: string;
  total_amount: string;
  employee_count: number;
  generated_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string;
}

export interface PaySlip {
  id: string;
  faculty: string | null;
  user_id: string;
  faculty_name: string;
  employee_id: string;
  basic_salary: number;
  hour_based_amount: number;
  late_penalty: number;
  leave_deductions: number;
  absence_deductions?: number;
  retention_deduction?: number;
  bonus: number;
  other_deductions?: number;
  deduction_note?: string;
  net_salary: number;
  sessions_conducted: number;
  is_disbursed: boolean;
  late_logs?: any[];
  employment_type?: string;
  hourly_rate?: number | string;
  session_hours?: number | string;
  total_session_hours?: number | string;
  payroll_month?: string;
  payroll_year?: string;
  payroll_status?: string;
}

export interface LatePolicy {
  id: string;
  branch: string;
  branch_name?: string;
  grace_period_minutes: number;
  deduction_per_minute: number;
  max_deduction_per_session: number;
  auto_halfday_deduction: boolean;
  is_active: boolean;
}

export interface ExtraHour {
  id: string;
  faculty: string;
  faculty_name?: string;
  month: number;
  year: number;
  extra_hours: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface MyPayrollData {
  employee: {
    id: string;
    employee_id: string;
    name: string;
    email: string;
    role: string;
  };
  summary: {
    total_payslips: number;
    total_net_earned: string;
    total_disbursed: string;
  };
  payslips: PaySlip[];
}

export interface SalaryPreview {
  faculty_id: string;
  month: number;
  year: number;
  payslip_preview: {
    basic_salary: number;
    expected_hours_amount: number;
    estimated_net: number;
    late_penalty_estimate: number;
    [key: string]: any;
  };
}

interface PayrollState {
  runs:              PayrollRun[];
  runsLoading:       boolean;

  selectedRun:       PayrollRun | null;
  selectedRunLoading: boolean;

  payslips:          PaySlip[];
  payslipsLoading:   boolean;

  myPayroll:         MyPayrollData | null;
  myPayrollLoading:  boolean;

  preview:           SalaryPreview | null;
  previewLoading:    boolean;

  latePolicies:      LatePolicy[];
  latePoliciesLoading: boolean;

  extraHours:        ExtraHour[];
  extraHoursLoading: boolean;

  error: string | null;
}

const initialState: PayrollState = {
  runs: [],              runsLoading: false,
  selectedRun: null,     selectedRunLoading: false,
  payslips: [],          payslipsLoading: false,
  myPayroll: null,       myPayrollLoading: false,
  preview: null,         previewLoading: false,
  latePolicies: [],      latePoliciesLoading: false,
  extraHours: [],        extraHoursLoading: false,
  error: null,
};

const payrollSlice = createSlice({
  name: "payroll",
  initialState,
  reducers: {
    setRuns(s, a: PayloadAction<PayrollRun[]>)           { s.runs = a.payload; s.error = null; },
    setRunsLoading(s, a: PayloadAction<boolean>)         { s.runsLoading = a.payload; },
    addRun(s, a: PayloadAction<PayrollRun>)              { s.runs.unshift(a.payload); },
    updateRunInList(s, a: PayloadAction<PayrollRun>)     {
      const i = s.runs.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.runs[i] = a.payload;
      if (s.selectedRun?.id === a.payload.id) s.selectedRun = a.payload;
    },
    removeRun(s, a: PayloadAction<string>)               {
      s.runs = s.runs.filter(x => x.id !== a.payload);
      if (s.selectedRun?.id === a.payload) s.selectedRun = null;
    },

    setSelectedRun(s, a: PayloadAction<PayrollRun | null>) { s.selectedRun = a.payload; },
    setSelectedRunLoading(s, a: PayloadAction<boolean>)  { s.selectedRunLoading = a.payload; },

    setPayslips(s, a: PayloadAction<PaySlip[]>)          { s.payslips = a.payload; s.error = null; },
    setPayslipsLoading(s, a: PayloadAction<boolean>)     { s.payslipsLoading = a.payload; },
    updatePayslipInList(s, a: PayloadAction<PaySlip>)    {
      const i = s.payslips.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.payslips[i] = a.payload;
    },

    setMyPayroll(s, a: PayloadAction<MyPayrollData>)     { s.myPayroll = a.payload; s.error = null; },
    setMyPayrollLoading(s, a: PayloadAction<boolean>)    { s.myPayrollLoading = a.payload; },

    setPreview(s, a: PayloadAction<SalaryPreview>)       { s.preview = a.payload; },
    setPreviewLoading(s, a: PayloadAction<boolean>)      { s.previewLoading = a.payload; },

    setLatePolicies(s, a: PayloadAction<LatePolicy[]>)   { s.latePolicies = a.payload; s.error = null; },
    setLatePoliciesLoading(s, a: PayloadAction<boolean>) { s.latePoliciesLoading = a.payload; },
    addLatePolicy(s, a: PayloadAction<LatePolicy>)       { s.latePolicies.push(a.payload); },
    updateLatePolicyInList(s, a: PayloadAction<LatePolicy>) {
      const i = s.latePolicies.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.latePolicies[i] = a.payload;
    },
    removeLatePolicy(s, a: PayloadAction<string>)        { s.latePolicies = s.latePolicies.filter(x => x.id !== a.payload); },

    setExtraHours(s, a: PayloadAction<ExtraHour[]>)      { s.extraHours = a.payload; s.error = null; },
    setExtraHoursLoading(s, a: PayloadAction<boolean>)   { s.extraHoursLoading = a.payload; },
    updateExtraHourInList(s, a: PayloadAction<ExtraHour>) {
      const i = s.extraHours.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.extraHours[i] = a.payload;
    },

    setPayrollError(s, a: PayloadAction<string>)         { s.error = a.payload; },
    clearPayrollError(s)                                 { s.error = null; },
  },
});

export const {
  setRuns, setRunsLoading, addRun, updateRunInList, removeRun,
  setSelectedRun, setSelectedRunLoading,
  setPayslips, setPayslipsLoading, updatePayslipInList,
  setMyPayroll, setMyPayrollLoading,
  setPreview, setPreviewLoading,
  setLatePolicies, setLatePoliciesLoading, addLatePolicy, updateLatePolicyInList, removeLatePolicy,
  setExtraHours, setExtraHoursLoading, updateExtraHourInList,
  setPayrollError, clearPayrollError,
} = payrollSlice.actions;

export default payrollSlice.reducer;
