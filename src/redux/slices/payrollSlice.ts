import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayrollRun {
  id: string;
  status: "draft" | "pending_approval" | "approved" | "disbursed";
  month: number;
  year: number;
  branch?: string;
  branch_name?: string;
  total_amount: string | number;
  employee_count: number;
  generated_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string;
}

export interface PaySlip {
  id: string;

  // Employee / Faculty
  faculty: string | null;
  user_id: string;
  faculty_name: string;
  employee_id: string;
  employment_type?: string;

  // Salary
  basic_salary: number | string;
  salary?: number | string;
  hourly_rate?: number | string;
  per_paper_rate?: number | string;

  // Hours / Sessions
  hour_based_amount: number | string;
  session_hours?: number | string;
  total_session_hours?: number | string;
  sessions_conducted: number;
  visiting_count?: number;

  // Deductions
  late_penalty: number | string;
  late_penalty_minutes?: number | string;
  leave_deductions: number | string;
  absence_deductions?: number | string;
  retention_deduction?: number | string;
  other_deductions?: number | string;

  deduction_note?: string;
  per_day_deduction_log?: any[];
  late_logs?: any[];

  // Bonuses / Allowances
  bonus: number | string;
  extra_shift_allowance?: number | string;
  attendance_bonus?: number | string;
  leave_encashment?: number | string;

  // Reimbursements
  reimbursements_amount?: number | string;
  reimbursement_note?: string;
  reimbursement_notes?: any[];

  // Odometer / Travel
  odometer_amount?: number | string;
  odometer_notes?: any[];

  // Final Salary
  net_salary: number | string;
  is_disbursed: boolean;

  // Attendance
  working_days?: number;
  leaves_taken?: number;

  // Payroll Details
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
    total_net_earned: string | number;
    total_disbursed: string | number;
  };

  payslips: PaySlip[];
}

export interface SalaryPreview {
  faculty_id: string;
  month: number;
  year: number;

