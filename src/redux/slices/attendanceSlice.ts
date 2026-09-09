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
  check_in_history: { id?: string; date: string; time?: string; check_in_time?: string; status?: string; timetable_slot?: any }[];
  check_out_history: { id?: string; date: string; time?: string; check_out_time?: string; timetable_slot?: any }[];
  violations: any[];
  recent_absences?: { date: string; formatted_date?: string; status: string }[];
  day_wise_attendance: { id?: string; date: string; status: string; status_display?: string; timetable_slot?: any; checked_in_at?: string; checked_out_at?: string }[];
  monthly_trend: { month: string; percentage: number }[];
  subject_wise_attendance: { subject_id: string; subject_name: string; percentage: number }[];
  session_wise_attendance: { session: string; session_name?: string; percentage: number }[];
}

export interface HistoryRecord {
  id: string;
  student_name: string;
  roll_number: string;
  batch_name: string;
  branch_name: string;
  date: string;
  status: "present" | "absent" | "late" | "half_day" | "on_leave";
  status_display: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  marked_by_name: string;
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
  employee_profile: { id: string; name: string; employee_id: string; email: string; role: string; branch_name: string };
  attendance_percentage: number;
  summary: { present_count: number; absent_count: number; leave_count: number; late_count: number; attendance_percentage?: number };
  day_wise_attendance: any[];
  recent_absences: any[];
  check_in_history: any[];
  check_out_history: any[];
  monthly_trend: { month_name: string; percentage: number }[];
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
