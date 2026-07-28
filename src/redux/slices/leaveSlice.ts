import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LeavePolicy {
  id: string;
  branch: string;
  leave_type: string;
  leave_type_display: string;
  annual_quota: number;
  max_club_days: number;
  carry_forward: boolean;
  max_carry_days: number;
  min_advance_days: number;
  allow_half_day: boolean;
  sandwich_rule: boolean;
  is_active: boolean;
}

export interface PublicHoliday {
  id: string;
  branch: string;
  date: string;
  name: string;
  year: number;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  leave_type: string;
  leave_type_display: string;
  year: number;
  total_days: string;
  used_days: string;
  carried_forward: string;
  remaining_days: string;
}

export interface LeaveApplication {
  id: string;
  applied_by?: string;
  applied_by_name?: string;
  student?: string;
  student_name?: string;
  batch_name?: string;
  branch?: string;
  leave_type: string;
  leave_type_display: string;
  from_date: string;
  to_date: string;
  from_time?: string | null;
  to_time?: string | null;
  is_half_day?: boolean;
  half_day_session?: string;
  total_days?: string;
  reason?: string;
  is_capable_of_proof?: boolean;
  parent_consulted?: boolean;
  proof_document_url?: string | null;
  supporting_document_url?: string | null;
  is_auto_generated?: boolean;
  applied_by_role?: string;
  user_role?: string;
  status: "approval_pending" | "approved" | "rejected" | "cancelled" | "pending";
  status_display: string;
  is_first_approval_done?: boolean;
  first_approver?: string | null;
  first_approver_name?: string;
  first_approved_at?: string | null;
  second_approver?: string | null;
  second_approver_name?: string;
  second_approved_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string;
  created_at: string;
  [key: string]: any;
}

export interface LateEntry {
  id: string;
  user: string;
  user_name: string;
  date: string;
  expected_time: string;
  actual_time: string;
  late_minutes: number;
  grace_minutes: number;
  is_penalized: boolean;
  penalty_type: string;
  penalty_type_display: string;
  auto_deduction_triggered: boolean;
  notes: string;
  created_at: string;
}

interface LeaveState {
  // Policies
  policies: LeavePolicy[];
  policiesLoading: boolean;

  // Holidays
  holidays: PublicHoliday[];
  holidaysLoading: boolean;

  // Balances
  myBalance: LeaveBalance[];
  myBalanceLoading: boolean;
  viewedUserBalance: LeaveBalance[];
  viewedUserBalanceLoading: boolean;

  // Applications
  applications: LeaveApplication[];
  applicationsCount: number;
  applicationsLoading: boolean;
  selectedApplication: LeaveApplication | null;

  // Late Entries
  lateEntries: LateEntry[];
  lateEntriesCount: number;
  lateEntriesLoading: boolean;

  error: string | null;
}

