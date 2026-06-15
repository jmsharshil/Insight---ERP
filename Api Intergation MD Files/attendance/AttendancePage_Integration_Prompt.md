# AttendancePage.tsx — Full API Integration Prompt

> Copy this entire prompt and paste it into your IDE AI assistant (Cursor / GitHub Copilot Chat / Windsurf).
> It is self-contained — no extra context needed.

---

## CONTEXT

You are a senior React + TypeScript developer working inside an existing Vite + React 18 project called **insight-ems**.

### Tech Stack (from package.json — use ONLY these, no new installs)
- **State:** Redux Toolkit + Redux Saga (`genericSaga` pattern)
- **Routing:** react-router-dom v6
- **UI:** Radix UI primitives + shadcn/ui components (`@/components/ui/`)
- **Charts:** recharts
- **Animations:** framer-motion
- **Forms:** react-hook-form + zod
- **Icons:** lucide-react
- **Date:** date-fns
- **HTTP:** axios via `genericSaga`
- **Notifications:** `useToast` hook (project-internal, NOT sonner directly)
- **Skeletons:** react-loading-skeleton via `TableSkeleton` / `CardSkeleton` from `@/components/common/Skeletons`

### Project Conventions (mirror EXACTLY — do not deviate)

**API calls** always go through Redux Saga via `dispatch({ type, method, endPoint, auth: true, setLoading, getResponse, getError })`.  
**Auth token** is auto-injected by `genericSaga` when `auth: true`.  
**Base URL** comes from `import.meta.env.VITE_APP_BASE_URL`.  
**Imports:**
```ts
import { API } from "@/service/api";           // endpoint constants
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useUI } from "@/hooks/useUI";          // setPageTitle
import PageHeader from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
```

**Design tokens** live in `@/theme` — primary orange is `#F7A900`, surface is `#F4F5F5`, sidebar dark is `#2e3032`.  
Use Tailwind utility classes. For status badges: present → `bg-green-100 text-green-700`, absent → `bg-red-100 text-red-700`, late → `bg-yellow-100 text-yellow-700`.

---

## TASK

Create the complete **Attendance module** by generating the following files. Each file is fully working, typed, and copy-paste ready.

---

## FILE 1 — `src/redux/actions/index.ts` (ADD to existing exports, do not replace)

Add this export to the existing actions file:

```ts
export const attendanceActions = {
  GET_DASHBOARD:        "GET_ATTENDANCE_DASHBOARD",
  GET_STUDENTS:         "GET_ATTENDANCE_STUDENTS",
  GET_STUDENT_DETAIL:   "GET_ATTENDANCE_STUDENT_DETAIL",
  GET_HISTORY:          "GET_ATTENDANCE_HISTORY",
  GET_FACULTY:          "GET_ATTENDANCE_FACULTY",
  GET_FACULTY_DETAIL:   "GET_ATTENDANCE_FACULTY_DETAIL",
  GET_ANALYTICS:        "GET_ATTENDANCE_ANALYTICS",
  GET_DEFAULTERS:       "GET_ATTENDANCE_DEFAULTERS",
  GET_VIOLATIONS:       "GET_ATTENDANCE_VIOLATIONS",
  GET_BATCH_REGISTER:   "GET_ATTENDANCE_BATCH_REGISTER",
  EXPORT_CSV:           "EXPORT_ATTENDANCE_CSV",
} as const;
```

---

## FILE 2 — `src/service/api.ts` (ADD to existing API object, do not replace)

Add this namespace inside the existing `API` export object:

```ts
ATTENDANCE: {
  DASHBOARD:        "/api/v1/attendance/dashboard/",
  STUDENTS:         "/api/v1/attendance/students/",
  STUDENT_DETAIL:   (id: string) => `/api/v1/attendance/students/${id}/`,
  HISTORY:          "/api/v1/attendance/history/",
  FACULTY:          "/api/v1/attendance/faculty/",
  FACULTY_DETAIL:   (id: string) => `/api/v1/attendance/faculty/${id}/`,
  ANALYTICS:        "/api/v1/attendance/analytics/",
  DEFAULTERS:       "/api/v1/attendance/defaulters/",
  VIOLATIONS:       "/api/v1/attendance/violations/",
  BATCH_REGISTER:   (batchId: string) => `/api/v1/attendance/batches/${batchId}/register/`,
  EXPORT:           "/api/v1/attendance/export/",
},
```

---

## FILE 3 — `src/redux/slices/attendanceSlice.ts` (CREATE NEW)

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BranchWiseAttendance {
  branch_id: string;
  branch_name: string;
  percentage: number;
}

export interface DashboardData {
  total_students: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  attendance_percentage: number;
  active_violations: number;
  faculty_attendance_summary: { total_faculty: number; present: number; absent: number };
  branch_wise_attendance: BranchWiseAttendance[];
}

export interface StudentSummary {
  id: string;
  student_profile: {
    id: string;
    name: string;
    roll_number: string;
    admission_number: string;
    photo: string | null;
    branch_name: string;
    batch_name: string | null;
  };
  attendance_percentage: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  last_attendance_date: string | null;
}

