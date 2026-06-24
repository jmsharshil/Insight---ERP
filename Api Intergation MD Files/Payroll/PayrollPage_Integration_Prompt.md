# PayrollPage.tsx — Full API Integration Prompt

> Copy this entire prompt into Cursor / Copilot Chat / Windsurf.
> Fully self-contained — no extra context needed.

---

## CONTEXT — Project Stack & Conventions

You are a senior React + TypeScript developer working inside **insight-ems** (Vite + React 18).

### Tech Stack (already installed — NO new npm installs)
- **State:** Redux Toolkit + Redux Saga (`genericSaga` pattern)
- **UI:** Radix UI + shadcn/ui (`@/components/ui/`)
- **Forms:** react-hook-form + zod
- **Charts:** recharts
- **Animations:** framer-motion
- **Icons:** lucide-react
- **Notifications:** `useToast` (`@/hooks/useToast`)
- **Skeletons:** `TableSkeleton` from `@/components/common/Skeletons`

### API Call Pattern — NEVER deviate
```ts
dispatch({
  type: ACTION_CONSTANT,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endPoint: "/api/v1/...",
  body: { ... },
  auth: true,
  setLoading: (v: boolean) => dispatch(setSomeLoading(v)),
  getResponse: (res: any) => { /* handle res.data */ },
  getError: (err: any) => { toast.error(err?.response?.data?.message || err?.message || "Error"); },
});
```

### Design Tokens
- Primary orange `#F7A900` → `bg-primary` / `text-primary`
- Status: `draft` → `bg-gray-100 text-gray-700` | `pending_approval` → `bg-yellow-100 text-yellow-700` | `approved` → `bg-green-100 text-green-700` | `disbursed` → `bg-blue-100 text-blue-700`
- Danger: `bg-red-100 text-red-700` | Success: `bg-green-100 text-green-700`

### Role System
```
super_admin        → ALL tabs + approve + disburse + extra hours + late policy
branch_manager     → My Payroll + Payroll Runs (approve) + Payslips + Late Policy
accountant         → My Payroll + Payroll Runs (disburse) + Payslips
faculty            → My Payroll + Salary Preview
other staff roles  → My Payroll only
student / parent   → NO access (redirect or hide)
```

### Folder Structure to Create
```
src/pages/payroll/
  PayrollPage.tsx               ← REPLACE existing stub
  tabs/
    MyPayrollTab.tsx            ← Own payroll history (all staff)
    SalaryPreviewTab.tsx        ← Faculty live estimate
    PayrollRunsTab.tsx          ← Generate / list / approve / disburse runs
    PayslipsTab.tsx             ← View + adjust payslips for selected run
    ExtraHoursTab.tsx           ← Approve / reject faculty overtime
    LatePolicyTab.tsx           ← Branch late penalty config CRUD
  components/
    PayslipAdjustSheet.tsx      ← Side sheet for bonus / deduction adjustment
```

---

## BUSINESS LOGIC — Read before writing any code

### PayrollRun Status Flow
```
draft  ──(submit for review)──►  pending_approval
pending_approval  ──(approve)──►  approved        [branch_manager / super_admin]
approved  ──(disburse)──►  disbursed              [super_admin / accountant]
```
- `draft` and `pending_approval` are editable / deletable
- `approved` and `disbursed` are LOCKED — no edits
- GET /payroll/ auto-creates a draft for current month if none exists

### PaySlip FK Strategy
| Employee | `faculty` field | `user_id` field | Sessions field |
|---|---|---|---|
| Faculty | UUID | UUID | > 0 |
| Non-faculty staff | null | UUID | 0 |

Display `faculty_name` for both types (backend falls back to user.name for staff).

### Month / Year Dropdowns (always dropdowns, never date inputs)
```ts
const MONTHS = [
  {v:1,l:"January"},{v:2,l:"February"},{v:3,l:"March"},{v:4,l:"April"},
  {v:5,l:"May"},{v:6,l:"June"},{v:7,l:"July"},{v:8,l:"August"},
  {v:9,l:"September"},{v:10,l:"October"},{v:11,l:"November"},{v:12,l:"December"},
];
const YEARS = [2024,2025,2026,2027].map(y => ({v:y,l:String(y)}));
```

### Approve / Disburse Buttons — show based on status + role
```ts
const canApprove  = ["super_admin","branch_manager"].includes(role);
const canDisburse = ["super_admin","accountant"].includes(role);
// Show Approve button only when run.status === "pending_approval" && canApprove
// Show Disburse button only when run.status === "approved" && canDisburse
// Show Submit-for-Review when run.status === "draft" && canApprove (PATCH status to pending_approval)
// Show Delete only when ["draft","pending_approval"].includes(run.status) && isAdmin
```

---

## FILE 1 — ADD to `src/redux/actions/index.ts`

```ts
export const payrollActions = {
  GET_RUNS:             "GET_PAYROLL_RUNS",
  GET_RUN_DETAIL:       "GET_PAYROLL_RUN_DETAIL",
  GENERATE_PAYROLL:     "GENERATE_PAYROLL",
  UPDATE_RUN:           "UPDATE_PAYROLL_RUN",
  DELETE_RUN:           "DELETE_PAYROLL_RUN",
  APPROVE_RUN:          "APPROVE_PAYROLL_RUN",
  DISBURSE_RUN:         "DISBURSE_PAYROLL_RUN",

  GET_PAYSLIPS:         "GET_PAYSLIPS",
  ADJUST_PAYSLIP:       "ADJUST_PAYSLIP",

  GET_MY_PAYROLL:       "GET_MY_PAYROLL",

  GET_SALARY_PREVIEW:   "GET_SALARY_PREVIEW",
  GET_FACULTY_PAYSLIPS: "GET_FACULTY_PAYSLIPS",

  GET_LATE_POLICY:      "GET_PAYROLL_LATE_POLICY",
  CREATE_LATE_POLICY:   "CREATE_PAYROLL_LATE_POLICY",
  UPDATE_LATE_POLICY:   "UPDATE_PAYROLL_LATE_POLICY",
  DELETE_LATE_POLICY:   "DELETE_PAYROLL_LATE_POLICY",

  GET_EXTRA_HOURS:      "GET_EXTRA_HOURS",
  UPDATE_EXTRA_HOUR:    "UPDATE_EXTRA_HOUR",
} as const;
```

---

## FILE 2 — ADD to `src/service/api.ts`