const initialState: LeaveState = {
  policies: [],
  policiesLoading: false,

  holidays: [],
  holidaysLoading: false,

  myBalance: [],
  myBalanceLoading: false,
  viewedUserBalance: [],
  viewedUserBalanceLoading: false,

  applications: [],
  applicationsCount: 0,
  applicationsLoading: false,
  selectedApplication: null,

  lateEntries: [],
  lateEntriesCount: 0,
  lateEntriesLoading: false,

  error: null,
};

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    // Policies
    setPolicies(s, a: PayloadAction<LeavePolicy[]>) {
      s.policies = a.payload;
      s.error = null;
    },
    setPoliciesLoading(s, a: PayloadAction<boolean>) {
      s.policiesLoading = a.payload;
    },
    addPolicy(s, a: PayloadAction<LeavePolicy>) {
      s.policies.unshift(a.payload);
    },
    updatePolicyInList(s, a: PayloadAction<LeavePolicy>) {
      const i = s.policies.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.policies[i] = a.payload;
    },
    removePolicy(s, a: PayloadAction<string>) {
      s.policies = s.policies.filter(x => x.id !== a.payload);
    },

    // Holidays
    setHolidays(s, a: PayloadAction<PublicHoliday[]>) {
      s.holidays = a.payload;
      s.error = null;
    },
    setHolidaysLoading(s, a: PayloadAction<boolean>) {
      s.holidaysLoading = a.payload;
    },
    addHoliday(s, a: PayloadAction<PublicHoliday>) {
      s.holidays.unshift(a.payload);
    },
    updateHolidayInList(s, a: PayloadAction<PublicHoliday>) {
      const i = s.holidays.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.holidays[i] = a.payload;
    },
    removeHoliday(s, a: PayloadAction<string>) {
      s.holidays = s.holidays.filter(x => x.id !== a.payload);
    },

    // Balances
    setMyBalance(s, a: PayloadAction<LeaveBalance[]>) {
      s.myBalance = a.payload;
    },
    setMyBalanceLoading(s, a: PayloadAction<boolean>) {
      s.myBalanceLoading = a.payload;
    },
    setViewedUserBalance(s, a: PayloadAction<LeaveBalance[]>) {
      s.viewedUserBalance = a.payload;
    },
    setViewedUserBalanceLoading(s, a: PayloadAction<boolean>) {
      s.viewedUserBalanceLoading = a.payload;
    },

    // Applications
    setApplications(s, a: PayloadAction<{ data: LeaveApplication[]; count: number }>) {
      s.applications = a.payload.data;
      s.applicationsCount = a.payload.count;
      s.error = null;
    },
    setApplicationsLoading(s, a: PayloadAction<boolean>) {
      s.applicationsLoading = a.payload;
    },
    setSelectedApplication(s, a: PayloadAction<LeaveApplication | null>) {
      s.selectedApplication = a.payload;
    },
    addApplication(s, a: PayloadAction<LeaveApplication>) {
      s.applications.unshift(a.payload);
      s.applicationsCount += 1;
    },
    updateApplicationInList(s, a: PayloadAction<LeaveApplication>) {
      const i = s.applications.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.applications[i] = a.payload;
      if (s.selectedApplication?.id === a.payload.id) s.selectedApplication = a.payload;
    },
    removeApplication(s, a: PayloadAction<string>) {
      s.applications = s.applications.filter(x => x.id !== a.payload);
      s.applicationsCount -= 1;
    },

    // Late Entries
    setLateEntries(s, a: PayloadAction<{ data: LateEntry[]; count: number }>) {
      s.lateEntries = a.payload.data;
      s.lateEntriesCount = a.payload.count;
      s.error = null;
    },
    setLateEntriesLoading(s, a: PayloadAction<boolean>) {
      s.lateEntriesLoading = a.payload;
    },
    addLateEntry(s, a: PayloadAction<LateEntry>) {
      s.lateEntries.unshift(a.payload);
      s.lateEntriesCount += 1;
    },
    updateLateEntryInList(s, a: PayloadAction<LateEntry>) {
      const i = s.lateEntries.findIndex(x => x.id === a.payload.id);
      if (i !== -1) s.lateEntries[i] = a.payload;
    },
    removeLateEntry(s, a: PayloadAction<string>) {
      s.lateEntries = s.lateEntries.filter(x => x.id !== a.payload);
      s.lateEntriesCount -= 1;
    },

    setLeaveError(s, a: PayloadAction<string>) {
      s.error = a.payload;
    },
    clearLeaveError(s) {
      s.error = null;
    },
  },
});

export const {
  setPolicies, setPoliciesLoading, addPolicy, updatePolicyInList, removePolicy,
  setHolidays, setHolidaysLoading, addHoliday, updateHolidayInList, removeHoliday,
  setMyBalance, setMyBalanceLoading, setViewedUserBalance, setViewedUserBalanceLoading,
  setApplications, setApplicationsLoading, setSelectedApplication,
  addApplication, updateApplicationInList, removeApplication,
  setLateEntries, setLateEntriesLoading, addLateEntry, updateLateEntryInList, removeLateEntry,
  setLeaveError, clearLeaveError,
} = leaveSlice.actions;

export default leaveSlice.reducer;