  payslip_preview: {
    basic_salary: number | string;
    expected_hours_amount: number | string;
    estimated_net: number | string;
    late_penalty_estimate: number | string;
    [key: string]: any;
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface PayrollState {
  runs: PayrollRun[];
  runsLoading: boolean;

  selectedRun: PayrollRun | null;
  selectedRunLoading: boolean;

  payslips: PaySlip[];
  payslipsLoading: boolean;

  myPayroll: MyPayrollData | null;
  myPayrollLoading: boolean;

  preview: SalaryPreview | null;
  previewLoading: boolean;

  latePolicies: LatePolicy[];
  latePoliciesLoading: boolean;

  extraHours: ExtraHour[];
  extraHoursLoading: boolean;

  error: string | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: PayrollState = {
  runs: [],
  runsLoading: false,

  selectedRun: null,
  selectedRunLoading: false,

  payslips: [],
  payslipsLoading: false,

  myPayroll: null,
  myPayrollLoading: false,

  preview: null,
  previewLoading: false,

  latePolicies: [],
  latePoliciesLoading: false,

  extraHours: [],
  extraHoursLoading: false,

  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const payrollSlice = createSlice({
  name: "payroll",
  initialState,

  reducers: {
    // ─── Payroll Runs ────────────────────────────────────────────────────────

    setRuns(state, action: PayloadAction<PayrollRun[]>) {
      state.runs = action.payload;
      state.error = null;
    },

    setRunsLoading(state, action: PayloadAction<boolean>) {
      state.runsLoading = action.payload;
    },

    addRun(state, action: PayloadAction<PayrollRun>) {
      state.runs.unshift(action.payload);
    },

    updateRunInList(state, action: PayloadAction<PayrollRun>) {
      const index = state.runs.findIndex(
        (run) => run.id === action.payload.id
      );

      if (index !== -1) {
        state.runs[index] = action.payload;
      }

      if (state.selectedRun?.id === action.payload.id) {
        state.selectedRun = action.payload;
      }
    },

    removeRun(state, action: PayloadAction<string>) {
      state.runs = state.runs.filter(
        (run) => run.id !== action.payload
      );

      if (state.selectedRun?.id === action.payload) {
        state.selectedRun = null;
      }
    },

    // ─── Selected Payroll Run ────────────────────────────────────────────────

    setSelectedRun(
      state,
      action: PayloadAction<PayrollRun | null>
    ) {
      state.selectedRun = action.payload;
    },

    setSelectedRunLoading(
      state,
      action: PayloadAction<boolean>
    ) {
      state.selectedRunLoading = action.payload;
    },

    // ─── Payslips ────────────────────────────────────────────────────────────

    setPayslips(state, action: PayloadAction<PaySlip[]>) {
      state.payslips = action.payload;
      state.error = null;
    },

    setPayslipsLoading(
      state,
      action: PayloadAction<boolean>
    ) {
      state.payslipsLoading = action.payload;
    },

    updatePayslipInList(
      state,
      action: PayloadAction<PaySlip>
    ) {
      const index = state.payslips.findIndex(
        (payslip) => payslip.id === action.payload.id
      );

      if (index !== -1) {
        state.payslips[index] = action.payload;
      }
    },

    // ─── My Payroll ──────────────────────────────────────────────────────────

    setMyPayroll(
      state,
      action: PayloadAction<MyPayrollData>
    ) {
      state.myPayroll = action.payload;
      state.error = null;
    },

    setMyPayrollLoading(
      state,
      action: PayloadAction<boolean>
    ) {
      state.myPayrollLoading = action.payload;
    },

    // ─── Salary Preview ──────────────────────────────────────────────────────

    setPreview(
      state,
      action: PayloadAction<SalaryPreview>
    ) {
      state.preview = action.payload;
    },

    setPreviewLoading(
      state,
      action: PayloadAction<boolean>
    ) {
      state.previewLoading = action.payload;
    },

    // ─── Late Policies ───────────────────────────────────────────────────────

    setLatePolicies(
      state,
      action: PayloadAction<LatePolicy[]>
    ) {
      state.latePolicies = action.payload;
      state.error = null;
    },

    setLatePoliciesLoading(
      state,
      action: PayloadAction<boolean>
    ) {
      state.latePoliciesLoading = action.payload;
    },

    addLatePolicy(
      state,
      action: PayloadAction<LatePolicy>
    ) {
      state.latePolicies.push(action.payload);
    },

    updateLatePolicyInList(
      state,
      action: PayloadAction<LatePolicy>
    ) {
      const index = state.latePolicies.findIndex(
        (policy) => policy.id === action.payload.id
      );

      if (index !== -1) {
        state.latePolicies[index] = action.payload;
      }
    },

    removeLatePolicy(
      state,
      action: PayloadAction<string>
    ) {
      state.latePolicies = state.latePolicies.filter(
        (policy) => policy.id !== action.payload
      );
    },

    // ─── Extra Hours ─────────────────────────────────────────────────────────

    setExtraHours(
      state,
      action: PayloadAction<ExtraHour[]>
    ) {
      state.extraHours = action.payload;
      state.error = null;
    },

    setExtraHoursLoading(
      state,
      action: PayloadAction<boolean>
    ) {
      state.extraHoursLoading = action.payload;
    },

    updateExtraHourInList(
      state,
      action: PayloadAction<ExtraHour>
    ) {
      const index = state.extraHours.findIndex(
        (extraHour) => extraHour.id === action.payload.id
      );

      if (index !== -1) {
        state.extraHours[index] = action.payload;
      }
    },

    // ─── Error ───────────────────────────────────────────────────────────────

    setPayrollError(
      state,
      action: PayloadAction<string>
    ) {
      state.error = action.payload;
    },

    clearPayrollError(state) {
      state.error = null;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export const {
  // Runs
  setRuns,
  setRunsLoading,
  addRun,
  updateRunInList,
  removeRun,

  // Selected Run
  setSelectedRun,
  setSelectedRunLoading,

  // Payslips
  setPayslips,
  setPayslipsLoading,
  updatePayslipInList,

  // My Payroll
  setMyPayroll,
  setMyPayrollLoading,

  // Preview
  setPreview,
  setPreviewLoading,

  // Late Policies
  setLatePolicies,
  setLatePoliciesLoading,
  addLatePolicy,
  updateLatePolicyInList,
  removeLatePolicy,

  // Extra Hours
  setExtraHours,
  setExtraHoursLoading,
  updateExtraHourInList,

  // Error
  setPayrollError,
  clearPayrollError,
} = payrollSlice.actions;

// ─── Reducer ──────────────────────────────────────────────────────────────────

export default payrollSlice.reducer;