export interface StudentDetail {
  student_profile: {
    id: string;
    name: string;
    roll_number: string;
    admission_number: string;
    branch_name: string;
    batch_name: string | null;
  };
  attendance_percentage: number;
  summary: { present_count: number; absent_count: number; late_count: number };
  check_in_history: { date: string; time: string; status: string }[];
  check_out_history: { date: string; time: string }[];
  violations: any[];
  monthly_trend: { month: string; percentage: number }[];
  subject_wise_attendance: { subject_id: string; subject_name: string; percentage: number }[];
  session_wise_attendance: { session: string; percentage: number }[];
}

export interface HistoryRecord {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: "present" | "absent" | "late";
  late_status: string;
  session: string;
  subject: string;
  scanner_device: string;
}

export interface FacultySummary {
  id: string;
  faculty_details: {
    id: string;
    name: string;
    employee_id: string;
    email: string;
    branch_name: string;
  };
  present_count: number;
  absent_count: number;
  leave_count: number;
  attendance_percentage: number;
}

export interface FacultyDetail {
  faculty: { id: string; name: string; employee_id: string; email: string };
  summary: { present_count: number; absent_count: number; leave_count: number; attendance_percentage: number };
  daily_attendance_history: any[];
  check_in_logs: any[];
  check_out_logs: any[];
  working_hours: { total_hours: number; average_hours_per_day: number };
  monthly_analytics: { month: string; percentage: number }[];
}

export interface AnalyticsData {
  average_attendance: number;
  attendance_trends: {
    daily_trend: { date: string; percentage: number }[];
    weekly_trend: { week_start_date: string; percentage: number }[];
    monthly_trend: { month: string; percentage: number }[];
  };
  branch_comparison: { branch_name: string; percentage: number }[];
  batch_comparison: { batch_name: string; batch_code: string; percentage: number }[];
  faculty_comparison: any[];
}

export interface DefaulterStudent {
  id: string;
  student_profile: {
    id: string;
    name: string;
    roll_number: string;
    admission_number: string;
    branch_name: string;
    batch_name: string | null;
  };
  attendance_percentage: number;
  active_violations: number;
}

export interface Violation {
  id: string;
  student: { id: string; name: string; roll_number: string };
  violation_type: "absent" | "late" | "unauthorized";
  date: string;
  description: string;
  is_resolved: boolean;
  created_at: string;
}

export interface BatchRegisterData {
  month: string;
  dates: string[];
  register: {
    student_id: string;
    student_name: string;
    roll_number: string;
    attendance: Record<string, { status: string; checked_in_at: string | null; checked_out_at: string | null }>;
  }[];
}

// ─── State ────────────────────────────────────────────────────────────────────

interface AttendanceState {
  dashboard: DashboardData | null;
  dashboardLoading: boolean;

  students: StudentSummary[];
  studentsCount: number;
  studentsLoading: boolean;

  selectedStudent: StudentDetail | null;
  selectedStudentLoading: boolean;

  history: HistoryRecord[];
  historyCount: number;
  historyLoading: boolean;

  faculty: FacultySummary[];
  facultyCount: number;
  facultyLoading: boolean;

  selectedFaculty: FacultyDetail | null;
  selectedFacultyLoading: boolean;

  analytics: AnalyticsData | null;
  analyticsLoading: boolean;

  defaulters: DefaulterStudent[];
  defaultersCount: number;
  defaultersLoading: boolean;

  violations: Violation[];
  violationsCount: number;
  violationsLoading: boolean;

  batchRegister: BatchRegisterData | null;
  batchRegisterLoading: boolean;

  error: string | null;
}

const initialState: AttendanceState = {
  dashboard: null,           dashboardLoading: false,
  students: [],              studentsCount: 0,       studentsLoading: false,
  selectedStudent: null,     selectedStudentLoading: false,
  history: [],               historyCount: 0,        historyLoading: false,
  faculty: [],               facultyCount: 0,        facultyLoading: false,
  selectedFaculty: null,     selectedFacultyLoading: false,
  analytics: null,           analyticsLoading: false,
  defaulters: [],            defaultersCount: 0,     defaultersLoading: false,
  violations: [],            violationsCount: 0,     violationsLoading: false,
  batchRegister: null,       batchRegisterLoading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setDashboard(s, a: PayloadAction<DashboardData>)           { s.dashboard = a.payload; s.error = null; },
    setDashboardLoading(s, a: PayloadAction<boolean>)          { s.dashboardLoading = a.payload; },

    setStudents(s, a: PayloadAction<{ data: StudentSummary[]; count: number }>) {
      s.students = a.payload.data; s.studentsCount = a.payload.count; s.error = null;
    },
    setStudentsLoading(s, a: PayloadAction<boolean>)           { s.studentsLoading = a.payload; },

    setSelectedStudent(s, a: PayloadAction<StudentDetail | null>) { s.selectedStudent = a.payload; },
    setSelectedStudentLoading(s, a: PayloadAction<boolean>)    { s.selectedStudentLoading = a.payload; },

    setHistory(s, a: PayloadAction<{ data: HistoryRecord[]; count: number }>) {
      s.history = a.payload.data; s.historyCount = a.payload.count; s.error = null;
    },
    setHistoryLoading(s, a: PayloadAction<boolean>)            { s.historyLoading = a.payload; },

    setFaculty(s, a: PayloadAction<{ data: FacultySummary[]; count: number }>) {
      s.faculty = a.payload.data; s.facultyCount = a.payload.count; s.error = null;
    },
    setFacultyLoading(s, a: PayloadAction<boolean>)            { s.facultyLoading = a.payload; },

    setSelectedFaculty(s, a: PayloadAction<FacultyDetail | null>) { s.selectedFaculty = a.payload; },
    setSelectedFacultyLoading(s, a: PayloadAction<boolean>)    { s.selectedFacultyLoading = a.payload; },

    setAnalytics(s, a: PayloadAction<AnalyticsData>)           { s.analytics = a.payload; s.error = null; },
    setAnalyticsLoading(s, a: PayloadAction<boolean>)          { s.analyticsLoading = a.payload; },

    setDefaulters(s, a: PayloadAction<{ data: DefaulterStudent[]; count: number }>) {
      s.defaulters = a.payload.data; s.defaultersCount = a.payload.count; s.error = null;
    },
    setDefaultersLoading(s, a: PayloadAction<boolean>)         { s.defaultersLoading = a.payload; },

    setViolations(s, a: PayloadAction<{ data: Violation[]; count: number }>) {
      s.violations = a.payload.data; s.violationsCount = a.payload.count; s.error = null;
    },
    setViolationsLoading(s, a: PayloadAction<boolean>)         { s.violationsLoading = a.payload; },

    setBatchRegister(s, a: PayloadAction<BatchRegisterData>)   { s.batchRegister = a.payload; s.error = null; },
    setBatchRegisterLoading(s, a: PayloadAction<boolean>)      { s.batchRegisterLoading = a.payload; },

    setAttendanceError(s, a: PayloadAction<string>)            { s.error = a.payload; },
    clearAttendanceError(s)                                    { s.error = null; },
  },
});

