# LeavePage.tsx — Full API Integration Prompt

> Copy this entire prompt and paste it into Cursor / Copilot Chat / Windsurf.
> Fully self-contained — no extra context needed.

---

## CONTEXT — Project Stack & Conventions

You are a senior React + TypeScript developer working inside **insight-ems** (Vite + React 18).

### Tech Stack (already installed — NO new npm installs)

- **State:** Redux Toolkit + Redux Saga (`genericSaga` pattern)
- **Routing:** react-router-dom v6
- **UI:** Radix UI + shadcn/ui (`@/components/ui/`)
- **Charts:** recharts
- **Animations:** framer-motion
- **Forms:** react-hook-form + zod
- **Icons:** lucide-react
- **HTTP:** axios — always via `genericSaga`, never direct calls
- **Notifications:** `useToast` hook (`@/hooks/useToast`)
- **Skeletons:** `TableSkeleton` from `@/components/common/Skeletons`

### API Call Pattern — NEVER deviate

```ts
dispatch({
  type: ACTION_CONSTANT,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endPoint: "/api/v1/...",
  body: { ... },       // optional — use FormData for multipart
  auth: true,          // always — token injected by genericSaga
  setLoading: (v: boolean) => dispatch(setSomeLoading(v)),
  getResponse: (res: any) => { /* handle */ },
  getError: (err: any) => { toast.error(err?.response?.data?.message || err?.message || "Error"); },
});
```

### Role System (from `useAuth().user.role`)

```
super_admin               → full access, all tabs, all CRUD, bypasses both approval levels
branch_manager            → full access, Step 2 final approver, policy + holiday CRUD
admin_senior_executive    → Step 1 approver, late entry admin, view all applications
faculty / front_desk / counsellor  → can apply for leave, view own balance, view own late entries
student / parents / accountant     → read-only, cannot apply for leave
```

### Design Tokens

- Primary orange: `#F7A900` → `bg-primary` / `text-primary`
- Surface: `#F4F5F5`, Card: `#FFFFFF`, Border: `border-border`
- Status: success `bg-green-100 text-green-700` | danger `bg-red-100 text-red-700` | warning `bg-yellow-100 text-yellow-700` | info `bg-blue-100 text-blue-700`

### Folder Structure to Create

```
src/pages/leave/
  LeavePage.tsx                    ← REPLACE existing stub
  tabs/
    ApplicationsTab.tsx            ← List, submit, edit, cancel, approve, reject leave applications
    PoliciesTab.tsx                ← CRUD for leave policies (admin only)
    HolidaysTab.tsx                ← CRUD for public holidays (admin only)
    BalancesTab.tsx                ← View own balance; admin can view any user's balance
    LateEntriesTab.tsx             ← List, create, edit, delete late entry records
```

---

## BUSINESS LOGIC

### Role-based Tab Visibility

| Tab            | super_admin / branch_manager | admin_senior_executive | faculty / front_desk / counsellor | student / parents / accountant |
|----------------|:---:|:---:|:---:|:---:|
| Applications   | ✅ Full CRUD + Approve/Reject | ✅ View all + Step 1 Approve/Reject | ✅ Own applications only (apply, edit pending, cancel) | ❌ hidden |
| Policies       | ✅ Full CRUD | ❌ hidden | ❌ hidden | ❌ hidden |
| Holidays       | ✅ Full CRUD | ❌ hidden | ❌ hidden | ❌ hidden |
| Balances       | ✅ View any user's balance | ✅ View any user's balance | ✅ Own balance only | ❌ hidden |
| Late Entries   | ✅ Full CRUD | ✅ Full CRUD | ✅ Own entries, view only | ❌ hidden |

### Leave Workflow (Two-Step Approval)

1. Staff submits leave → status: `approval_pending`
2. `admin_senior_executive` approves → Step 1 done, awaiting branch manager
3. `branch_manager` or `super_admin` approves → status: `approved`, balance deducted automatically

### Approval button visibility rules:
- Show **Approve** button if role is `admin_senior_executive`, `branch_manager`, or `super_admin` AND status is `approval_pending`
- Show **Reject** button under the same conditions
- `super_admin` bypasses both steps in one click

### Staff who CAN apply for leave:
`faculty`, `front_desk`, `counsellor` (and any non-admin, non-restricted role)

### Staff who CANNOT apply:
`super_admin`, `branch_manager`, `admin_senior_executive`, `student`, `parents`, `accountant`

---

## LEAVE APPLICATION — FILE UPLOAD

Sick leave applications where total days > 2 require a `supporting_document` (medical certificate).
The form must submit as `multipart/form-data` when a file is attached.

```ts
// Build FormData for leave application submission
const formData = new FormData();
formData.append("leave_type", form.leave_type);
formData.append("from_date", form.from_date);
formData.append("to_date", form.to_date);
formData.append("is_half_day", String(form.is_half_day));
if (form.is_half_day) formData.append("half_day_session", form.half_day_session);
formData.append("reason", form.reason);
if (form.supporting_document) formData.append("supporting_document", form.supporting_document);
if (form.branch_id) formData.append("branch_id", form.branch_id);

dispatch({
  type: leaveActions.SUBMIT_LEAVE,
  method: "POST",
  endPoint: API.LEAVE.LIST,
  body: formData,   // genericSaga must detect FormData and set Content-Type: multipart/form-data
  auth: true,
  ...
});
```

---

## FILE 1 — ADD to `src/redux/actions/index.ts`

