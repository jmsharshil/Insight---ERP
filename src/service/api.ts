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
        DETAIL: (courseId: string | number, levelId: string | number) => `/api/v1/courses/${courseId}/levels/${levelId}/`,
        UPDATE: (courseId: string | number, levelId: string | number) => `/api/v1/courses/${courseId}/levels/${levelId}/`,
        DELETE: (courseId: string | number, levelId: string | number) => `/api/v1/courses/${courseId}/levels/${levelId}/`,
      },
    },

    /** Batches endpoints */
    BATCHES: {
      LIST: "/api/v1/batches/",
      CREATE: "/api/v1/batches/",
      DETAIL: (id: string | number) => `/api/v1/batches/${id}/`,
      UPDATE: (id: string | number) => `/api/v1/batches/${id}/`,
      DELETE: (id: string | number) => `/api/v1/batches/${id}/`,
      ASSIGN_STUDENT: (id: string | number,) => `/api/v1/batches/${id}/assign-students/`,
      REMOVE_STUDENT: (id: string | number, student_id: string | number) => `/api/v1/batches/${id}/remove-student/${student_id}/`,
      ASSIGN_FACULTY: (id: string | number,) => `/api/v1/batches/${id}/assign-faculty/`,
      REMOVE_FACULTY: (id: string | number, faculty_id: string | number) => `/api/v1/batches/${id}/remove-faculty/${faculty_id}/`,
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
      UPDATE: (subjectId: string | number, chapterId: string | number) => `/api/v1/subjects/${subjectId}/chapters/${chapterId}/`,
      DELETE: (subjectId: string | number, chapterId: string | number) => `/api/v1/subjects/${subjectId}/chapters/${chapterId}/`,
    },

    /** Reports endpoints */
    REPORTS: {
      LEADS: "/api/v1/reports/leads/",
    },

    /** Attendance endpoints */
    ATTENDANCE: {
      LIST: (params?: Record<string, any>) => {
        const base = "/api/v1/attendance/";
        if (!params || Object.keys(params).length === 0) return base;
        const cleanParams = Object.fromEntries(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => [k, String(v)])
        );
        if (Object.keys(cleanParams).length === 0) return base;
        const qs = new URLSearchParams(cleanParams).toString();
        return `${base}?${qs}`;
      },
      REPORT: (params?: Record<string, any>) => {
        const base = "/api/v1/attendance/report/";
        if (!params || Object.keys(params).length === 0) return base;
        const cleanParams = Object.fromEntries(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => [k, String(v)])
        );
        if (Object.keys(cleanParams).length === 0) return base;
        const qs = new URLSearchParams(cleanParams).toString();
        return `${base}?${qs}`;
      },
    },
} as const;

