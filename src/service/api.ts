/**
 * Centralized API endpoint definitions.
 * Usage:
 *   import { API } from "@/service/api";
 *   endPoint: API.DROPDOWNS.PUBLIC("roles")
 *   endPoint: API.DROPDOWNS.AUTH("branches")
 */

/* ─── Base paths ─────────────────────────────────────────────── */

const DROPDOWN_PUBLIC_BASE = "/api/v1/dropdowns/public";
const DROPDOWN_AUTH_BASE = "/api/v1/dropdowns/auth";

/* ─── Helpers ────────────────────────────────────────────────── */

/** Build a dropdown URL, e.g. `/api/v1/dropdowns/public/` */
const buildDropdownUrl = (base: string, params?: Record<string, string>) => {
  const url = `${base}/`;
  if (!params || Object.keys(params).length === 0) return url;
  const qs = new URLSearchParams(params).toString();
  return `${url}?${qs}`;
};

/* ─── Exported API map ───────────────────────────────────────── */

export const API = {
  /** Dropdown endpoints — the most commonly reused APIs */
  DROPDOWNS: {
    /**
     * Public dropdown (no auth required). Returns all public dropdowns.
     * @param params - Optional query params
     */
    PUBLIC: (params?: Record<string, string>) => buildDropdownUrl(DROPDOWN_PUBLIC_BASE, params),

    /**
     * Authenticated dropdown (requires Bearer token). Returns all auth dropdowns.
     * @param params - Optional query params
     */
    AUTH: (params?: Record<string, string>) => buildDropdownUrl(DROPDOWN_AUTH_BASE, params),
  },

  /** Auth endpoints */
  AUTH: {
    LOGIN: "/api/auth/login/",
    SET_PASSWORD: "/api/auth/set-password/",
  },

  /** User management endpoints */
  USERS: {
    LIST: "/api/auth/users/",
    DETAIL: (id: string) => `/api/auth/users/${id}/`,
  },

  /** Leads endpoints */
  LEADS: {
    CREATE: "/api/v1/leads/",
    LIST: "/api/v1/leads/",
    GET: (id: string | number) => `/api/v1/leads/${id}/`,
    STATUS: (id: string | number) => `/api/v1/leads/${id}/status/`,
    ASSIGN: (id: string | number) => `/api/v1/leads/${id}/assign/`,
    REASSIGN: (id: string | number) => `/api/v1/leads/${id}/reassign/`,
  },

  /** Admissions endpoints */
  ADMISSIONS: {
    LIST: "/api/v1/admissions/",
    GET: (id: string | number) => `/api/v1/admissions/${id}/`,
    SUBMIT: (id: string | number) => `/api/v1/admissions/${id}/`,
    APPROVE: (id: string | number) => `/api/v1/admissions/${id}/approve/`,
    REJECT: (id: string | number) => `/api/v1/admissions/${id}/reject/`,
    PAYMENT_UPLOAD: (id: string | number) => `/api/v1/admissions/${id}/payment/`,
  },

  /** Students endpoints */
  STUDENTS: {
    LIST: "/api/v1/students/",
    GET: (id: string | number) => `/api/v1/students/${id}/`,
  },

  /** Courses endpoints */
  COURSES: {
    LIST: "/api/v1/courses/",
    CREATE: "/api/v1/courses/",
    DETAIL: (id: string | number) => `/api/v1/courses/${id}/`,
    UPDATE: (id: string | number) => `/api/v1/courses/${id}/`,
    DELETE: (id: string | number) => `/api/v1/courses/${id}/`,
    LEVELS: {
      LIST: (courseId: string | number) => `/api/v1/courses/${courseId}/levels/`,
      CREATE: (courseId: string | number) => `/api/v1/courses/${courseId}/levels/`,
      DETAIL: (courseId: string | number, levelId: string | number) =>
        `/api/v1/courses/${courseId}/levels/${levelId}/`,
      UPDATE: (courseId: string | number, levelId: string | number) =>
        `/api/v1/courses/${courseId}/levels/${levelId}/`,
      DELETE: (courseId: string | number, levelId: string | number) =>
        `/api/v1/courses/${courseId}/levels/${levelId}/`,
    },
  },

  /** Batches endpoints */
  BATCHES: {
    LIST: "/api/v1/batches/",
    CREATE: "/api/v1/batches/",
    DETAIL: (id: string | number) => `/api/v1/batches/${id}/`,
    UPDATE: (id: string | number) => `/api/v1/batches/${id}/`,
    DELETE: (id: string | number) => `/api/v1/batches/${id}/`,
    ASSIGN_STUDENT: (id: string | number) => `/api/v1/batches/${id}/assign-students/`,
    REMOVE_STUDENT: (id: string | number, student_id: string | number) =>
      `/api/v1/batches/${id}/remove-student/${student_id}/`,
    ASSIGN_FACULTY: (id: string | number) => `/api/v1/batches/${id}/assign-faculty/`,
    REMOVE_FACULTY: (id: string | number, faculty_id: string | number) =>
      `/api/v1/batches/${id}/remove-faculty/${faculty_id}/`,
  },

  /** Subjects endpoints */
  SUBJECTS: {
    CREATE: "/api/v1/subjects/",
    UPDATE: (id: string | number) => `/api/v1/subjects/${id}/`,
    DELETE: (id: string | number) => `/api/v1/subjects/${id}/`,
  },

  /** Chapters endpoints */
  CHAPTERS: {
    CREATE: (subjectId: string | number) => `/api/v1/subjects/${subjectId}/chapters/`,
    UPDATE: (subjectId: string | number, chapterId: string | number) =>
      `/api/v1/subjects/${subjectId}/chapters/${chapterId}/`,
    DELETE: (subjectId: string | number, chapterId: string | number) =>
      `/api/v1/subjects/${subjectId}/chapters/${chapterId}/`,
  },

  /** Reports endpoints */
  REPORTS: {
    LEADS: "/api/v1/reports/leads/",
  },

  /** Attendance endpoints */
  ATTENDANCE: {
    DASHBOARD: "/api/v1/attendance/dashboard/",
    STUDENTS: "/api/v1/attendance/students/",
    STUDENT_DETAIL: (id: string) => `/api/v1/attendance/students/${id}/`,
    HISTORY: "/api/v1/attendance/history/",
    FACULTY: "/api/v1/attendance/faculty/",
    FACULTY_DETAIL: (id: string) => `/api/v1/attendance/faculty/${id}/`,
    ANALYTICS: "/api/v1/attendance/analytics/",
    DEFAULTERS: "/api/v1/attendance/defaulters/",
    VIOLATIONS: "/api/v1/attendance/violations/",
    BATCH_REGISTER: (batchId?: string) =>
      batchId && batchId !== "all"
        ? `/api/v1/attendance/batches/${batchId}/register/`
        : `/api/v1/attendance/batches/register/`,
    REGISTER_ALL: (params?: { branch_id?: string; batch_id?: string }) => {
      const url = "/api/v1/attendance/batches/register/";
      if (!params) return url;
      const q: Record<string, string> = {};
      if (params.branch_id && params.branch_id !== "all") q.branch_id = params.branch_id;
      if (params.batch_id && params.batch_id !== "all") q.batch_id = params.batch_id;
      const qs = new URLSearchParams(q).toString();
      return qs ? `${url}?${qs}` : url;
    },
    EXPORT: "/api/v1/attendance/export/",
  },

  /** Timetable endpoints (new slot-based API) */
  TIMETABLE: {
    SLOTS: "/api/v1/timetable/",
    SLOT_DETAIL: (id: string) => `/api/v1/timetable/${id}/`,
    EXAM_TYPES: "/api/v1/timetable/exam-types/",
    EXAM_TYPE_DETAIL: (id: string) => `/api/v1/timetable/exam-types/${id}/`,
    FACULTY_VIEW: (facultyId: string) => `/api/v1/timetable/faculty/${facultyId}/`,
    STUDENT_VIEW: (studentId: string) => `/api/v1/timetable/student/${studentId}/`,
    DUPLICATE: (id: string) => `/api/v1/timetable/${id}/duplicate/`,
  },

  /** Exams endpoints */
  EXAMS: {
    LIST: "/api/v1/exams/",
    DETAIL: (id: string) => `/api/v1/exams/${id}/`,
    QUESTIONS: (examId: string) => `/api/v1/exams/${examId}/questions/`,
    QUESTION_DETAIL: (examId: string, qId: string) => `/api/v1/exams/${examId}/questions/${qId}/`,
    SEATING: (examId: string) => `/api/v1/exams/${examId}/seating/`,
    SEAT_DETAIL: (examId: string, seatId: string) => `/api/v1/exams/${examId}/seating/${seatId}/`,
    DISTRIBUTE_ANSWER_KEY: (examId: string) => `/api/v1/exams/${examId}/answer-key/distribute/`,
    ANSWER_KEY_PUBLIC: (examId: string) => `/api/v1/answer-key/${examId}/`,
    MALPRACTICE: (examId: string) => `/api/v1/exams/${examId}/malpractice/`,
    MALPRACTICE_DETAIL: (examId: string, rId: string) =>
      `/api/v1/exams/${examId}/malpractice/${rId}/`,
  },

  /** Fees endpoints */
  FEES: {
    STRUCTURES: "/api/v1/fee-structures/",
    STRUCTURE_DETAIL: (id: string | number) => `/api/v1/fee-structures/${id}/`,
    STUDENT_FEES_LIST: "/api/v1/student-fees/",
    STUDENT_FEES_DETAIL: (studentId: string | number) => `/api/v1/fees/student/${studentId}/`,
    STUDENT_FEES_SUMMARY: "/api/v1/student-fees/summary/",
    REPORT: (month?: number | string, year?: number | string) => {
      const base = "/api/v1/fees/report/";
      if (!month || !year) return base;
      return `${base}?month=${month}&year=${year}`;
    },
  },
  INSTALLMENTS: {
    LIST: "/api/v1/installments/",
    CREATE_PLAN: "/api/v1/installments/create/",
    APPROVE: (id: string | number) => `/api/v1/installments/${id}/approve/`,
  },

  /** Leave Management endpoints */
  LEAVE: {
    // Policies
    POLICIES: "/api/v1/leave/policy/",
    POLICY_DETAIL: (id: string) => `/api/v1/leave/policy/${id}/`,

    // Holidays
    HOLIDAYS: "/api/v1/leave/public-holidays/",
    HOLIDAY_DETAIL: (id: string) => `/api/v1/leave/public-holidays/${id}/`,

    // Balances
    MY_BALANCE: "/api/v1/leave/balance/",
    USER_BALANCE: (userId: string) => `/api/v1/leave/balance/${userId}/`,

    // Applications
    LIST: "/api/v1/leave/",
    DETAIL: (id: string) => `/api/v1/leave/${id}/`,
    APPROVE: (id: string) => `/api/v1/leave/${id}/approve/`,
    REJECT: (id: string) => `/api/v1/leave/${id}/reject/`,

    // Student Applications
    STUDENT_LIST: "/api/v1/leave/student/",
    STUDENT_DETAIL: (id: string) => `/api/v1/leave/student/${id}/`,
    STUDENT_APPROVE: (id: string) => `/api/v1/leave/student/${id}/approve/`,
    STUDENT_REJECT: (id: string) => `/api/v1/leave/student/${id}/reject/`,

    // Late Entries
    LATE_ENTRIES: "/api/v1/leave/late-entries/",
    LATE_ENTRY_DETAIL: (id: string) => `/api/v1/leave/late-entries/${id}/`,
  },
  PAYMENTS: {
    LIST: "/api/v1/payments/",
    RECORD: "/api/v1/payments/",
    VERIFY: (id: string | number) => `/api/v1/payments/${id}/verify/`,
  },
  BANK_ACCOUNTS: {
    LIST: "/api/v1/bank-accounts/",
    CREATE: "/api/v1/bank-accounts/",
    DETAIL: (id: string | number) => `/api/v1/bank-accounts/${id}/`,
  },
  REFUNDS: {
    LIST: "/api/v1/refunds/",
    CREATE: "/api/v1/refunds/create/",
    UPDATE: (id: string | number) => `/api/v1/refunds/${id}/`,
  },

  /** Inventory Management endpoints */
  INVENTORY: {
    CATEGORIES:          "/api/v1/inventory/categories/",
    CATEGORY_DETAIL:     (id: string) => `/api/v1/inventory/categories/${id}/`,

    ITEMS:               "/api/v1/inventory/items/",
    ITEM_DETAIL:         (id: string) => `/api/v1/inventory/items/${id}/`,

    TRANSACTIONS:        "/api/v1/inventory/transactions/",

    ALLOCATIONS:         "/api/v1/inventory/allocations/",
    ALLOCATION_DETAIL:   (id: string) => `/api/v1/inventory/allocations/${id}/`,
    ALLOCATION_RETURN:   (id: string) => `/api/v1/inventory/allocations/${id}/return_item/`,
    ALLOCATION_BULK:     "/api/v1/inventory/allocations/bulk_issue/",

    FORECAST:            "/api/v1/inventory/forecast/",
  },

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
} as const;