```ts
export const leaveActions = {
  // Policies
  GET_LEAVE_POLICIES:    "GET_LEAVE_POLICIES",
  CREATE_LEAVE_POLICY:   "CREATE_LEAVE_POLICY",
  UPDATE_LEAVE_POLICY:   "UPDATE_LEAVE_POLICY",
  DELETE_LEAVE_POLICY:   "DELETE_LEAVE_POLICY",

  // Public Holidays
  GET_HOLIDAYS:          "GET_LEAVE_HOLIDAYS",
  CREATE_HOLIDAY:        "CREATE_LEAVE_HOLIDAY",
  UPDATE_HOLIDAY:        "UPDATE_LEAVE_HOLIDAY",
  DELETE_HOLIDAY:        "DELETE_LEAVE_HOLIDAY",

  // Balances
  GET_MY_BALANCE:        "GET_MY_LEAVE_BALANCE",
  GET_USER_BALANCE:      "GET_USER_LEAVE_BALANCE",

  // Applications
  GET_LEAVES:            "GET_LEAVE_APPLICATIONS",
  SUBMIT_LEAVE:          "SUBMIT_LEAVE_APPLICATION",
  UPDATE_LEAVE:          "UPDATE_LEAVE_APPLICATION",
  CANCEL_LEAVE:          "CANCEL_LEAVE_APPLICATION",
  APPROVE_LEAVE:         "APPROVE_LEAVE_APPLICATION",
  REJECT_LEAVE:          "REJECT_LEAVE_APPLICATION",

  // Late Entries
  GET_LATE_ENTRIES:      "GET_LATE_ENTRIES",
  CREATE_LATE_ENTRY:     "CREATE_LATE_ENTRY",
  UPDATE_LATE_ENTRY:     "UPDATE_LATE_ENTRY",
  DELETE_LATE_ENTRY:     "DELETE_LATE_ENTRY",
} as const;
```

---

## FILE 2 — ADD to `src/service/api.ts`

```ts
LEAVE: {
  // Policies
  POLICIES:             "/leave/policy/",
  POLICY_DETAIL:        (id: string) => `/leave/policy/${id}/`,

  // Holidays
  HOLIDAYS:             "/leave/public-holidays/",
  HOLIDAY_DETAIL:       (id: string) => `/leave/public-holidays/${id}/`,

  // Balances
  MY_BALANCE:           "/leave/balance/",
  USER_BALANCE:         (userId: string) => `/leave/balance/${userId}/`,

  // Applications
  LIST:                 "/leave/",
  DETAIL:               (id: string) => `/leave/${id}/`,
  APPROVE:              (id: string) => `/leave/${id}/approve/`,
  REJECT:               (id: string) => `/leave/${id}/reject/`,

  // Late Entries
  LATE_ENTRIES:         "/leave/late-entries/",
  LATE_ENTRY_DETAIL:    (id: string) => `/leave/late-entries/${id}/`,
},
```

---

## FILE 3 — CREATE `src/redux/slices/leaveSlice.ts`

```ts
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
  applied_by: string;
  applied_by_name: string;
  branch?: string;
  leave_type: string;
  leave_type_display: string;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  half_day_session: string;
  total_days: string;
  reason: string;
  supporting_document_url: string | null;
  is_auto_generated: boolean;
  status: "approval_pending" | "approved" | "rejected" | "cancelled";
  status_display: string;
  is_first_approval_done: boolean;
  first_approver: string | null;
  first_approver_name: string;
  first_approved_at: string | null;
  second_approver: string | null;
  second_approver_name: string;
  second_approved_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string;
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
```

---

## FILE 4 — CREATE `src/saga/leaveSaga.ts`

```ts
import { takeLatest } from "redux-saga/effects";
import { leaveActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchLeaveSaga() {
  yield takeLatest(leaveActions.GET_LEAVE_POLICIES, genericSaga);
  yield takeLatest(leaveActions.CREATE_LEAVE_POLICY, genericSaga);
  yield takeLatest(leaveActions.UPDATE_LEAVE_POLICY, genericSaga);
  yield takeLatest(leaveActions.DELETE_LEAVE_POLICY, genericSaga);

  yield takeLatest(leaveActions.GET_HOLIDAYS, genericSaga);
  yield takeLatest(leaveActions.CREATE_HOLIDAY, genericSaga);
  yield takeLatest(leaveActions.UPDATE_HOLIDAY, genericSaga);
  yield takeLatest(leaveActions.DELETE_HOLIDAY, genericSaga);

  yield takeLatest(leaveActions.GET_MY_BALANCE, genericSaga);
  yield takeLatest(leaveActions.GET_USER_BALANCE, genericSaga);

  yield takeLatest(leaveActions.GET_LEAVES, genericSaga);
  yield takeLatest(leaveActions.SUBMIT_LEAVE, genericSaga);
  yield takeLatest(leaveActions.UPDATE_LEAVE, genericSaga);
  yield takeLatest(leaveActions.CANCEL_LEAVE, genericSaga);
  yield takeLatest(leaveActions.APPROVE_LEAVE, genericSaga);
  yield takeLatest(leaveActions.REJECT_LEAVE, genericSaga);

  yield takeLatest(leaveActions.GET_LATE_ENTRIES, genericSaga);
  yield takeLatest(leaveActions.CREATE_LATE_ENTRY, genericSaga);
  yield takeLatest(leaveActions.UPDATE_LATE_ENTRY, genericSaga);
  yield takeLatest(leaveActions.DELETE_LATE_ENTRY, genericSaga);
}
```

Register in your root saga and store:

```ts
// root saga — same pattern as watchExamSaga
import { watchLeaveSaga } from "@/saga/leaveSaga";
yield fork(watchLeaveSaga);

// store combineReducers
import leaveReducer from "@/redux/slices/leaveSlice";
leave: leaveReducer,
```

---

## FILE 5 — CREATE `src/pages/leave/tabs/ApplicationsTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, XCircle, Clock, FileText, Trash2, Pencil, Search } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setApplications, setApplicationsLoading,
  addApplication, updateApplicationInList, removeApplication,
} from "@/redux/slices/leaveSlice";
import type { LeaveApplication } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

// ── Status badge colours ───────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  approval_pending: "bg-yellow-100 text-yellow-700",
  approved:         "bg-green-100 text-green-700",
  rejected:         "bg-red-100 text-red-700",
  cancelled:        "bg-gray-100 text-gray-500",
};