```ts
PAYROLL: {
  RUNS:               "/api/v1/payroll/",
  RUN_DETAIL:         (id: string) => `/api/v1/payroll/${id}/`,
  APPROVE:            (id: string) => `/api/v1/payroll/${id}/approve/`,
  DISBURSE:           (id: string) => `/api/v1/payroll/${id}/disburse/`,
  PAYSLIPS:           (runId: string) => `/api/v1/payroll/${runId}/payslips/`,
  PAYSLIP_DETAIL:     (runId: string, slipId: string) => `/api/v1/payroll/${runId}/payslips/${slipId}/`,
  MY:                 "/api/v1/payroll/my/",
  LATE_POLICY:        "/api/v1/payroll/late-policy/",
  LATE_POLICY_DETAIL: (id: string) => `/api/v1/payroll/late-policy/${id}/`,
  EXTRA_HOURS:        "/api/v1/payroll/extra-hours/",
  EXTRA_HOUR_DETAIL:  (id: string) => `/api/v1/payroll/extra-hours/${id}/`,
  FACULTY_PAYSLIPS:   (fId: string) => `/api/v1/faculty/${fId}/payslips/`,
  FACULTY_PREVIEW:    (fId: string) => `/api/v1/faculty/${fId}/salary-preview/`,
},
```

---

## FILE 3 — CREATE `src/redux/slices/payrollSlice.ts`

```ts
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
  bonus: number;
  other_deductions?: number;
  deduction_note?: string;
  net_salary: number;
  sessions_conducted: number;
  is_disbursed: boolean;
  late_logs?: any[];
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
```

---

## FILE 4 — CREATE `src/saga/payrollSaga.ts`

```ts
import { takeLatest } from "redux-saga/effects";
import { payrollActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchPayrollSaga() {
  yield takeLatest(payrollActions.GET_RUNS,             genericSaga);
  yield takeLatest(payrollActions.GET_RUN_DETAIL,       genericSaga);
  yield takeLatest(payrollActions.GENERATE_PAYROLL,     genericSaga);
  yield takeLatest(payrollActions.UPDATE_RUN,           genericSaga);
  yield takeLatest(payrollActions.DELETE_RUN,           genericSaga);
  yield takeLatest(payrollActions.APPROVE_RUN,          genericSaga);
  yield takeLatest(payrollActions.DISBURSE_RUN,         genericSaga);
  yield takeLatest(payrollActions.GET_PAYSLIPS,         genericSaga);
  yield takeLatest(payrollActions.ADJUST_PAYSLIP,       genericSaga);
  yield takeLatest(payrollActions.GET_MY_PAYROLL,       genericSaga);
  yield takeLatest(payrollActions.GET_SALARY_PREVIEW,   genericSaga);
  yield takeLatest(payrollActions.GET_FACULTY_PAYSLIPS, genericSaga);
  yield takeLatest(payrollActions.GET_LATE_POLICY,      genericSaga);
  yield takeLatest(payrollActions.CREATE_LATE_POLICY,   genericSaga);
  yield takeLatest(payrollActions.UPDATE_LATE_POLICY,   genericSaga);
  yield takeLatest(payrollActions.DELETE_LATE_POLICY,   genericSaga);
  yield takeLatest(payrollActions.GET_EXTRA_HOURS,      genericSaga);
  yield takeLatest(payrollActions.UPDATE_EXTRA_HOUR,    genericSaga);
}
```

Register in root saga and store:
```ts
import { watchPayrollSaga } from "@/saga/payrollSaga";
yield fork(watchPayrollSaga);

// store combineReducers
import payrollReducer from "@/redux/slices/payrollSlice";
payroll: payrollReducer,
```

---

## FILE 5 — CREATE `src/pages/payroll/components/PayslipAdjustSheet.tsx`