export const {
  setDashboard, setDashboardLoading,
  setStudents, setStudentsLoading,
  setSelectedStudent, setSelectedStudentLoading,
  setHistory, setHistoryLoading,
  setFaculty, setFacultyLoading,
  setSelectedFaculty, setSelectedFacultyLoading,
  setAnalytics, setAnalyticsLoading,
  setDefaulters, setDefaultersLoading,
  setViolations, setViolationsLoading,
  setBatchRegister, setBatchRegisterLoading,
  setAttendanceError, clearAttendanceError,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
```

---

## FILE 4 — `src/saga/attendanceSaga.ts` (CREATE NEW)

```ts
import { takeLatest } from "redux-saga/effects";
import { attendanceActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchAttendanceSaga() {
  yield takeLatest(attendanceActions.GET_DASHBOARD,       genericSaga);
  yield takeLatest(attendanceActions.GET_STUDENTS,        genericSaga);
  yield takeLatest(attendanceActions.GET_STUDENT_DETAIL,  genericSaga);
  yield takeLatest(attendanceActions.GET_HISTORY,         genericSaga);
  yield takeLatest(attendanceActions.GET_FACULTY,         genericSaga);
  yield takeLatest(attendanceActions.GET_FACULTY_DETAIL,  genericSaga);
  yield takeLatest(attendanceActions.GET_ANALYTICS,       genericSaga);
  yield takeLatest(attendanceActions.GET_DEFAULTERS,      genericSaga);
  yield takeLatest(attendanceActions.GET_VIOLATIONS,      genericSaga);
  yield takeLatest(attendanceActions.GET_BATCH_REGISTER,  genericSaga);
  yield takeLatest(attendanceActions.EXPORT_CSV,          genericSaga);
}
```

Then register it in your root saga file (wherever you call `watchAdmissionSaga`, add `watchAttendanceSaga` the same way):

```ts
import { watchAttendanceSaga } from "@/saga/attendanceSaga";
// inside your root saga fork/spawn/all block:
yield fork(watchAttendanceSaga);
// or
yield all([..., call(watchAttendanceSaga)]);
```

Also register the reducer in your store:

```ts
import attendanceReducer from "@/redux/slices/attendanceSlice";
// in combineReducers:
attendance: attendanceReducer,
```

---

## FILE 5 — `src/pages/attendance/tabs/DashboardTab.tsx` (CREATE NEW)

```tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setDashboard, setDashboardLoading, setAttendanceError } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const STAT_CARDS = (d: any) => [
  { label: "Total Students",        value: d.total_students,        icon: Users,         color: "bg-blue-50 text-blue-600" },
  { label: "Present Today",         value: d.present_today,         icon: UserCheck,     color: "bg-green-50 text-green-600" },
  { label: "Absent Today",          value: d.absent_today,          icon: UserX,         color: "bg-red-50 text-red-600" },
  { label: "Late Today",            value: d.late_today,            icon: Clock,         color: "bg-yellow-50 text-yellow-600" },
  { label: "Attendance %",          value: `${d.attendance_percentage?.toFixed(1)}%`, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  { label: "Active Violations",     value: d.active_violations,     icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
];

export default function DashboardTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { dashboard, dashboardLoading } = useSelector((s: RootState) => s.attendance);

  const [filters, setFilters] = useState({ date: "", branch: "", batch: "", faculty: "" });

  const fetchDashboard = () => {
    const params = new URLSearchParams();
    if (filters.date)    params.set("date",    filters.date);
    if (filters.branch)  params.set("branch",  filters.branch);
    if (filters.batch)   params.set("batch",   filters.batch);
    if (filters.faculty) params.set("faculty", filters.faculty);
    const query = params.toString();

    dispatch({
      type: attendanceActions.GET_DASHBOARD,
      method: "GET",
      endPoint: `${API.ATTENDANCE.DASHBOARD}${query ? `?${query}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setDashboardLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setDashboard(res.data));
        else { dispatch(setAttendanceError("Failed to load dashboard")); toast.error("Failed to load dashboard."); }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch dashboard";
        dispatch(setAttendanceError(msg)); toast.error(msg);
      },
    });
  };

  useEffect(() => { fetchDashboard(); }, [filters]);

  if (dashboardLoading && !dashboard) return <TableSkeleton columns={3} rows={4} className="mt-0" />;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-border">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Branch UUID</Label>
          <Input placeholder="Branch UUID" value={filters.branch} onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Batch UUID</Label>
          <Input placeholder="Batch UUID" value={filters.batch} onChange={e => setFilters(f => ({ ...f, batch: e.target.value }))} className="h-9 text-sm" />
        </div>
      </div>

      {/* Stat Cards */}
      {dashboard && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STAT_CARDS(dashboard).map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="bg-white rounded-xl border border-border p-4 flex flex-col gap-2"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Faculty Summary */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4 text-foreground">Faculty Attendance Summary</h3>
            <div className="flex gap-6">
              {[
                { label: "Total Faculty", value: dashboard.faculty_attendance_summary.total_faculty },
                { label: "Present",       value: dashboard.faculty_attendance_summary.present,       cls: "text-green-600" },
                { label: "Absent",        value: dashboard.faculty_attendance_summary.absent,        cls: "text-red-600" },
              ].map(item => (
                <div key={item.label} className="flex flex-col">
                  <span className={`text-2xl font-bold ${item.cls ?? "text-foreground"}`}>{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Branch-wise Chart */}
          {dashboard.branch_wise_attendance?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4 text-foreground">Branch-wise Attendance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashboard.branch_wise_attendance} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <XAxis dataKey="branch_name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {dashboard.branch_wise_attendance.map((_, idx) => (
                      <Cell key={idx} fill="#F7A900" opacity={0.85 - idx * 0.05} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## FILE 6 — `src/pages/attendance/tabs/StudentsTab.tsx` (CREATE NEW)

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, X, Eye } from "lucide-react";
import { useDispatch as useAppDispatch } from "react-redux";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setStudents, setStudentsLoading,
  setSelectedStudent, setSelectedStudentLoading,
  setAttendanceError,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

function buildQuery(f: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
  return p.toString();
}

export default function StudentsAttendanceTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { students, studentsLoading, selectedStudent, selectedStudentLoading } = useSelector((s: RootState) => s.attendance);

  const [filters, setFilters] = useState({
    search: "", branch_id: "", batch_id: "", course_id: "",
    attendance_percentage_min: "", attendance_percentage_max: "",
    date_from: "", date_to: "",
    late_entries: "", active_violations: "",
  });
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchStudents = () => {
    const q = buildQuery(filters);
    dispatch({
      type: attendanceActions.GET_STUDENTS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.STUDENTS}${q ? `?${q}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setStudentsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setStudents({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load students.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to fetch students"),
    });
  };

  const fetchStudentDetail = (id: string) => {
    setDetailOpen(true);
    dispatch({
      type: attendanceActions.GET_STUDENT_DETAIL,
      method: "GET",
      endPoint: API.ATTENDANCE.STUDENT_DETAIL(id),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSelectedStudentLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setSelectedStudent(res.data));
        else toast.error("Failed to load student detail.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to fetch student detail"),
    });
  };

  useEffect(() => { fetchStudents(); }, []);

  const pct = (v: number) => {
    if (v >= 75) return "bg-green-100 text-green-700";
    if (v >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, admission no, roll no..."
              className="pl-9 h-9 text-sm"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Input placeholder="Branch UUID" className="h-9 text-sm w-40" value={filters.branch_id} onChange={e => setFilters(f => ({ ...f, branch_id: e.target.value }))} />
          <Input placeholder="Batch UUID" className="h-9 text-sm w-40" value={filters.batch_id} onChange={e => setFilters(f => ({ ...f, batch_id: e.target.value }))} />
          <Input type="date" className="h-9 text-sm w-40" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
          <Input type="date" className="h-9 text-sm w-40" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Attendance % Min</Label>
            <Input type="number" placeholder="0" className="h-9 text-sm w-28" value={filters.attendance_percentage_min} onChange={e => setFilters(f => ({ ...f, attendance_percentage_min: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Attendance % Max</Label>
            <Input type="number" placeholder="100" className="h-9 text-sm w-28" value={filters.attendance_percentage_max} onChange={e => setFilters(f => ({ ...f, attendance_percentage_max: e.target.value }))} />
          </div>
          <Select value={filters.late_entries} onValueChange={v => setFilters(f => ({ ...f, late_entries: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Late Entries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has Late Entries</SelectItem>
              <SelectItem value="false">No Late Entries</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.active_violations} onValueChange={v => setFilters(f => ({ ...f, active_violations: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Violations" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has Violations</SelectItem>
              <SelectItem value="false">No Violations</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchStudents} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply Filters</Button>
          <Button variant="outline" className="h-9 text-sm" onClick={() => {
            setFilters({ search: "", branch_id: "", batch_id: "", course_id: "", attendance_percentage_min: "", attendance_percentage_max: "", date_from: "", date_to: "", late_entries: "", active_violations: "" });
          }}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      {studentsLoading ? (
        <TableSkeleton columns={6} rows={6} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["Student", "Admission No.", "Branch / Batch", "Present", "Absent", "Late", "Attendance %", "Last Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No students found.</td></tr>
              ) : students.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => fetchStudentDetail(s.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={s.student_profile.photo ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{s.student_profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{s.student_profile.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.student_profile.admission_number}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{s.student_profile.branch_name}</div>
                    <div className="text-muted-foreground">{s.student_profile.batch_name ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium">{s.present_count}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{s.absent_count}</td>
                  <td className="px-4 py-3 text-yellow-600 font-medium">{s.late_count}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-semibold ${pct(s.attendance_percentage)}`}>
                      {s.attendance_percentage.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.last_attendance_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); fetchStudentDetail(s.id); }}>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={open => { setDetailOpen(open); if (!open) dispatch(setSelectedStudent(null)); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Attendance Detail</DialogTitle>
          </DialogHeader>
          {selectedStudentLoading ? (
            <TableSkeleton columns={2} rows={4} />
          ) : selectedStudent ? (
            <div className="space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedStudent.student_profile.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{selectedStudent.student_profile.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedStudent.student_profile.admission_number} · {selectedStudent.student_profile.branch_name}</div>
                </div>
                <Badge className={`ml-auto text-sm font-bold ${pct(selectedStudent.attendance_percentage)}`}>
                  {selectedStudent.attendance_percentage.toFixed(1)}%
                </Badge>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: "Present", v: selectedStudent.summary.present_count, c: "text-green-600" },
                  { l: "Absent",  v: selectedStudent.summary.absent_count,  c: "text-red-600" },
                  { l: "Late",    v: selectedStudent.summary.late_count,    c: "text-yellow-600" },
                ].map(item => (
                  <div key={item.l} className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${item.c}`}>{item.v}</div>
                    <div className="text-xs text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>

              {/* Monthly Trend Chart */}
              {selectedStudent.monthly_trend?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Monthly Trend</h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={selectedStudent.monthly_trend}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Line type="monotone" dataKey="percentage" stroke="#F7A900" strokeWidth={2} dot={{ fill: "#F7A900", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Subject-wise */}
              {selectedStudent.subject_wise_attendance?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Subject-wise Attendance</h4>
                  <div className="space-y-2">
                    {selectedStudent.subject_wise_attendance.map(sub => (
                      <div key={sub.subject_id} className="flex items-center gap-3">
                        <span className="text-sm text-foreground flex-1">{sub.subject_name}</span>
                        <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${sub.percentage}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-12 text-right">{sub.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## FILE 7 — `src/pages/attendance/tabs/HistoryTab.tsx` (CREATE NEW)

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setHistory, setHistoryLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_BADGE: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent:  "bg-red-100 text-red-700",
  late:    "bg-yellow-100 text-yellow-700",
};

export default function HistoryTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { history, historyLoading, historyCount } = useSelector((s: RootState) => s.attendance);

  const [f, setF] = useState({
    student_id: "", branch_id: "", batch_id: "", faculty_id: "",
    date_from: "", date_to: "", attendance_status: "", session: "", subject: "",
  });

  const fetch = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_HISTORY,
      method: "GET",
      endPoint: `${API.ATTENDANCE.HISTORY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setHistoryLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setHistory({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load history.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const clear = () => setF({ student_id: "", branch_id: "", batch_id: "", faculty_id: "", date_from: "", date_to: "", attendance_status: "", session: "", subject: "" });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Student UUID" className="h-9 text-sm w-40" value={f.student_id} onChange={e => setF(p => ({ ...p, student_id: e.target.value }))} />
          <Input placeholder="Branch UUID"  className="h-9 text-sm w-40" value={f.branch_id}  onChange={e => setF(p => ({ ...p, branch_id:  e.target.value }))} />
          <Input placeholder="Batch UUID"   className="h-9 text-sm w-40" value={f.batch_id}   onChange={e => setF(p => ({ ...p, batch_id:   e.target.value }))} />
          <Input placeholder="Faculty UUID" className="h-9 text-sm w-40" value={f.faculty_id} onChange={e => setF(p => ({ ...p, faculty_id: e.target.value }))} />
          <Input type="date" className="h-9 text-sm w-40" value={f.date_from} onChange={e => setF(p => ({ ...p, date_from: e.target.value }))} />
          <Input type="date" className="h-9 text-sm w-40" value={f.date_to}   onChange={e => setF(p => ({ ...p, date_to:   e.target.value }))} />
          <Select value={f.attendance_status} onValueChange={v => setF(p => ({ ...p, attendance_status: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
          <Select value={f.session} onValueChange={v => setF(p => ({ ...p, session: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
          <Button variant="outline" className="h-9 text-sm" onClick={clear}><X className="w-3 h-3 mr-1" />Clear</Button>
        </div>
      </div>

      {historyLoading ? <TableSkeleton columns={7} rows={8} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Attendance History</span>
            <span className="text-xs text-muted-foreground">{historyCount} records</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>{["Date", "Check-in", "Check-out", "Status", "Late Status", "Session", "Subject", "Device"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No records found.</td></tr>
              ) : history.map((row, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{row.date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.check_in_time  ? new Date(row.check_in_time).toLocaleTimeString()  : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_BADGE[row.status] ?? ""}`}>{row.status}</Badge></td>
                  <td className="px-4 py-3 text-xs capitalize">{row.late_status}</td>
                  <td className="px-4 py-3 text-xs capitalize">{row.session}</td>
                  <td className="px-4 py-3 text-xs">{row.subject}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.scanner_device}</td>
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

## FILE 8 — `src/pages/attendance/tabs/FacultyTab.tsx` (CREATE NEW)

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setFaculty, setFacultyLoading,
  setSelectedFaculty, setSelectedFacultyLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function FacultyTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { faculty, facultyLoading, selectedFaculty, selectedFacultyLoading } = useSelector((s: RootState) => s.attendance);

  const [f, setF] = useState({ faculty_id: "", branch_id: "", date_from: "", date_to: "" });
  const [detailOpen, setDetailOpen] = useState(false);

  const fetch = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_FACULTY,
      method: "GET",
      endPoint: `${API.ATTENDANCE.FACULTY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setFacultyLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setFaculty({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load faculty.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  const fetchDetail = (id: string) => {
    setDetailOpen(true);
    dispatch({
      type: attendanceActions.GET_FACULTY_DETAIL,
      method: "GET",
      endPoint: API.ATTENDANCE.FACULTY_DETAIL(id),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSelectedFacultyLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setSelectedFaculty(res.data));
        else toast.error("Failed to load faculty detail.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const pct = (v: number) => v >= 75 ? "bg-green-100 text-green-700" : v >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3">
        <Input placeholder="Faculty UUID" className="h-9 text-sm w-40" value={f.faculty_id} onChange={e => setF(p => ({ ...p, faculty_id: e.target.value }))} />
        <Input placeholder="Branch UUID"  className="h-9 text-sm w-40" value={f.branch_id}  onChange={e => setF(p => ({ ...p, branch_id:  e.target.value }))} />
        <Input type="date" className="h-9 text-sm w-40" value={f.date_from} onChange={e => setF(p => ({ ...p, date_from: e.target.value }))} />
        <Input type="date" className="h-9 text-sm w-40" value={f.date_to}   onChange={e => setF(p => ({ ...p, date_to:   e.target.value }))} />
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setF({ faculty_id: "", branch_id: "", date_from: "", date_to: "" })}><X className="w-3 h-3 mr-1" />Clear</Button>
      </div>

      {facultyLoading ? <TableSkeleton columns={6} rows={5} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Faculty", "Employee ID", "Branch", "Present", "Absent", "Leave", "Attendance %", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {faculty.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No faculty found.</td></tr>
              ) : faculty.map((row, i) => (
                <motion.tr key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => fetchDetail(row.id)}>
                  <td className="px-4 py-3 font-medium">{row.faculty_details.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.faculty_details.employee_id}</td>
                  <td className="px-4 py-3 text-xs">{row.faculty_details.branch_name}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{row.present_count}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{row.absent_count}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{row.leave_count}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${pct(row.attendance_percentage)}`}>{row.attendance_percentage.toFixed(1)}%</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); fetchDetail(row.id); }}><Eye className="w-4 h-4 text-muted-foreground" /></Button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Faculty Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={open => { setDetailOpen(open); if (!open) dispatch(setSelectedFaculty(null)); }}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Faculty Attendance Detail</DialogTitle></DialogHeader>
          {selectedFacultyLoading ? <TableSkeleton columns={2} rows={4} /> : selectedFaculty ? (
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-foreground">{selectedFaculty.faculty.name}</div>
                <div className="text-xs text-muted-foreground">{selectedFaculty.faculty.employee_id} · {selectedFaculty.faculty.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Present", v: selectedFaculty.summary.present_count, c: "text-green-600" },
                  { l: "Absent",  v: selectedFaculty.summary.absent_count,  c: "text-red-600" },
                  { l: "Leave",   v: selectedFaculty.summary.leave_count,   c: "text-blue-600" },
                  { l: "Total Hours", v: selectedFaculty.working_hours.total_hours, c: "text-foreground" },
                ].map(item => (
                  <div key={item.l} className="bg-muted/30 rounded-lg p-3">
                    <div className={`text-xl font-bold ${item.c}`}>{item.v}</div>
                    <div className="text-xs text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>
              {selectedFaculty.monthly_analytics?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Monthly Analytics</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={selectedFaculty.monthly_analytics}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Line type="monotone" dataKey="percentage" stroke="#F7A900" strokeWidth={2} dot={{ fill: "#F7A900", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## FILE 9 — `src/pages/attendance/tabs/AnalyticsTab.tsx` (CREATE NEW)

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setAnalytics, setAnalyticsLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

export default function AnalyticsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { analytics, analyticsLoading } = useSelector((s: RootState) => s.attendance);

  const [f, setF] = useState({ branch: "", batch: "", course: "", faculty: "", student: "", date_from: "", date_to: "" });
  const [trendView, setTrendView] = useState<"daily" | "weekly" | "monthly">("monthly");

  const fetch = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_ANALYTICS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.ANALYTICS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setAnalyticsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setAnalytics(res.data));
        else toast.error("Failed to load analytics.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const trendData = analytics ? {
    daily:   analytics.attendance_trends.daily_trend.map(d => ({ name: d.date, value: d.percentage })),
    weekly:  analytics.attendance_trends.weekly_trend.map(d => ({ name: d.week_start_date, value: d.percentage })),
    monthly: analytics.attendance_trends.monthly_trend.map(d => ({ name: d.month, value: d.percentage })),
  }[trendView] : [];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <Input placeholder="Branch UUID" className="h-9 text-sm w-36" value={f.branch}   onChange={e => setF(p => ({ ...p, branch:   e.target.value }))} />
        <Input placeholder="Batch UUID"  className="h-9 text-sm w-36" value={f.batch}    onChange={e => setF(p => ({ ...p, batch:    e.target.value }))} />
        <Input placeholder="Course UUID" className="h-9 text-sm w-36" value={f.course}   onChange={e => setF(p => ({ ...p, course:   e.target.value }))} />
        <Input type="date" className="h-9 text-sm w-40" value={f.date_from} onChange={e => setF(p => ({ ...p, date_from: e.target.value }))} />
        <Input type="date" className="h-9 text-sm w-40" value={f.date_to}   onChange={e => setF(p => ({ ...p, date_to:   e.target.value }))} />
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setF({ branch: "", batch: "", course: "", faculty: "", student: "", date_from: "", date_to: "" })}><X className="w-3 h-3 mr-1" />Clear</Button>
      </div>

      {analyticsLoading ? <TableSkeleton columns={3} rows={4} /> : analytics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* KPI */}
          <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">{analytics.average_attendance.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Average Overall Attendance</div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-foreground">Attendance Trend</h3>
              <div className="flex gap-1">
                {(["daily", "weekly", "monthly"] as const).map(v => (
                  <Button key={v} size="sm" variant={trendView === v ? "default" : "outline"}
                    className={`h-7 text-xs capitalize ${trendView === v ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => setTrendView(v)}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Line type="monotone" dataKey="value" stroke="#F7A900" strokeWidth={2} dot={{ fill: "#F7A900", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Branch & Batch Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4 text-foreground">Branch Comparison</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analytics.branch_comparison}>
                  <XAxis dataKey="branch_name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]} fill="#F7A900" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4 text-foreground">Batch Comparison</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analytics.batch_comparison}>
                  <XAxis dataKey="batch_name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]} fill="#2e3032" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

---

## FILE 10 — `src/pages/attendance/tabs/DefaultersTab.tsx` (CREATE NEW)

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setDefaulters, setDefaultersLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function DefaultersTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { defaulters, defaultersLoading, defaultersCount } = useSelector((s: RootState) => s.attendance);

  const [f, setF] = useState({ branch: "", batch: "", course: "", attendance_threshold: "75" });

  const fetch = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_DEFAULTERS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.DEFAULTERS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setDefaultersLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setDefaulters({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load defaulters.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Threshold %</Label>
          <Input type="number" className="h-9 text-sm w-28" value={f.attendance_threshold} onChange={e => setF(p => ({ ...p, attendance_threshold: e.target.value }))} />
        </div>
        <Input placeholder="Branch UUID" className="h-9 text-sm w-36" value={f.branch} onChange={e => setF(p => ({ ...p, branch: e.target.value }))} />
        <Input placeholder="Batch UUID"  className="h-9 text-sm w-36" value={f.batch}  onChange={e => setF(p => ({ ...p, batch:  e.target.value }))} />
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setF({ branch: "", batch: "", course: "", attendance_threshold: "75" })}><X className="w-3 h-3 mr-1" />Clear</Button>
      </div>

      {defaulters.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 font-medium">{defaultersCount} defaulter(s) found below {f.attendance_threshold}% threshold</span>
        </div>
      )}

      {defaultersLoading ? <TableSkeleton columns={5} rows={5} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-red-50 border-b border-border">
              <tr>{["Student", "Admission No.", "Branch / Batch", "Attendance %", "Active Violations"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {defaulters.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">No defaulters found.</td></tr>
              ) : defaulters.map((d, i) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{d.student_profile.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.student_profile.admission_number}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{d.student_profile.branch_name}</div>
                    <div className="text-muted-foreground">{d.student_profile.batch_name ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-red-100 text-red-700 text-xs font-semibold">{d.attendance_percentage.toFixed(1)}%</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {d.active_violations > 0
                      ? <Badge className="bg-orange-100 text-orange-700 text-xs">{d.active_violations} violation{d.active_violations > 1 ? "s" : ""}</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>}
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

## FILE 11 — `src/pages/attendance/tabs/ViolationsTab.tsx` (CREATE NEW)

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setViolations, setViolationsLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const TYPE_BADGE: Record<string, string> = {
  absent:       "bg-red-100 text-red-700",
  late:         "bg-yellow-100 text-yellow-700",
  unauthorized: "bg-purple-100 text-purple-700",
};

export default function ViolationsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { violations, violationsLoading, violationsCount } = useSelector((s: RootState) => s.attendance);

  const [f, setF] = useState({
    student: "", branch: "", batch: "",
    violation_type: "", resolved: "",
    date_from: "", date_to: "",
  });

  const fetch = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_VIOLATIONS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.VIOLATIONS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setViolationsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setViolations({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load violations.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3">
        <Input placeholder="Student UUID" className="h-9 text-sm w-36" value={f.student} onChange={e => setF(p => ({ ...p, student: e.target.value }))} />
        <Input placeholder="Branch UUID"  className="h-9 text-sm w-36" value={f.branch}  onChange={e => setF(p => ({ ...p, branch:  e.target.value }))} />
        <Select value={f.violation_type} onValueChange={v => setF(p => ({ ...p, violation_type: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-40"><SelectValue placeholder="Violation Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="unauthorized">Unauthorized</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.resolved} onValueChange={v => setF(p => ({ ...p, resolved: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Resolved?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Resolved</SelectItem>
            <SelectItem value="false">Unresolved</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="h-9 text-sm w-40" value={f.date_from} onChange={e => setF(p => ({ ...p, date_from: e.target.value }))} />
        <Input type="date" className="h-9 text-sm w-40" value={f.date_to}   onChange={e => setF(p => ({ ...p, date_to:   e.target.value }))} />
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setF({ student: "", branch: "", batch: "", violation_type: "", resolved: "", date_from: "", date_to: "" })}><X className="w-3 h-3 mr-1" />Clear</Button>
      </div>

      {violationsLoading ? <TableSkeleton columns={6} rows={5} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Violations</span>
            <span className="text-xs text-muted-foreground">{violationsCount} total</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>{["Student", "Type", "Date", "Description", "Status", "Created At"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {violations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No violations found.</td></tr>
              ) : violations.map((v, i) => (
                <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.student.name}</div>
                    <div className="text-xs text-muted-foreground">{v.student.roll_number}</div>
                  </td>
                  <td className="px-4 py-3"><Badge className={`text-xs capitalize ${TYPE_BADGE[v.violation_type] ?? ""}`}>{v.violation_type}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs">{v.date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{v.description}</td>
                  <td className="px-4 py-3">
                    <Badge className={v.is_resolved ? "bg-green-100 text-green-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>
                      {v.is_resolved ? "Resolved" : "Open"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</td>
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

## FILE 12 — `src/pages/attendance/AttendancePage.tsx` (FINAL — REPLACE existing stub)

```tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Download } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import type { AppDispatch } from "@/store";

// ── Tab Components ──────────────────────────────────────────────────────────
import DashboardTab     from "./tabs/DashboardTab";
import StudentsAttendanceTab from "./tabs/StudentsTab";
import HistoryTab       from "./tabs/HistoryTab";
import FacultyTab       from "./tabs/FacultyTab";
import AnalyticsTab     from "./tabs/AnalyticsTab";
import DefaultersTab    from "./tabs/DefaultersTab";
import ViolationsTab    from "./tabs/ViolationsTab";

const TABS = [
  { value: "dashboard",  label: "Dashboard"  },
  { value: "students",   label: "Students"   },
  { value: "history",    label: "History"    },
  { value: "faculty",    label: "Faculty"    },
  { value: "analytics",  label: "Analytics"  },
  { value: "defaulters", label: "Defaulters" },
  { value: "violations", label: "Violations" },
] as const;

type TabValue = typeof TABS[number]["value"];

export default function AttendancePage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabValue>("dashboard");
  const [exporting, setExporting] = useState(false);

  useEffect(() => { setPageTitle("Attendance"); }, [setPageTitle]);

  const handleExport = () => {
    setExporting(true);
    dispatch({
      type: attendanceActions.EXPORT_CSV,
      method: "GET",
      endPoint: API.ATTENDANCE.EXPORT,
      auth: true,
      setLoading: (v: boolean) => { if (!v) setExporting(false); },
      getResponse: (res: any) => {
        // The backend returns a file — if your genericSaga returns blob handle it here.
        // For text/csv response just trigger download:
        try {
          const blob = new Blob([res], { type: "text/csv" });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url; a.download = "attendance_report.csv"; a.click();
          URL.revokeObjectURL(url);
          toast.success("Export downloaded successfully.");
        } catch {
          toast.error("Export failed. Please try again.");
        }
        setExporting(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Export failed.");
        setExporting(false);
      },
    });
  };

  const canExport = user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Monitor, analyse and manage attendance across students and faculty."
        actions={
          canExport ? (
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="h-9 text-sm gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          ) : undefined
        }
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-5 flex-wrap h-auto gap-1">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard"  className="mt-0"><DashboardTab /></TabsContent>
          <TabsContent value="students"   className="mt-0"><StudentsAttendanceTab /></TabsContent>
          <TabsContent value="history"    className="mt-0"><HistoryTab /></TabsContent>
          <TabsContent value="faculty"    className="mt-0"><FacultyTab /></TabsContent>
          <TabsContent value="analytics"  className="mt-0"><AnalyticsTab /></TabsContent>
          <TabsContent value="defaulters" className="mt-0"><DefaultersTab /></TabsContent>
          <TabsContent value="violations" className="mt-0"><ViolationsTab /></TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
```

---

## CHECKLIST — do these after pasting all files

- [ ] Register `attendanceReducer` in your `combineReducers` store config
- [ ] Register `watchAttendanceSaga` in your root saga (same pattern as `watchAdmissionSaga`)
- [ ] Add `attendanceActions` export to `src/redux/actions/index.ts`
- [ ] Add `API.ATTENDANCE` namespace to `src/service/api.ts`
- [ ] Add route for `AttendancePage` in your router config (e.g. `<Route path="/attendance" element={<AttendancePage />} />`)
- [ ] Add nav item for Attendance in your sidebar config

---

## NOTES FOR IDE AI

- Do NOT install any new npm packages — every import is already available in this project.
- Do NOT change the `genericSaga` pattern — all API calls go through `dispatch({ type, method, endPoint, auth, setLoading, getResponse, getError })`.
- Token injection is handled automatically by `genericSaga` when `auth: true`.
- Follow the exact same error handling pattern as `AdmissionsTab.tsx` — `toast.error` for failures, `toast.success` for successes.
- All components use Tailwind classes only — no inline styles except `style={{ width: \`${v}%\` }}` for progress bars.
- Primary orange `#F7A900` is `bg-primary` / `text-primary` in Tailwind (it's mapped in the project's theme config).