const LEAVE_TYPE_OPTS = [
  { value: "paid",    label: "Paid Leave" },
  { value: "sick",    label: "Sick Leave" },
  { value: "casual",  label: "Casual Leave" },
  { value: "club",    label: "Club Leave" },
  { value: "unpaid",  label: "Unpaid Leave" },
];

// ── Role helpers ───────────────────────────────────────────────────────────
const ADMIN_ROLES  = ["super_admin", "branch_manager", "admin_senior_executive"];
const APPLY_ROLES  = ["faculty", "front_desk", "counsellor"]; // extend if needed
const APPROVE_ROLES = ["super_admin", "branch_manager", "admin_senior_executive"];

export default function ApplicationsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { user } = useAuth();
  const { applications, applicationsCount, applicationsLoading } = useSelector((s: RootState) => s.leave);

  const role       = user?.role ?? "";
  const isAdmin    = ADMIN_ROLES.includes(role);
  const canApply   = APPLY_ROLES.includes(role);
  const canApprove = APPROVE_ROLES.includes(role);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // ── Apply form ────────────────────────────────────────────────────────────
  const [applyOpen, setApplyOpen]   = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyForm, setApplyForm]   = useState({
    leave_type: "casual",
    from_date: "",
    to_date: "",
    is_half_day: false,
    half_day_session: "morning",
    reason: "",
    supporting_document: null as File | null,
  });

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<LeaveApplication | null>(null);
  const [editLoading, setEditLoading]   = useState(false);

  // ── Reject dialog ─────────────────────────────────────────────────────────
  const [rejectTarget, setRejectTarget] = useState<LeaveApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── Cancel / Approve confirm ──────────────────────────────────────────────
  const [cancelTarget, setCancelTarget]   = useState<LeaveApplication | null>(null);
  const [approveTarget, setApproveTarget] = useState<LeaveApplication | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // ── Fetch applications ────────────────────────────────────────────────────
  const fetchApplications = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (typeFilter)   params.append("leave_type", typeFilter);
    if (search)       params.append("search", search);
    const endPoint = `${API.LEAVE.LIST}${params.toString() ? "?" + params.toString() : ""}`;

    dispatch({
      type: leaveActions.GET_LEAVES,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setApplicationsLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
        const count = res?.count ?? data.length;
        dispatch(setApplications({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load applications"),
    });
  };

  useEffect(() => { fetchApplications(); }, [statusFilter, typeFilter]);

  // ── Submit leave application (multipart) ──────────────────────────────────
  const handleApply = () => {
    const formData = new FormData();
    formData.append("leave_type", applyForm.leave_type);
    formData.append("from_date", applyForm.from_date);
    formData.append("to_date", applyForm.to_date);
    formData.append("is_half_day", String(applyForm.is_half_day));
    if (applyForm.is_half_day) formData.append("half_day_session", applyForm.half_day_session);
    formData.append("reason", applyForm.reason);
    if (applyForm.supporting_document) formData.append("supporting_document", applyForm.supporting_document);

    dispatch({
      type: leaveActions.SUBMIT_LEAVE,
      method: "POST",
      endPoint: API.LEAVE.LIST,
      body: formData,
      auth: true,
      setLoading: (v: boolean) => setApplyLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addApplication(res.data));
          toast.success("Leave application submitted.");
          setApplyOpen(false);
          setApplyForm({ leave_type: "casual", from_date: "", to_date: "", is_half_day: false, half_day_session: "morning", reason: "", supporting_document: null });
        } else toast.error("Failed to submit application.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to submit leave application"),
    });
  };

  // ── Edit pending application (JSON only) ─────────────────────────────────
  const handleEdit = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_LEAVE,
      method: "PATCH",
      endPoint: API.LEAVE.DETAIL(editTarget.id),
      body: {
        from_date: editTarget.from_date,
        to_date: editTarget.to_date,
        reason: editTarget.reason,
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) {
          dispatch(updateApplicationInList(res.data));
          toast.success("Application updated.");
          setEditOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update application"),
    });
  };

  // ── Cancel application ────────────────────────────────────────────────────
  const handleCancel = () => {
    if (!cancelTarget) return;
    dispatch({
      type: leaveActions.CANCEL_LEAVE,
      method: "DELETE",
      endPoint: API.LEAVE.DETAIL(cancelTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeApplication(cancelTarget.id));
        toast.success("Leave cancelled.");
        setCancelTarget(null);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to cancel leave"),
    });
  };

  // ── Approve leave ─────────────────────────────────────────────────────────
  const handleApprove = () => {
    if (!approveTarget) return;
    dispatch({
      type: leaveActions.APPROVE_LEAVE,
      method: "POST",
      endPoint: API.LEAVE.APPROVE(approveTarget.id),
      auth: true,
      setLoading: (v: boolean) => setApproveLoading(v),
      getResponse: (res: any) => {
        toast.success(res?.message || "Leave approved.");
        setApproveTarget(null);
        fetchApplications(); // refresh to get updated status
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Approval failed"),
    });
  };

  // ── Reject leave ──────────────────────────────────────────────────────────
  const handleReject = () => {
    if (!rejectTarget) return;
    dispatch({
      type: leaveActions.REJECT_LEAVE,
      method: "POST",
      endPoint: API.LEAVE.REJECT(rejectTarget.id),
      body: { reason: rejectReason },
      auth: true,
      setLoading: (v: boolean) => setRejectLoading(v),
      getResponse: (res: any) => {
        toast.success(res?.message || "Leave rejected.");
        setRejectTarget(null);
        setRejectReason("");
        fetchApplications();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Rejection failed"),
    });
  };

  const filtered = applications.filter(a => {
    const matchSearch = !search || a.applied_by_name?.toLowerCase().includes(search.toLowerCase()) || a.reason?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applicant / reason..."
              className="pl-8 h-9 text-sm w-56"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approval_pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {/* Leave type filter */}
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LEAVE_TYPE_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 text-sm" onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); fetchApplications(); }}>
            Clear
          </Button>
        </div>

        {/* Apply button — staff only */}
        {canApply && (
          <Button onClick={() => setApplyOpen(true)} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
            <Plus className="w-4 h-4" /> Apply for Leave
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">{applicationsCount} application(s) total · {filtered.length} shown</p>

      {/* Table */}
      {applicationsLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Applicant", "Type", "From", "To", "Days", "Status", "1st Approval", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No applications found.</td></tr>
              ) : filtered.map((app, i) => (
                <motion.tr
                  key={app.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{app.applied_by_name}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{app.leave_type_display}</td>
                  <td className="px-4 py-3">{app.from_date}</td>
                  <td className="px-4 py-3">{app.to_date}</td>
                  <td className="px-4 py-3">{app.total_days}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_BADGE[app.status] ?? ""} text-xs capitalize`}>{app.status_display}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {app.is_first_approval_done
                      ? <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done</span>
                      : <span className="text-yellow-600 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Approve */}
                      {canApprove && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600 hover:text-green-700"
                          onClick={() => setApproveTarget(app)} title="Approve">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {/* Reject */}
                      {canApprove && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:text-red-600"
                          onClick={() => setRejectTarget(app)} title="Reject">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {/* Edit — applicant only, pending only */}
                      {!isAdmin && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7"
                          onClick={() => { setEditTarget(app); setEditOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {/* Cancel — applicant only, pending only */}
                      {!isAdmin && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500"
                          onClick={() => setCancelTarget(app)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {/* Document link */}
                      {app.supporting_document_url && (
                        <a href={app.supporting_document_url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="w-7 h-7" title="View Document">
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={o => setApplyOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Leave Type *</Label>
              <Select value={applyForm.leave_type} onValueChange={v => setApplyForm(f => ({ ...f, leave_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPE_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">From Date *</Label>
                <Input type="date" value={applyForm.from_date} onChange={e => setApplyForm(f => ({ ...f, from_date: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">To Date *</Label>
                <Input type="date" value={applyForm.to_date} onChange={e => setApplyForm(f => ({ ...f, to_date: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            {/* Half day toggle */}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="half_day" checked={applyForm.is_half_day}
                onChange={e => setApplyForm(f => ({ ...f, is_half_day: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              <Label htmlFor="half_day" className="text-sm cursor-pointer">Half Day Leave</Label>
            </div>
            {applyForm.is_half_day && (
              <div>
                <Label className="text-xs mb-1 block">Session *</Label>
                <Select value={applyForm.half_day_session} onValueChange={v => setApplyForm(f => ({ ...f, half_day_session: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Reason *</Label>
              <Textarea value={applyForm.reason} onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                rows={3} placeholder="Describe the reason for your leave..." className="text-sm resize-none" />
            </div>
            {/* Supporting document — shown for sick leave */}
            {applyForm.leave_type === "sick" && (
              <div>
                <Label className="text-xs mb-1 block">Supporting Document (required if &gt; 2 days)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setApplyForm(f => ({ ...f, supporting_document: e.target.files?.[0] ?? null }))}
                  className="h-9 text-sm" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)} disabled={applyLoading}>Cancel</Button>
            <Button onClick={handleApply}
              disabled={applyLoading || !applyForm.from_date || !applyForm.to_date || !applyForm.reason.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {applyLoading ? "Submitting…" : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Leave Application</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">From Date</Label>
                  <Input type="date" value={editTarget.from_date}
                    onChange={e => setEditTarget(p => p ? { ...p, from_date: e.target.value } : null)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">To Date</Label>
                  <Input type="date" value={editTarget.to_date}
                    onChange={e => setEditTarget(p => p ? { ...p, to_date: e.target.value } : null)} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Reason</Label>
                <Textarea value={editTarget.reason}
                  onChange={e => setEditTarget(p => p ? { ...p, reason: e.target.value } : null)}
                  rows={3} className="text-sm resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={o => { if (!o) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Leave Application</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1 block">Rejection Reason *</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="Explain the reason for rejection..." className="text-sm resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={rejectLoading}>Cancel</Button>
            <Button onClick={handleReject} disabled={rejectLoading || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white">
              {rejectLoading ? "Rejecting…" : "Reject Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirm */}
      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={o => !o && setApproveTarget(null)}
        title={`Approve leave for ${approveTarget?.applied_by_name}?`}
        description={`This will record your approval (${role === "admin_senior_executive" ? "Step 1" : "Final approval"}). ${role !== "admin_senior_executive" ? "Leave balance will be deducted automatically upon final approval." : ""}`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />

      {/* Cancel Confirm */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={o => !o && setCancelTarget(null)}
        title="Cancel this leave application?"
        description="This will withdraw your application. This action cannot be undone."
        confirmLabel="Cancel Leave"
        variant="danger"
        onConfirm={handleCancel}
      />
    </div>
  );
}
```

---

## FILE 6 — CREATE `src/pages/leave/tabs/PoliciesTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setPolicies, setPoliciesLoading, addPolicy, updatePolicyInList, removePolicy } from "@/redux/slices/leaveSlice";
import type { LeavePolicy } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const LEAVE_TYPE_OPTS = ["paid", "sick", "casual", "club", "unpaid"];

const blankForm = () => ({
  leave_type: "casual",
  annual_quota: "",
  max_club_days: "",
  min_advance_days: "",
  max_carry_days: "",
  allow_half_day: true,
  sandwich_rule: false,
  carry_forward: false,
});

export default function PoliciesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { policies, policiesLoading } = useSelector((s: RootState) => s.leave);

  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<LeavePolicy | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeavePolicy | null>(null);
  const [form, setForm]               = useState(blankForm());

  useEffect(() => {
    dispatch({
      type: leaveActions.GET_LEAVE_POLICIES,
      method: "GET",
      endPoint: API.LEAVE.POLICIES,
      auth: true,
      setLoading: (v: boolean) => dispatch(setPoliciesLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setPolicies(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load policies"),
    });
  }, []);

  const handleCreate = () => {
    dispatch({
      type: leaveActions.CREATE_LEAVE_POLICY,
      method: "POST",
      endPoint: API.LEAVE.POLICIES,
      body: {
        ...form,
        annual_quota:    Number(form.annual_quota),
        max_club_days:   Number(form.max_club_days),
        min_advance_days: Number(form.min_advance_days),
        max_carry_days:  Number(form.max_carry_days),
      },
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addPolicy(res.data));
          toast.success("Policy created.");
          setCreateOpen(false);
          setForm(blankForm());
        } else toast.error("Failed to create policy.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create policy"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_LEAVE_POLICY,
      method: "PATCH",
      endPoint: API.LEAVE.POLICY_DETAIL(editTarget.id),
      body: {
        annual_quota:    editTarget.annual_quota,
        max_club_days:   editTarget.max_club_days,
        min_advance_days: editTarget.min_advance_days,
        max_carry_days:  editTarget.max_carry_days,
        allow_half_day:  editTarget.allow_half_day,
        sandwich_rule:   editTarget.sandwich_rule,
        carry_forward:   editTarget.carry_forward,
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updatePolicyInList(res.data)); toast.success("Policy updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update policy"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: leaveActions.DELETE_LEAVE_POLICY,
      method: "DELETE",
      endPoint: API.LEAVE.POLICY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removePolicy(deleteTarget.id)); toast.success("Policy deactivated."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to deactivate policy"),
    });
  };

  const BoolIcon = ({ v }: { v: boolean }) => v
    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
    : <XCircle className="w-4 h-4 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{policies.length} policy(ies)</p>
        <Button onClick={() => { setForm(blankForm()); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Policy
        </Button>
      </div>

      {policiesLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Leave Type", "Quota/yr", "Max Club", "Advance Days", "Carry Fwd", "Max Carry", "Half Day", "Sandwich", "Active", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">No policies configured.</td></tr>
              ) : policies.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium capitalize">{p.leave_type_display}</td>
                  <td className="px-4 py-3">{p.annual_quota}</td>
                  <td className="px-4 py-3">{p.max_club_days}</td>
                  <td className="px-4 py-3">{p.min_advance_days}d</td>
                  <td className="px-4 py-3"><BoolIcon v={p.carry_forward} /></td>
                  <td className="px-4 py-3">{p.max_carry_days}d</td>
                  <td className="px-4 py-3"><BoolIcon v={p.allow_half_day} /></td>
                  <td className="px-4 py-3"><BoolIcon v={p.sandwich_rule} /></td>
                  <td className="px-4 py-3"><BoolIcon v={p.is_active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(p); setEditOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={o => setCreateOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Leave Policy</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Leave Type *</Label>
              <Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPE_OPTS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Annual Quota (days)", key: "annual_quota" },
                { label: "Max Club Days",       key: "max_club_days" },
                { label: "Min Advance Days",    key: "min_advance_days" },
                { label: "Max Carry Days",      key: "max_carry_days" },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-xs mb-1 block">{f.label}</Label>
                  <Input type="number" value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-9 text-sm" />
                </div>
              ))}
            </div>
            {[
              { label: "Allow Half Day", key: "allow_half_day" },
              { label: "Sandwich Rule",  key: "sandwich_rule" },
              { label: "Carry Forward",  key: "carry_forward" },
            ].map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <input type="checkbox" id={f.key} checked={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.checked }))}
                  className="w-4 h-4 accent-primary" />
                <Label htmlFor={f.key} className="text-sm cursor-pointer">{f.label}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLoading || !form.annual_quota}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Creating…" : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Leave Policy — {editTarget?.leave_type_display}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Annual Quota",    key: "annual_quota" },
                  { label: "Max Club Days",   key: "max_club_days" },
                  { label: "Min Advance Days", key: "min_advance_days" },
                  { label: "Max Carry Days",  key: "max_carry_days" },
                ].map(f => (
                  <div key={f.key}>
                    <Label className="text-xs mb-1 block">{f.label}</Label>
                    <Input type="number" value={(editTarget as any)[f.key]}
                      onChange={e => setEditTarget(p => p ? { ...p, [f.key]: Number(e.target.value) } : null)}
                      className="h-9 text-sm" />
                  </div>
                ))}
              </div>
              {[
                { label: "Allow Half Day", key: "allow_half_day" },
                { label: "Sandwich Rule",  key: "sandwich_rule" },
                { label: "Carry Forward",  key: "carry_forward" },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <input type="checkbox" id={`edit_${f.key}`} checked={(editTarget as any)[f.key]}
                    onChange={e => setEditTarget(p => p ? { ...p, [f.key]: e.target.checked } : null)}
                    className="w-4 h-4 accent-primary" />
                  <Label htmlFor={`edit_${f.key}`} className="text-sm cursor-pointer">{f.label}</Label>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Deactivate "${deleteTarget?.leave_type_display}" policy?`}
        description="The policy will be deactivated. Existing applications are not affected."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 7 — CREATE `src/pages/leave/tabs/HolidaysTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setHolidays, setHolidaysLoading, addHoliday, updateHolidayInList, removeHoliday } from "@/redux/slices/leaveSlice";
import type { PublicHoliday } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function HolidaysTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { holidays, holidaysLoading } = useSelector((s: RootState) => s.leave);

  const [yearFilter, setYearFilter]   = useState(String(new Date().getFullYear()));
  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<PublicHoliday | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PublicHoliday | null>(null);
  const [form, setForm]               = useState({ name: "", date: "" });

  const fetchHolidays = () => {
    const params = yearFilter ? `?year=${yearFilter}` : "";
    dispatch({
      type: leaveActions.GET_HOLIDAYS,
      method: "GET",
      endPoint: `${API.LEAVE.HOLIDAYS}${params}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setHolidaysLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setHolidays(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load holidays"),
    });
  };

  useEffect(() => { fetchHolidays(); }, [yearFilter]);

  const handleCreate = () => {
    dispatch({
      type: leaveActions.CREATE_HOLIDAY,
      method: "POST",
      endPoint: API.LEAVE.HOLIDAYS,
      body: form,
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addHoliday(res.data));
          toast.success("Holiday created.");
          setCreateOpen(false);
          setForm({ name: "", date: "" });
        } else toast.error("Failed to create holiday.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create holiday"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_HOLIDAY,
      method: "PATCH",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(editTarget.id),
      body: { name: editTarget.name, date: editTarget.date },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateHolidayInList(res.data)); toast.success("Holiday updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update holiday"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: leaveActions.DELETE_HOLIDAY,
      method: "DELETE",
      endPoint: API.LEAVE.HOLIDAY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeHoliday(deleteTarget.id)); toast.success("Holiday deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete holiday"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <Input type="number" placeholder="Year" value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="h-9 text-sm w-28" />
          <p className="text-xs text-muted-foreground">{holidays.length} holiday(s)</p>
        </div>
        <Button onClick={() => { setForm({ name: "", date: "" }); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Holiday
        </Button>
      </div>

      {holidaysLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Name", "Date", "Year", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">No public holidays found for this year.</td></tr>
              ) : holidays.map((h, i) => (
                <motion.tr key={h.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{h.name}</td>
                  <td className="px-4 py-3">{h.date}</td>
                  <td className="px-4 py-3">{h.year}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(h); setEditOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(h)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={o => setCreateOpen(o)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Public Holiday</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Holiday Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Independence Day" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLoading || !form.name.trim() || !form.date}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Adding…" : "Add Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Holiday</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs mb-1 block">Name</Label>
                <Input value={editTarget.name} onChange={e => setEditTarget(p => p ? { ...p, name: e.target.value } : null)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Date</Label>
                <Input type="date" value={editTarget.date} onChange={e => setEditTarget(p => p ? { ...p, date: e.target.value } : null)} className="h-9 text-sm" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This public holiday will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 8 — CREATE `src/pages/leave/tabs/BalancesTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setMyBalance, setMyBalanceLoading, setViewedUserBalance, setViewedUserBalanceLoading } from "@/redux/slices/leaveSlice";
import type { LeaveBalance } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const ADMIN_ROLES = ["super_admin", "branch_manager", "admin_senior_executive"];

// Visual bar for remaining vs used
function BalanceBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-400" : "bg-green-500";
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function BalancesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { user } = useAuth();
  const { myBalance, myBalanceLoading, viewedUserBalance, viewedUserBalanceLoading } = useSelector((s: RootState) => s.leave);

  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  // Admin user lookup
  const [lookupUserId, setLookupUserId] = useState("");
  const [lookupYear, setLookupYear]     = useState(String(new Date().getFullYear()));

  useEffect(() => {
    dispatch({
      type: leaveActions.GET_MY_BALANCE,
      method: "GET",
      endPoint: API.LEAVE.MY_BALANCE,
      auth: true,
      setLoading: (v: boolean) => dispatch(setMyBalanceLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setMyBalance(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load balance"),
    });
  }, []);

  const handleLookup = () => {
    if (!lookupUserId.trim()) return;
    const params = lookupYear ? `?year=${lookupYear}` : "";
    dispatch({
      type: leaveActions.GET_USER_BALANCE,
      method: "GET",
      endPoint: `${API.LEAVE.USER_BALANCE(lookupUserId)}${params}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setViewedUserBalanceLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setViewedUserBalance(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load user balance"),
    });
  };

  const BalanceCards = ({ balances, loading }: { balances: LeaveBalance[]; loading: boolean }) => {
    if (loading) return <TableSkeleton />;
    if (balances.length === 0) return (
      <div className="text-center py-8 text-muted-foreground text-sm">No balance data found.</div>
    );
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {balances.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize">{b.leave_type_display}</p>
              <span className="text-xs text-muted-foreground">{b.year}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{b.remaining_days}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">{b.used_days}</p>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
              <div>
                <p className="text-lg font-bold text-muted-foreground">{b.total_days}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <BalanceBar used={Number(b.used_days)} total={Number(b.total_days)} />
            {Number(b.carried_forward) > 0 && (
              <p className="text-xs text-blue-600">+{b.carried_forward} carried forward</p>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* My Balance */}
      <div>
        <h3 className="text-sm font-semibold mb-3">My Leave Balance</h3>
        <BalanceCards balances={myBalance} loading={myBalanceLoading} />
      </div>

      {/* Admin: look up any user's balance */}
      {isAdmin && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold">Look Up Staff Balance</h3>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <Label className="text-xs mb-1 block">Staff User UUID</Label>
              <Input value={lookupUserId} onChange={e => setLookupUserId(e.target.value)}
                placeholder="user-uuid" className="h-9 text-sm font-mono w-72" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Year</Label>
              <Input type="number" value={lookupYear} onChange={e => setLookupYear(e.target.value)}
                className="h-9 text-sm w-24" />
            </div>
            <Button onClick={handleLookup} disabled={viewedUserBalanceLoading || !lookupUserId.trim()}
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
              {viewedUserBalanceLoading ? "Loading…" : "Fetch Balance"}
            </Button>
          </div>
          {viewedUserBalance.length > 0 && (
            <BalanceCards balances={viewedUserBalance} loading={viewedUserBalanceLoading} />
          )}
        </div>
      )}
    </div>
  );
}
```

---

## FILE 9 — CREATE `src/pages/leave/tabs/LateEntriesTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, AlertCircle } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setLateEntries, setLateEntriesLoading, addLateEntry, updateLateEntryInList, removeLateEntry } from "@/redux/slices/leaveSlice";
import type { LateEntry } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const PENALTY_OPTS = [
  { value: "half_day_deduction", label: "Half Day Deduction" },
  { value: "salary_deduction",   label: "Salary Deduction" },
  { value: "warning",            label: "Warning" },
];

const PENALTY_BADGE: Record<string, string> = {
  half_day_deduction: "bg-orange-100 text-orange-700",
  salary_deduction:   "bg-red-100 text-red-700",
  warning:            "bg-yellow-100 text-yellow-700",
};

const ADMIN_MANAGE_ROLES = ["super_admin", "branch_manager", "admin_senior_executive"];

export default function LateEntriesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { user } = useAuth();
  const { lateEntries, lateEntriesCount, lateEntriesLoading } = useSelector((s: RootState) => s.leave);

  const canManage = ADMIN_MANAGE_ROLES.includes(user?.role ?? "");

  const [search, setSearch]           = useState("");
  const [penaltyFilter, setPenaltyFilter] = useState("");
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");

  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<LateEntry | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LateEntry | null>(null);

  const [form, setForm] = useState({
    user_id: "", date: "", expected_time: "09:00:00",
    actual_time: "", penalty_type: "warning", notes: "",
  });

  const fetchLateEntries = () => {
    const params = new URLSearchParams();
    if (search)        params.append("search", search);
    if (penaltyFilter) params.append("penalty_type", penaltyFilter);
    if (fromDate)      params.append("from_date", fromDate);
    if (toDate)        params.append("to_date", toDate);
    const endPoint = `${API.LEAVE.LATE_ENTRIES}${params.toString() ? "?" + params.toString() : ""}`;

    dispatch({
      type: leaveActions.GET_LATE_ENTRIES,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setLateEntriesLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
        const count = res?.count ?? data.length;
        dispatch(setLateEntries({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load late entries"),
    });
  };

  useEffect(() => { fetchLateEntries(); }, [penaltyFilter]);

  const handleCreate = () => {
    dispatch({
      type: leaveActions.CREATE_LATE_ENTRY,
      method: "POST",
      endPoint: API.LEAVE.LATE_ENTRIES,
      body: form,
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addLateEntry(res.data));
          toast.success("Late entry recorded.");
          if (res.data.auto_deduction_triggered) {
            toast.warning("Auto deduction triggered — a half-day leave was applied.");
          }
          setCreateOpen(false);
          setForm({ user_id: "", date: "", expected_time: "09:00:00", actual_time: "", penalty_type: "warning", notes: "" });
        } else toast.error("Failed to record late entry.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create late entry"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_LATE_ENTRY,
      method: "PATCH",
      endPoint: API.LEAVE.LATE_ENTRY_DETAIL(editTarget.id),
      body: { is_penalized: editTarget.is_penalized, penalty_type: editTarget.penalty_type, notes: editTarget.notes },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateLateEntryInList(res.data)); toast.success("Late entry updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update late entry"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: leaveActions.DELETE_LATE_ENTRY,
      method: "DELETE",
      endPoint: API.LEAVE.LATE_ENTRY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeLateEntry(deleteTarget.id)); toast.success("Late entry deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete late entry"),
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search staff / notes..." className="pl-8 h-9 text-sm w-52"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={penaltyFilter} onValueChange={v => setPenaltyFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Penalties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Penalties</SelectItem>
              {PENALTY_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="h-9 text-sm w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="From" />
          <Input type="date" className="h-9 text-sm w-36" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="To" />
          <Button variant="outline" className="h-9 text-sm"
            onClick={() => { setSearch(""); setPenaltyFilter(""); setFromDate(""); setToDate(""); fetchLateEntries(); }}>
            Clear
          </Button>
          <Button variant="outline" className="h-9 text-sm" onClick={fetchLateEntries}>Search</Button>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
            <Plus className="w-4 h-4" /> Record Late Entry
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{lateEntriesCount} record(s)</p>

      {lateEntriesLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Staff", "Date", "Expected", "Actual", "Late (min)", "Penalty", "Auto Deducted", "Notes", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lateEntries.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">No late entry records found.</td></tr>
              ) : lateEntries.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{e.user_name}</p>
                  </td>
                  <td className="px-4 py-3">{e.date}</td>
                  <td className="px-4 py-3">{e.expected_time}</td>
                  <td className="px-4 py-3">{e.actual_time}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${e.late_minutes > 30 ? "text-red-600" : "text-yellow-600"}`}>
                      {e.late_minutes}m
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.penalty_type
                      ? <Badge className={`${PENALTY_BADGE[e.penalty_type] ?? ""} text-xs`}>{e.penalty_type_display}</Badge>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.auto_deduction_triggered
                      ? <span className="text-orange-600 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Yes</span>
                      : <span className="text-muted-foreground text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-muted-foreground truncate">{e.notes || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(e); setEditOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(e)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={o => setCreateOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Late Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Staff User UUID *</Label>
              <Input value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                placeholder="user-uuid" className="h-9 text-sm font-mono" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Expected Time *</Label>
                <Input type="time" value={form.expected_time} onChange={e => setForm(f => ({ ...f, expected_time: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Actual Time *</Label>
                <Input type="time" value={form.actual_time} onChange={e => setForm(f => ({ ...f, actual_time: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Penalty Type *</Label>
              <Select value={form.penalty_type} onValueChange={v => setForm(f => ({ ...f, penalty_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PENALTY_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Optional context..." className="text-sm resize-none" />
            </div>
            <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 rounded p-2">
              ⚠ If this staff member has exceeded the monthly late threshold, a half-day deduction may be auto-triggered.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate}
              disabled={createLoading || !form.user_id.trim() || !form.date || !form.actual_time}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Recording…" : "Record Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Late Entry — {editTarget?.user_name}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="edit_penalized" checked={editTarget.is_penalized}
                  onChange={e => setEditTarget(p => p ? { ...p, is_penalized: e.target.checked } : null)}
                  className="w-4 h-4 accent-primary" />
                <Label htmlFor="edit_penalized" className="text-sm cursor-pointer">Is Penalized</Label>
              </div>
              {editTarget.is_penalized && (
                <div>
                  <Label className="text-xs mb-1 block">Penalty Type</Label>
                  <Select value={editTarget.penalty_type} onValueChange={v => setEditTarget(p => p ? { ...p, penalty_type: v } : null)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{PENALTY_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs mb-1 block">Notes</Label>
                <Textarea value={editTarget.notes} onChange={e => setEditTarget(p => p ? { ...p, notes: e.target.value } : null)}
                  rows={2} className="text-sm resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete this late entry record?"
        description="This action cannot be undone. Any auto-deduction already triggered will not be reversed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 10 — CREATE `src/pages/leave/LeavePage.tsx` (REPLACE EXISTING STUB)

```tsx
import { useEffect } from "react";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";

import ApplicationsTab from "./tabs/ApplicationsTab";
import PoliciesTab     from "./tabs/PoliciesTab";
import HolidaysTab     from "./tabs/HolidaysTab";
import BalancesTab     from "./tabs/BalancesTab";
import LateEntriesTab  from "./tabs/LateEntriesTab";

// ── Role-based tab config ────────────────────────────────────────────────────
const TAB_CONFIG = [
  {
    value: "applications",
    label: "Applications",
    roles: ["super_admin", "branch_manager", "admin_senior_executive", "faculty", "front_desk", "counsellor"],
  },
  {
    value: "policies",
    label: "Policies",
    roles: ["super_admin", "branch_manager"],
  },
  {
    value: "holidays",
    label: "Public Holidays",
    roles: ["super_admin", "branch_manager"],
  },
  {
    value: "balances",
    label: "Leave Balance",
    roles: ["super_admin", "branch_manager", "admin_senior_executive", "faculty", "front_desk", "counsellor"],
  },
  {
    value: "late_entries",
    label: "Late Entries",
    roles: ["super_admin", "branch_manager", "admin_senior_executive", "faculty", "front_desk", "counsellor"],
  },
];

const getVisibleTabs = (role: string) =>
  TAB_CONFIG.filter(t => t.roles.includes(role));

export default function LeavePage() {
  const { setPageTitle } = useUI();
  const { user }         = useAuth();

  const role        = user?.role ?? "faculty";
  const visibleTabs = getVisibleTabs(role);
  const defaultTab  = visibleTabs[0]?.value ?? "applications";

  useEffect(() => {
    setPageTitle("Leave Management");
  }, [setPageTitle]);

  return (
    <div className="space-y-5">
      <PageHeader title="Leave Management" subtitle="Manage leave applications, policies, holidays, and attendance." />

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Applications */}
        <TabsContent value="applications" className="mt-4">
          <ApplicationsTab />
        </TabsContent>

        {/* Policies — super_admin / branch_manager only */}
        <TabsContent value="policies" className="mt-4">
          <PoliciesTab />
        </TabsContent>

        {/* Holidays — super_admin / branch_manager only */}
        <TabsContent value="holidays" className="mt-4">
          <HolidaysTab />
        </TabsContent>

        {/* Balances */}
        <TabsContent value="balances" className="mt-4">
          <BalancesTab />
        </TabsContent>

        {/* Late Entries */}
        <TabsContent value="late_entries" className="mt-4">
          <LateEntriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## CHECKLIST — Do after pasting all files

- [ ] Register `leaveReducer` in store: `leave: leaveReducer`
- [ ] Register `watchLeaveSaga` in root saga: `yield fork(watchLeaveSaga)`
- [ ] Add `leaveActions` to `src/redux/actions/index.ts`
- [ ] Add `API.LEAVE` block to `src/service/api.ts`
- [ ] Add route in router: `<Route path="/leave" element={<LeavePage />} />`
- [ ] Add nav item for Leave Management in your sidebar config
- [ ] Verify `genericSaga` handles `FormData` body correctly (sets `Content-Type: multipart/form-data` automatically when body is a FormData instance)

---

## NOTES FOR IDE AI

- **Do NOT install any new packages** — all imports are from existing dependencies
- **Do NOT use direct axios** — all HTTP via `dispatch({ type, method, endPoint, auth: true, ... })`
- **Leave application POST uses `FormData`** — pass the FormData object as `body`. genericSaga must detect FormData and set the correct Content-Type header automatically
- **Approve has NO request body** — just a POST with no payload to `/leave/{id}/approve/`
- **Reject body is `{ reason: string }`** — always require a reason before enabling the reject button
- **Two-step approval**: `admin_senior_executive` does Step 1; `branch_manager` or `super_admin` does the final Step 2 (which also triggers balance deduction)
- **`super_admin` bypasses both steps in a single approve call** — the backend handles this automatically
- **Staff who CAN apply**: `faculty`, `front_desk`, `counsellor` — check with `APPLY_ROLES.includes(role)`, not by excluding admin roles
- **Staff who CANNOT apply**: `super_admin`, `branch_manager`, `admin_senior_executive`, `student`, `parents`, `accountant` — hide the Apply button entirely
- **Edit / Cancel leave** is only available to the applicant themselves and only when status is `approval_pending`
- **Policies and Holidays tabs** are completely hidden from all roles except `super_admin` and `branch_manager` — enforced via `TAB_CONFIG` roles array
- **Late entry `auto_deduction_triggered`**: when true, show an extra toast warning to the admin who just created the entry
- **BalancesTab**: staff see only their own balance from `GET /leave/balance/`; admins additionally see a lookup panel to fetch any user's balance via `GET /leave/balance/{user_id}/`
- **All Tailwind classes only** — primary `bg-primary` = `#F7A900` per project theme config
- **Role check pattern**: always use `ROLE_ARRAY.includes(user?.role ?? "")` — never chain equality comparisons