```tsx
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { updatePayslipInList } from "@/redux/slices/payrollSlice";
import type { PaySlip } from "@/redux/slices/payrollSlice";
import type { AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { DollarSign, Clock, TrendingDown, TrendingUp } from "lucide-react";

interface PayslipAdjustSheetProps {
  open:      boolean;
  onClose:   () => void;
  payslip:   PaySlip | null;
  runId:     string;
}

export default function PayslipAdjustSheet({ open, onClose, payslip, runId }: PayslipAdjustSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ bonus: "", other_deductions: "", deduction_note: "" });

  useEffect(() => {
    if (payslip) {
      setForm({
        bonus:            String(payslip.bonus ?? ""),
        other_deductions: String(payslip.other_deductions ?? ""),
        deduction_note:   payslip.deduction_note ?? "",
      });
    }
  }, [payslip]);

  const handleSave = () => {
    if (!payslip) return;
    dispatch({
      type: payrollActions.ADJUST_PAYSLIP,
      method: "PATCH",
      endPoint: API.PAYROLL.PAYSLIP_DETAIL(runId, payslip.id),
      body: {
        bonus:            Number(form.bonus) || 0,
        other_deductions: Number(form.other_deductions) || 0,
        deduction_note:   form.deduction_note,
      },
      auth: true,
      setLoading: (v: boolean) => setLoading(v),
      getResponse: (res: any) => {
        const updated = res?.data ?? res;
        if (updated?.id) {
          dispatch(updatePayslipInList(updated));
          toast.success("Payslip adjusted successfully.");
          onClose();
        } else {
          toast.error("Unexpected response.");
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to adjust payslip"),
    });
  };

  const isFaculty = !!payslip?.faculty;

  const SummaryRow = ({ label, value, color = "" }: { label: string; value: string | number; color?: string }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold font-mono ${color}`}>
        ₹{Number(value ?? 0).toLocaleString("en-IN")}
      </span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Adjust Payslip</SheetTitle>
          {payslip && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {payslip.faculty_name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{payslip.faculty_name}</div>
                <div className="text-xs text-muted-foreground font-mono">{payslip.employee_id}</div>
              </div>
              <Badge className={`ml-auto text-xs ${isFaculty ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                {isFaculty ? "Faculty" : "Staff"}
              </Badge>
            </div>
          )}
        </SheetHeader>

        {payslip && (
          <div className="space-y-5">
            {/* Current Payslip Summary */}
            <div className="bg-muted/30 rounded-xl border border-border p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Current Breakdown</div>
              <SummaryRow label="Basic Salary"       value={payslip.basic_salary} />
              {isFaculty && <SummaryRow label="Hour-based Amount" value={payslip.hour_based_amount} color="text-green-600" />}
              <SummaryRow label="Bonus"              value={payslip.bonus} color="text-green-600" />
              <SummaryRow label="Late Penalty"       value={payslip.late_penalty} color="text-red-600" />
              <SummaryRow label="Leave Deductions"   value={payslip.leave_deductions} color="text-red-600" />
              {payslip.absence_deductions !== undefined && (
                <SummaryRow label="Absence Deductions" value={payslip.absence_deductions} color="text-red-600" />
              )}
              {payslip.other_deductions !== undefined && (
                <SummaryRow label="Other Deductions"   value={payslip.other_deductions} color="text-red-600" />
              )}
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Net Salary</span>
                <span className="text-lg font-bold text-primary font-mono">
                  ₹{Number(payslip.net_salary ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
              {isFaculty && payslip.sessions_conducted > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {payslip.sessions_conducted} session(s) conducted
                </div>
              )}
            </div>

            {/* Adjustment Fields */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adjustments</div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" /> Bonus (₹)
                </Label>
                <Input
                  type="number"
                  value={form.bonus}
                  onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))}
                  placeholder="0"
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-500" /> Other Deductions (₹)
                </Label>
                <Input
                  type="number"
                  value={form.other_deductions}
                  onChange={e => setForm(f => ({ ...f, other_deductions: e.target.value }))}
                  placeholder="0"
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Deduction / Adjustment Note</Label>
                <Textarea
                  value={form.deduction_note}
                  onChange={e => setForm(f => ({ ...f, deduction_note: e.target.value }))}
                  placeholder="e.g. Adjusted for special project, performance bonus..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              {/* Preview recalculated net */}
              {(form.bonus || form.other_deductions) && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-xs text-primary font-medium">Estimated new net salary</span>
                  <span className="text-sm font-bold text-primary font-mono">
                    ₹{Math.max(0,
                      payslip.net_salary
                      + (Number(form.bonus) || 0)
                      - (Number(form.other_deductions) || 0)
                      - (payslip.bonus || 0)
                      - (payslip.other_deductions || 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <SheetFooter className="mt-6 flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !payslip}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? "Saving…" : "Save Adjustment"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

---

## FILE 6 — CREATE `src/pages/payroll/tabs/MyPayrollTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, FileText } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setMyPayroll, setMyPayrollLoading } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const MONTHS = [
  {v:"",l:"All Months"},{v:"1",l:"January"},{v:"2",l:"February"},
  {v:"3",l:"March"},{v:"4",l:"April"},{v:"5",l:"May"},{v:"6",l:"June"},
  {v:"7",l:"July"},{v:"8",l:"August"},{v:"9",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS  = [
  {v:"",l:"All Years"},{v:"2024",l:"2024"},{v:"2025",l:"2025"},
  {v:"2026",l:"2026"},{v:"2027",l:"2027"},
];
const STATUSES = [
  {v:"",l:"All Statuses"},{v:"draft",l:"Draft"},
  {v:"pending_approval",l:"Pending Approval"},{v:"approved",l:"Approved"},
  {v:"disbursed",l:"Disbursed"},
];

const STATUS_BADGE: Record<string, string> = {
  draft:            "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved:         "bg-green-100 text-green-700",
  disbursed:        "bg-blue-100 text-blue-700",
};

export default function MyPayrollTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { myPayroll, myPayrollLoading } = useSelector((s: RootState) => s.payroll);

  const [month,  setMonth]  = useState("");
  const [year,   setYear]   = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState("");

  const fetch = () => {
    const p = new URLSearchParams();
    if (month)  p.set("month",  month);
    if (year)   p.set("year",   year);
    if (status) p.set("status", status);
    dispatch({
      type: payrollActions.GET_MY_PAYROLL,
      method: "GET",
      endPoint: `${API.PAYROLL.MY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setMyPayrollLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setMyPayroll(res));
        else toast.error("Failed to load payroll history.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading payroll"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const summary = myPayroll?.summary;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-sm w-32"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
      </div>

      {myPayrollLoading ? <TableSkeleton columns={5} rows={4} className="mt-0" /> : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Payslips",    value: summary.total_payslips, icon: FileText, cls: "bg-blue-50 text-blue-600" },
                { label: "Total Net Earned",  value: `₹${Number(summary.total_net_earned ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, cls: "bg-green-50 text-green-600" },
                { label: "Total Disbursed",   value: `₹${Number(summary.total_disbursed ?? 0).toLocaleString("en-IN")}`, icon: Wallet,    cls: "bg-primary/10 text-primary" },
              ].map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.cls}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{card.value}</div>
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Employee Info */}
          {myPayroll?.employee && (
            <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {myPayroll.employee.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-foreground">{myPayroll.employee.name}</div>
                <div className="text-xs text-muted-foreground">{myPayroll.employee.employee_id} · {myPayroll.employee.email}</div>
              </div>
              <Badge className="ml-auto text-xs capitalize bg-muted text-muted-foreground">
                {myPayroll.employee.role?.replace(/_/g, " ")}
              </Badge>
            </div>
          )}

          {/* Payslips Table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{["Month / Year", "Basic", "Bonus", "Deductions", "Net Salary", "Sessions", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {!myPayroll?.payslips?.length ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No payslip records found.</td></tr>
                ) : myPayroll.payslips.map((slip, i) => (
                  <motion.tr key={slip.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{slip.employee_id}</td>
                    <td className="px-4 py-3 font-mono text-xs">₹{Number(slip.basic_salary).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-600">₹{Number(slip.bonus || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-red-600">
                      ₹{(Number(slip.late_penalty || 0) + Number(slip.leave_deductions || 0) + Number(slip.other_deductions || 0)).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-primary">₹{Number(slip.net_salary).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs">{slip.sessions_conducted}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${slip.is_disbursed ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {slip.is_disbursed ? "Disbursed" : "Pending"}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## FILE 7 — CREATE `src/pages/payroll/tabs/SalaryPreviewTab.tsx`

```tsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setPreview, setPreviewLoading } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  {v:"1",l:"January"},{v:"2",l:"February"},{v:"3",l:"March"},{v:"4",l:"April"},
  {v:"5",l:"May"},{v:"6",l:"June"},{v:"7",l:"July"},{v:"8",l:"August"},
  {v:"9",l:"September"},{v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS = [{v:"2024",l:"2024"},{v:"2025",l:"2025"},{v:"2026",l:"2026"},{v:"2027",l:"2027"}];

export default function SalaryPreviewTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { preview, previewLoading } = useSelector((s: RootState) => s.payroll);

  const d = new Date();
  const [month, setMonth] = useState(String(d.getMonth() + 1));
  const [year,  setYear]  = useState(String(d.getFullYear()));

  // Faculty ID from auth — verify this matches your user object's faculty UUID field
  const facultyId = (user as any)?.faculty_id ?? user?.id ?? "";

  const fetchPreview = () => {
    if (!facultyId) { toast.error("Faculty ID not found in your profile."); return; }
    dispatch({
      type: payrollActions.GET_SALARY_PREVIEW,
      method: "GET",
      endPoint: `${API.PAYROLL.FACULTY_PREVIEW(facultyId)}?month=${month}&year=${year}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setPreviewLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setPreview(res.data));
        else toast.error("Failed to load salary preview.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading preview"),
    });
  };

  const p = preview?.payslip_preview;

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-sm w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={fetchPreview} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Eye className="w-4 h-4" /> Preview Salary
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
        ⚠ This is an <strong>estimate only</strong> — final salary is calculated after payroll is approved and disbursed.
      </div>

      {previewLoading ? <TableSkeleton columns={2} rows={4} className="mt-0" /> : p ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Estimated Net — hero card */}
          <div className="bg-white rounded-xl border border-border p-6 text-center">
            <div className="text-xs text-muted-foreground mb-1">Estimated Net Salary</div>
            <div className="text-4xl font-bold text-primary">
              ₹{Number(p.estimated_net ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {MONTHS.find(m => m.v === month)?.l} {year}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Breakdown</div>
            {[
              { label: "Basic Salary",            value: p.basic_salary,             icon: TrendingUp, color: "text-foreground" },
              { label: "Expected Hours Amount",   value: p.expected_hours_amount,    icon: Clock,      color: "text-green-600" },
              { label: "Late Penalty (estimate)", value: p.late_penalty_estimate,    icon: TrendingDown, color: "text-red-600" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <row.icon className={`w-3.5 h-3.5 ${row.color}`} />
                  {row.label}
                </div>
                <span className={`text-sm font-semibold font-mono ${row.color}`}>
                  ₹{Number(row.value ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
```

---

## FILE 8 — CREATE `src/pages/payroll/tabs/PayrollRunsTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Eye, CheckCircle2, Send, Trash2, RefreshCw } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setRuns, setRunsLoading, addRun,
  updateRunInList, removeRun, setSelectedRun,
} from "@/redux/slices/payrollSlice";
import type { PayrollRun } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const MONTHS = [
  {v:"",l:"All Months"},{v:"1",l:"January"},{v:"2",l:"February"},
  {v:"3",l:"March"},{v:"4",l:"April"},{v:"5",l:"May"},{v:"6",l:"June"},
  {v:"7",l:"July"},{v:"8",l:"August"},{v:"9",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS = [
  {v:"",l:"All Years"},{v:"2024",l:"2024"},{v:"2025",l:"2025"},
  {v:"2026",l:"2026"},{v:"2027",l:"2027"},
];
const MONTH_NUMS = MONTHS.slice(1); // no "All" for generate
const YEAR_NUMS  = YEARS.slice(1);

const STATUS_BADGE: Record<string, string> = {
  draft:            "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved:         "bg-green-100 text-green-700",
  disbursed:        "bg-blue-100 text-blue-700",
};

const MONTH_NAMES: Record<string, string> = {
  "1":"Jan","2":"Feb","3":"Mar","4":"Apr","5":"May","6":"Jun",
  "7":"Jul","8":"Aug","9":"Sep","10":"Oct","11":"Nov","12":"Dec",
};

interface PayrollRunsTabProps {
  branches:       { id: string; name: string }[];
  onViewPayslips: (run: PayrollRun) => void;
}

export default function PayrollRunsTab({ branches, onViewPayslips }: PayrollRunsTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { runs, runsLoading } = useSelector((s: RootState) => s.payroll);

  const role = user?.role ?? "";
  const isAdmin    = ["super_admin","branch_manager"].includes(role);
  const canApprove = ["super_admin","branch_manager"].includes(role);
  const canDisburse= ["super_admin","accountant"].includes(role);
  const canGenerate= ["super_admin","branch_manager"].includes(role);
  const canDelete  = ["super_admin","branch_manager"].includes(role);

  // Filter state
  const d = new Date();
  const [fMonth,    setFMonth]    = useState("");
  const [fYear,     setFYear]     = useState(String(d.getFullYear()));
  const [fStatus,   setFStatus]   = useState("");
  const [fBranch,   setFBranch]   = useState("");

  // Generate form state
  const [genMonth,  setGenMonth]  = useState(String(d.getMonth() + 1));
  const [genYear,   setGenYear]   = useState(String(d.getFullYear()));
  const [genBranch, setGenBranch] = useState(branches[0]?.id ?? "");
  const [genLoading, setGenLoading] = useState(false);

  // Action state
  const [actionTarget, setActionTarget] = useState<{ run: PayrollRun; type: "approve"|"disburse"|"delete"|"submit" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRuns = () => {
    const p = new URLSearchParams();
    if (fMonth)  p.set("month",     fMonth);
    if (fYear)   p.set("year",      fYear);
    if (fStatus) p.set("status",    fStatus);
    if (fBranch) p.set("branch_id", fBranch);
    dispatch({
      type: payrollActions.GET_RUNS,
      method: "GET",
      endPoint: `${API.PAYROLL.RUNS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setRunsLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        dispatch(setRuns(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load payroll runs"),
    });
  };

  useEffect(() => { fetchRuns(); }, []);

  const handleGenerate = () => {
    if (!genBranch) { toast.error("Please select a branch."); return; }
    dispatch({
      type: payrollActions.GENERATE_PAYROLL,
      method: "POST",
      endPoint: API.PAYROLL.RUNS,
      body: { branch_id: genBranch, month: Number(genMonth), year: Number(genYear) },
      auth: true,
      setLoading: (v: boolean) => setGenLoading(v),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Payroll generated.");
          fetchRuns();
        } else toast.error("Failed to generate payroll.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to generate payroll"),
    });
  };

  const executeAction = () => {
    if (!actionTarget) return;
    const { run, type } = actionTarget;

    const actionMap = {
      approve:  { actionType: payrollActions.APPROVE_RUN,  method: "POST" as const,  endPoint: API.PAYROLL.APPROVE(run.id),  successMsg: "Payroll approved." },
      disburse: { actionType: payrollActions.DISBURSE_RUN, method: "POST" as const,  endPoint: API.PAYROLL.DISBURSE(run.id), successMsg: "Payroll disbursed." },
      submit:   { actionType: payrollActions.UPDATE_RUN,   method: "PATCH" as const, endPoint: API.PAYROLL.RUN_DETAIL(run.id), successMsg: "Submitted for approval." },
      delete:   { actionType: payrollActions.DELETE_RUN,   method: "DELETE" as const,endPoint: API.PAYROLL.RUN_DETAIL(run.id), successMsg: "Payroll run deleted." },
    };

    const cfg = actionMap[type];

    dispatch({
      type: cfg.actionType,
      method: cfg.method,
      endPoint: cfg.endPoint,
      body: type === "submit" ? { status: "pending_approval" } : undefined,
      auth: true,
      setLoading: (v: boolean) => setActionLoading(v),
      getResponse: (res: any) => {
        toast.success(cfg.successMsg);
        setActionTarget(null);
        if (type === "delete") dispatch(removeRun(run.id));
        else fetchRuns();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to ${type}.`);
        setActionTarget(null);
      },
    });
  };

  const confirmMessages: Record<string, { title: string; desc: string; label: string; variant?: "danger" }> = {
    approve:  { title: "Approve Payroll Run?", desc: "This will lock the payroll and notify employees.", label: "Approve" },
    disburse: { title: "Disburse Payroll?",    desc: "This is final. All employees will receive salary notifications.", label: "Disburse" },
    submit:   { title: "Submit for Approval?", desc: "The payroll run will be sent to the branch manager for review.", label: "Submit" },
    delete:   { title: "Delete Payroll Run?",  desc: "This is irreversible. All payslip data will be removed.", label: "Delete", variant: "danger" },
  };

  return (
    <div className="space-y-5">
      {/* Generate Panel */}
      {canGenerate && (
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Generate New Payroll Run</div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Branch <span className="text-red-500">*</span></Label>
              <Select value={genBranch} onValueChange={setGenBranch}>
                <SelectTrigger className="h-9 text-sm w-48"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select value={genMonth} onValueChange={setGenMonth}>
                <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTH_NUMS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select value={genYear} onValueChange={setGenYear}>
                <SelectTrigger className="h-9 text-sm w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{YEAR_NUMS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={genLoading || !genBranch}
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
              <Plus className="w-4 h-4" />
              {genLoading ? "Generating…" : "Generate Payroll"}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={fMonth} onValueChange={setFMonth}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={fYear} onValueChange={setFYear}>
            <SelectTrigger className="h-9 text-sm w-28"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select value={fBranch} onValueChange={setFBranch}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Branches</SelectItem>
              {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchRuns} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Runs Table */}
      {runsLoading ? <TableSkeleton columns={6} rows={5} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Payroll Runs</span>
            <span className="text-xs text-muted-foreground">{runs.length} run(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-muted/40">
                <tr>{["Period", "Branch", "Employees", "Total Amount", "Status", "Generated", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-14 text-muted-foreground text-sm">No payroll runs found.</td></tr>
                ) : runs.map((run, i) => (
                  <motion.tr key={run.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {MONTH_NAMES[String(run.month)] ?? run.month} {run.year}
                    </td>
                    <td className="px-4 py-3 text-xs">{run.branch_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{run.employee_count} employees</td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                      ₹{Number(run.total_amount ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs capitalize ${STATUS_BADGE[run.status] ?? ""}`}>
                        {run.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(run.generated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* View Payslips */}
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2"
                          onClick={() => { dispatch(setSelectedRun(run)); onViewPayslips(run); }}>
                          <Eye className="w-3 h-3" /> Payslips
                        </Button>

                        {/* Submit for Review (draft → pending_approval) */}
                        {run.status === "draft" && canApprove && (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                            onClick={() => setActionTarget({ run, type: "submit" })}>
                            Submit
                          </Button>
                        )}

                        {/* Approve */}
                        {run.status === "pending_approval" && canApprove && (
                          <Button size="sm" className="h-7 text-xs gap-1 px-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setActionTarget({ run, type: "approve" })}>
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </Button>
                        )}

                        {/* Disburse */}
                        {run.status === "approved" && canDisburse && (
                          <Button size="sm" className="h-7 text-xs gap-1 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setActionTarget({ run, type: "disburse" })}>
                            <Send className="w-3 h-3" /> Disburse
                          </Button>
                        )}

                        {/* Delete */}
                        {["draft","pending_approval"].includes(run.status) && canDelete && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => setActionTarget({ run, type: "delete" })}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {actionTarget && (
        <ConfirmDialog
          open={!!actionTarget}
          onOpenChange={o => !o && setActionTarget(null)}
          title={confirmMessages[actionTarget.type].title}
          description={confirmMessages[actionTarget.type].desc}
          confirmLabel={actionLoading ? "Processing…" : confirmMessages[actionTarget.type].label}
          variant={confirmMessages[actionTarget.type].variant}
          onConfirm={executeAction}
        />
      )}
    </div>
  );
}
```

---

## FILE 9 — CREATE `src/pages/payroll/tabs/PayslipsTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Sliders, CheckCircle2, Send, Users } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setPayslips, setPayslipsLoading } from "@/redux/slices/payrollSlice";
import type { PaySlip, PayrollRun } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PayslipAdjustSheet from "../components/PayslipAdjustSheet";

const STATUS_BADGE: Record<string, string> = {
  draft:            "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved:         "bg-green-100 text-green-700",
  disbursed:        "bg-blue-100 text-blue-700",
};

const MONTH_NAMES: Record<number, string> = {
  1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",
  7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec",
};

export default function PayslipsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { payslips, payslipsLoading, selectedRun } = useSelector((s: RootState) => s.payroll);

  const [typeFilter, setTypeFilter]       = useState("all");
  const [adjustTarget, setAdjustTarget]   = useState<PaySlip | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const role = user?.role ?? "";
  const canApprove  = ["super_admin","branch_manager"].includes(role);
  const canDisburse = ["super_admin","accountant"].includes(role);
  const canAdjust   = ["super_admin","branch_manager","accountant"].includes(role);

  useEffect(() => {
    if (!selectedRun) return;
    dispatch({
      type: payrollActions.GET_PAYSLIPS,
      method: "GET",
      endPoint: API.PAYROLL.PAYSLIPS(selectedRun.id),
      auth: true,
      setLoading: (v: boolean) => dispatch(setPayslipsLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        dispatch(setPayslips(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load payslips"),
    });
  }, [selectedRun]);

  const triggerAction = (type: "approve" | "disburse") => {
    if (!selectedRun) return;
    const cfg = {
      approve:  { actionType: payrollActions.APPROVE_RUN,  endPoint: API.PAYROLL.APPROVE(selectedRun.id),  msg: "Payroll approved." },
      disburse: { actionType: payrollActions.DISBURSE_RUN, endPoint: API.PAYROLL.DISBURSE(selectedRun.id), msg: "Payroll disbursed." },
    }[type];

    dispatch({
      type: cfg.actionType,
      method: "POST",
      endPoint: cfg.endPoint,
      auth: true,
      setLoading: (v: boolean) => setActionLoading(v),
      getResponse: () => { toast.success(cfg.msg); },
      getError: (err: any) => toast.error(err?.response?.data?.message || `Failed to ${type}`),
    });
  };

  const filtered = payslips.filter(s => {
    if (typeFilter === "faculty") return !!s.faculty;
    if (typeFilter === "staff")   return !s.faculty;
    return true;
  });

  if (!selectedRun) {
    return (
      <div className="bg-white rounded-xl border border-border py-16 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Select a payroll run from the Payroll Runs tab to view payslips.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Run Summary + Action Buttons */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[selectedRun.month]} {selectedRun.year}
            </span>
            <Badge className={`text-xs capitalize ${STATUS_BADGE[selectedRun.status] ?? ""}`}>
              {selectedRun.status.replace(/_/g, " ")}
            </Badge>
            {selectedRun.branch_name && (
              <span className="text-xs text-muted-foreground">· {selectedRun.branch_name}</span>
            )}
          </div>
          <div className="flex gap-4 mt-1.5">
            <span className="text-xs text-muted-foreground">{selectedRun.employee_count} employees</span>
            <span className="text-xs font-semibold text-primary">
              Total: ₹{Number(selectedRun.total_amount ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {selectedRun.status === "pending_approval" && canApprove && (
            <Button size="sm" disabled={actionLoading}
              className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => triggerAction("approve")}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionLoading ? "Approving…" : "Approve Run"}
            </Button>
          )}
          {selectedRun.status === "approved" && canDisburse && (
            <Button size="sm" disabled={actionLoading}
              className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => triggerAction("disburse")}>
              <Send className="w-3.5 h-3.5" />
              {actionLoading ? "Disbursing…" : "Disburse"}
            </Button>
          )}
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground shrink-0">Show:</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            <SelectItem value="faculty">Faculty Only</SelectItem>
            <SelectItem value="staff">Staff Only</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} payslip(s)</span>
      </div>

      {payslipsLoading ? <TableSkeleton columns={7} rows={6} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40 border-b border-border">
                <tr>{["Employee", "Type", "Basic", "Hours", "Bonus", "Deductions", "Net Salary", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No payslips found.</td></tr>
                ) : filtered.map((slip, i) => (
                  <motion.tr key={slip.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground text-xs">{slip.faculty_name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{slip.employee_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] ${slip.faculty ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {slip.faculty ? "Faculty" : "Staff"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">₹{Number(slip.basic_salary).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-600">
                      {slip.hour_based_amount > 0 ? `₹${Number(slip.hour_based_amount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-green-600">
                      {slip.bonus > 0 ? `₹${Number(slip.bonus).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-red-600">
                      ₹{(Number(slip.late_penalty||0)+Number(slip.leave_deductions||0)+Number(slip.other_deductions||0)).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                      ₹{Number(slip.net_salary).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] ${slip.is_disbursed ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {slip.is_disbursed ? "Disbursed" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {canAdjust && !slip.is_disbursed && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2"
                          onClick={() => setAdjustTarget(slip)}>
                          <Sliders className="w-3 h-3" /> Adjust
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Sheet */}
      <PayslipAdjustSheet
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        payslip={adjustTarget}
        runId={selectedRun.id}
      />
    </div>
  );
}
```

---

## FILE 10 — CREATE `src/pages/payroll/tabs/ExtraHoursTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setExtraHours, setExtraHoursLoading, updateExtraHourInList } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MONTHS = [
  {v:"",l:"All Months"},{v:"1",l:"January"},{v:"2",l:"February"},
  {v:"3",l:"March"},{v:"4",l:"April"},{v:"5",l:"May"},{v:"6",l:"June"},
  {v:"7",l:"July"},{v:"8",l:"August"},{v:"9",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS = [{v:"",l:"All Years"},{v:"2024",l:"2024"},{v:"2025",l:"2025"},{v:"2026",l:"2026"},{v:"2027",l:"2027"}];

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ExtraHoursTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { extraHours, extraHoursLoading } = useSelector((s: RootState) => s.payroll);

  const d = new Date();
  const [month,  setMonth]  = useState(String(d.getMonth() + 1));
  const [year,   setYear]   = useState(String(d.getFullYear()));
  const [status, setStatus] = useState("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetch = () => {
    const p = new URLSearchParams();
    if (month)  p.set("month",  month);
    if (year)   p.set("year",   year);
    if (status) p.set("status", status);
    dispatch({
      type: payrollActions.GET_EXTRA_HOURS,
      method: "GET",
      endPoint: `${API.PAYROLL.EXTRA_HOURS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setExtraHoursLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        dispatch(setExtraHours(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load extra hours"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = (id: string, newStatus: "approved" | "rejected") => {
    setActionId(id);
    dispatch({
      type: payrollActions.UPDATE_EXTRA_HOUR,
      method: "PATCH",
      endPoint: API.PAYROLL.EXTRA_HOUR_DETAIL(id),
      body: { status: newStatus },
      auth: true,
      getResponse: (res: any) => {
        const updated = res?.data ?? res;
        if (updated?.id) {
          dispatch(updateExtraHourInList(updated));
          toast.success(`Extra hours ${newStatus}.`);
        }
        setActionId(null);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update.");
        setActionId(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800 flex items-start gap-2">
        <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Extra hours are <strong>auto-detected</strong> when faculty teaching time exceeds chapter allocation.
        Approving triggers a payslip recalculation on the next compute.
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-sm w-28"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
      </div>

      {extraHoursLoading ? <TableSkeleton columns={5} rows={5} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Faculty", "Period", "Extra Hours", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {extraHours.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-14 text-muted-foreground text-sm">No extra hour records found.</td></tr>
              ) : extraHours.map((eh, i) => (
                <motion.tr key={eh.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-sm">{eh.faculty_name ?? "—"}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{eh.faculty}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{eh.month} / {eh.year}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-600">
                      <Clock className="w-3.5 h-3.5" />{eh.extra_hours}h
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${STATUS_BADGE[eh.status] ?? ""}`}>{eh.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {eh.status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs gap-1 px-2 bg-green-600 hover:bg-green-700 text-white"
                          disabled={actionId === eh.id}
                          onClick={() => handleAction(eh.id, "approved")}>
                          <CheckCircle2 className="w-3 h-3" />
                          {actionId === eh.id ? "…" : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2 border-red-300 text-red-600 hover:bg-red-50"
                          disabled={actionId === eh.id}
                          onClick={() => handleAction(eh.id, "rejected")}>
                          <XCircle className="w-3 h-3" />
                          {actionId === eh.id ? "…" : "Reject"}
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
    </div>
  );
}
```

---

## FILE 11 — CREATE `src/pages/payroll/tabs/LatePolicyTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setLatePolicies, setLatePoliciesLoading,
  addLatePolicy, updateLatePolicyInList, removeLatePolicy,
} from "@/redux/slices/payrollSlice";
import type { LatePolicy } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface LatePolicyTabProps {
  branches: { id: string; name: string }[];
}

const blank = () => ({
  branch:                    "",
  grace_period_minutes:      "10",
  deduction_per_minute:      "50",
  max_deduction_per_session: "1000",
  auto_halfday_deduction:    false,
  is_active:                 true,
});

export default function LatePolicyTab({ branches }: LatePolicyTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { latePolicies, latePoliciesLoading } = useSelector((s: RootState) => s.payroll);

  const [formOpen,     setFormOpen]     = useState(false);
  const [editing,      setEditing]      = useState<LatePolicy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LatePolicy | null>(null);
  const [formLoading,  setFormLoading]  = useState(false);
  const [form,         setForm]         = useState(blank());

  useEffect(() => {
    dispatch({
      type: payrollActions.GET_LATE_POLICY,
      method: "GET",
      endPoint: API.PAYROLL.LATE_POLICY,
      auth: true,
      setLoading: (v: boolean) => dispatch(setLatePoliciesLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        dispatch(setLatePolicies(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load policies"),
    });
  }, []);

  const openCreate = () => { setEditing(null); setForm(blank()); setFormOpen(true); };
  const openEdit   = (p: LatePolicy) => {
    setEditing(p);
    setForm({
      branch:                    p.branch,
      grace_period_minutes:      String(p.grace_period_minutes),
      deduction_per_minute:      String(p.deduction_per_minute),
      max_deduction_per_session: String(p.max_deduction_per_session),
      auto_halfday_deduction:    p.auto_halfday_deduction,
      is_active:                 p.is_active,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    const isEdit = !!editing;
    const body = {
      branch_id:                 form.branch,
      grace_period_minutes:      Number(form.grace_period_minutes),
      deduction_per_minute:      Number(form.deduction_per_minute),
      max_deduction_per_session: Number(form.max_deduction_per_session),
      auto_halfday_deduction:    form.auto_halfday_deduction,
      is_active:                 form.is_active,
    };
    dispatch({
      type: isEdit ? payrollActions.UPDATE_LATE_POLICY : payrollActions.CREATE_LATE_POLICY,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.PAYROLL.LATE_POLICY_DETAIL(editing!.id) : API.PAYROLL.LATE_POLICY,
      body,
      auth: true,
      setLoading: (v: boolean) => setFormLoading(v),
      getResponse: (res: any) => {
        const data = res?.data ?? res;
        if (data?.id) {
          if (isEdit) { dispatch(updateLatePolicyInList(data)); toast.success("Policy updated."); }
          else        { dispatch(addLatePolicy(data));          toast.success("Policy created."); }
          setFormOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save policy"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: payrollActions.DELETE_LATE_POLICY,
      method: "DELETE",
      endPoint: API.PAYROLL.LATE_POLICY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeLatePolicy(deleteTarget.id)); toast.success("Policy deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete policy"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{latePolicies.length} policy(ies)</span>
        <Button onClick={openCreate} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Policy
        </Button>
      </div>

      {latePoliciesLoading ? <TableSkeleton columns={5} rows={4} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Branch", "Grace (min)", "Deduction/min (₹)", "Max/session (₹)", "Auto Half-day", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {latePolicies.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No late policies configured.</td></tr>
              ) : latePolicies.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{p.branch_name ?? p.branch}</td>
                  <td className="px-4 py-3 font-mono text-sm">{p.grace_period_minutes} min</td>
                  <td className="px-4 py-3 font-mono text-sm">₹{p.deduction_per_minute}</td>
                  <td className="px-4 py-3 font-mono text-sm">₹{p.max_deduction_per_session}</td>
                  <td className="px-4 py-3">
                    <Badge className={p.auto_halfday_deduction ? "bg-orange-100 text-orange-700 text-xs" : "bg-gray-100 text-gray-600 text-xs"}>
                      {p.auto_halfday_deduction ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={p.is_active ? "bg-green-100 text-green-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={o => setFormOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Late Policy" : "Create Late Policy"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Branch <span className="text-red-500">*</span></Label>
              <Select value={form.branch} onValueChange={v => setForm(f => ({ ...f, branch: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {[
              { label: "Grace Period (minutes)", key: "grace_period_minutes" },
              { label: "Deduction per Minute (₹)", key: "deduction_per_minute" },
              { label: "Max Deduction per Session (₹)", key: "max_deduction_per_session" },
            ].map(field => (
              <div key={field.key} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                <Input type="number" value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="h-9 text-sm font-mono" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Checkbox id="auto_hd" checked={form.auto_halfday_deduction}
                onCheckedChange={v => setForm(f => ({ ...f, auto_halfday_deduction: !!v }))} />
              <label htmlFor="auto_hd" className="text-sm cursor-pointer">Auto Half-day Deduction</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: !!v }))} />
              <label htmlFor="is_active" className="text-sm cursor-pointer">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button onClick={handleSave} disabled={formLoading || !form.branch}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {formLoading ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete late policy for "${deleteTarget?.branch_name ?? deleteTarget?.branch}"?`}
        description="Late penalty rules for this branch will be removed."
        confirmLabel="Delete" variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 12 — CREATE `src/pages/payroll/PayrollPage.tsx` (REPLACE EXISTING STUB)

```tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { branchAction } from "@/redux/actions";
import { setSelectedRun, setPayslips } from "@/redux/slices/payrollSlice";
import type { PayrollRun } from "@/redux/slices/payrollSlice";
import type { AppDispatch } from "@/store";

// ── Tab Components ────────────────────────────────────────────────────────────
import MyPayrollTab      from "./tabs/MyPayrollTab";
import SalaryPreviewTab  from "./tabs/SalaryPreviewTab";
import PayrollRunsTab    from "./tabs/PayrollRunsTab";
import PayslipsTab       from "./tabs/PayslipsTab";
import ExtraHoursTab     from "./tabs/ExtraHoursTab";
import LatePolicyTab     from "./tabs/LatePolicyTab";

// ─── Role-based tab config ────────────────────────────────────────────────────
const getVisibleTabs = (role: string) =>
  [
    { value: "my_payroll",   label: "My Payroll",    visible: !["student","parent"].includes(role) },
    { value: "preview",      label: "Salary Preview", visible: role === "faculty" },
    { value: "runs",         label: "Payroll Runs",  visible: ["super_admin","branch_manager","accountant"].includes(role) },
    { value: "payslips",     label: "Payslips",      visible: ["super_admin","branch_manager","accountant"].includes(role) },
    { value: "extra_hours",  label: "Extra Hours",   visible: role === "super_admin" },
    { value: "late_policy",  label: "Late Policy",   visible: ["super_admin","branch_manager"].includes(role) },
  ].filter(t => t.visible);

type TabValue = "my_payroll" | "preview" | "runs" | "payslips" | "extra_hours" | "late_policy";

export default function PayrollPage() {
  const { setPageTitle } = useUI();
  const { user }         = useAuth();
  const dispatch         = useDispatch<AppDispatch>();

  const role        = user?.role ?? "faculty";
  const visibleTabs = getVisibleTabs(role);

  const [activeTab, setActiveTab] = useState<TabValue>(
    (visibleTabs[0]?.value as TabValue) ?? "my_payroll"
  );
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setPageTitle("Payroll");
  }, [setPageTitle]);

  // Fetch branches for use in Runs, PayslipAdjust, and LatePolicy tabs
  useEffect(() => {
    dispatch({
      type: branchAction.GET_BRANCH,
      method: "GET",
      endPoint: "/api/v1/branches/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setBranches(Array.isArray(data) ? data : (data?.results ?? []));
      },
      getError: () => {},
    });
  }, [dispatch]);

  // When viewing payslips for a run from PayrollRunsTab → switch to payslips tab
  const handleViewPayslips = (run: PayrollRun) => {
    dispatch(setSelectedRun(run));
    dispatch(setPayslips([]));
    setActiveTab("payslips");
  };

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Manage salary runs, payslips, and late entry policies."
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as TabValue)}
        >
          <TabsList className="mb-5 flex-wrap h-auto gap-1">
            {visibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {visibleTabs.some(t => t.value === "my_payroll") && (
            <TabsContent value="my_payroll" className="mt-0">
              <MyPayrollTab />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "preview") && (
            <TabsContent value="preview" className="mt-0">
              <SalaryPreviewTab />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "runs") && (
            <TabsContent value="runs" className="mt-0">
              <PayrollRunsTab
                branches={branches}
                onViewPayslips={handleViewPayslips}
              />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "payslips") && (
            <TabsContent value="payslips" className="mt-0">
              <PayslipsTab />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "extra_hours") && (
            <TabsContent value="extra_hours" className="mt-0">
              <ExtraHoursTab />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "late_policy") && (
            <TabsContent value="late_policy" className="mt-0">
              <LatePolicyTab branches={branches} />
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}
```

---

## CHECKLIST — Do after pasting all files

- [ ] Register `payrollReducer` in store: `payroll: payrollReducer`
- [ ] Register `watchPayrollSaga` in root saga: `yield fork(watchPayrollSaga)`
- [ ] Add `payrollActions` export to `src/redux/actions/index.ts`
- [ ] Add `API.PAYROLL` namespace to `src/service/api.ts`
- [ ] Add route in router: `<Route path="/payroll" element={<PayrollPage />} />`
- [ ] Add nav item for Payroll in your sidebar config
- [ ] **Verify faculty_id field**: In `SalaryPreviewTab`, the preview uses `user?.faculty_id ?? user?.id`. Check your `useAuth` user object and use the correct field that holds the faculty UUID
- [ ] **Verify branches endpoint**: `/api/v1/branches/` is used for branch fetch — confirm this matches your existing branch API path (check `branchAction.GET_BRANCH` usage in your project)
- [ ] **Sheet component**: Ensure `Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter` are available at `@/components/ui/sheet` — this is standard shadcn/ui

---

## NOTES FOR IDE AI — Read before writing any code

- **Do NOT install any new packages** — all imports are from existing dependencies
- **Do NOT use direct axios** — all HTTP via `dispatch({ type, method, endPoint, auth: true, ... })`
- **`PayslipAdjustSheet` uses `side="right"`** on `SheetContent` — this is the standard side-sheet pattern
- **Estimated net recalc in sheet** is client-side only (visual preview) — the real recalc happens server-side on PATCH
- **`PayrollRun.employee_count` includes BOTH faculty AND staff** — do not label it "faculty_count"
- **`GET /payroll/my/` auto-resolves** from auth token — no user ID needed in the request
- **`SalaryPreviewTab` is faculty-only** — check `user.role === "faculty"` before showing; the tab visibility config already handles this but double-check
- **Status transitions are strict**: never show Approve button on `draft` runs, never show Disburse on `pending_approval` runs
- **Month dropdowns use string values** (`"1"` to `"12"`) for Select compatibility — convert to Number before sending in API body: `month: Number(genMonth)`
- **`PayslipAdjustSheet` estimated net formula**: `currentNet + newBonus - newOtherDeductions - oldBonus - oldOtherDeductions` — this is a client-side estimate only
- **All currency displays use** `Number(val).toLocaleString("en-IN")` with ₹ prefix — Indian number format
- All Tailwind classes only — `bg-primary` = `#F7A900` per project theme config
