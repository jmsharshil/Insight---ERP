import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import SetPassPage from "@/pages/auth/SetPassPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import UnauthorizedPage from "@/pages/errors/UnauthorizedPage";
import DashboardRouter from "@/pages/dashboard/DashboardRouter";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import PageLoader from "@/components/common/PageLoader";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import LeadsInquiryForm from "@/components/forms/LeadsInquiryForm";
import StudentAdmissionForm from "@/components/forms/StudentAdmissionForm";
import StudentPaymentUploadForm from "@/components/forms/StudentPaymentUploadForm";

/* ─── Lazy-loaded pages ─────────────────────────────────────── */

const CRMPage = lazy(() => import("@/pages/crm/CRMPage"));
const StudentsPage = lazy(() => import("@/pages/students/StudentsPage"));
import StudentDetailPage from "@/pages/students/StudentDetailPage";
import StudentAdmissionDetailedPage from "@/pages/students/StudentAdmissionDetailedPage";
const CoursesBatchesPage = lazy(() => import("@/pages/courses-batches/CoursesBatchesPage"));
import CourseDetailPage from "@/pages/courses/CourseDetailPage";
import LevelDetailPage from "@/pages/courses/LevelDetailPage";
const SubjectQuestionBankPage = lazy(() => import("@/pages/courses/SubjectQuestionBankPage"));
import BatchDetailPage from "@/pages/courses-batches/BatchDetailPage";

const TimetablePage = lazy(() => import("@/pages/timetable/TimetablePage"));
const AttendancePage = lazy(() => import("@/pages/attendance/AttendancePage"));
import StudentAttendanceDetailPage from "@/pages/attendance/StudentAttendanceDetailPage";
import FacultyAttendanceDetailPage from "@/pages/attendance/FacultyAttendanceDetailPage";
const FeesPage = lazy(() => import("@/pages/fees/FeesPage"));
const ExamsPage = lazy(() => import("@/pages/exams/ExamsPage"));
const FacultyPage = lazy(() => import("@/pages/faculty/FacultyPage"));
import FacultyPayrollDetailPage from "@/pages/faculty/FacultyPayrollDetailPage";
const InventoryPage = lazy(() => import("@/pages/inventory/InventoryPage"));
const LeavePage = lazy(() => import("@/pages/leave/LeavePage"));

const ChatPage = lazy(() => import("@/pages/chat/ChatPage"));
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage"));
const AuditLogsPage = lazy(() => import("@/pages/audit-logs/AuditLogsPage"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const UsersPage = lazy(() => import("@/pages/users/UsersPage"));
const PayrollPage = lazy(() => import("@/pages/payroll/PayrollPage"));
const ResultsPage = lazy(() => import("@/pages/results/ResultsPage"));

/* ─── Helpers ───────────────────────────────────────────────── */

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

/**
 * Wraps a lazy-loaded component with Suspense + ErrorBoundary.
 * Use this for any page that is loaded via `lazy()`.
 */
function withSuspense(component: ReactNode) {
  return (
    <ErrorBoundary>
      <Suspense>{component}</Suspense>
    </ErrorBoundary>
  );
}

/* ─── Route Configuration ───────────────────────────────────── */

const router = createBrowserRouter([
  /* ── Public routes ─────────────────────────────────────────── */
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/api/auth/set-password",
    element: <SetPassPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/insight/public/lead-inquiry-form",
    element:<LeadsInquiryForm/>
  },
  {
    path: "/insight/student/admission-form",
    element:<StudentAdmissionForm/>
  },
  {
    path: "/insight/student/payment-upload",
    element:<StudentPaymentUploadForm/>
  },

  /* ── Protected routes (auth required, no specific module) ── */
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardRouter /> },
          { path: "/settings", element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },

  /* ── Module-gated routes ───────────────────────────────────
   *  Each module gets its own ProtectedRoute guard + AppShell.
   *  To add a new module: just add an entry to this array.
   * ────────────────────────────────────────────────────────── */
  ...[
    { module: "crm", path: "/crm", element: withSuspense(<CRMPage />) },
    { module: "students", path: "/students", element: withSuspense(<StudentsPage />) },
    { module: "students", path: "/students/:id", element: <StudentDetailPage /> },
    { module: "students", path: "/admissions/:id", element: <StudentAdmissionDetailedPage /> },
    { module: "courses_batches", path: "/courses-batches", element: withSuspense(<CoursesBatchesPage />) },
    { module: "courses_batches", path: "/courses-batches/:id", element: <CourseDetailPage /> },
    { module: "courses_batches", path: "/courses-batches/:courseId/level/:levelId", element: <LevelDetailPage /> },
    { module: "courses_batches", path: "/courses-batches/:courseId/level/:levelId/subject/:subjectId/questions", element: withSuspense(<SubjectQuestionBankPage />) },
    { module: "courses_batches", path: "/courses-batches/batch/:id", element: <BatchDetailPage /> },

    { module: "timetable", path: "/timetable", element: withSuspense(<TimetablePage />) },
    { module: "attendance", path: "/attendance", element: withSuspense(<AttendancePage />) },
    { module: "attendance", path: "/attendance/student/:id", element: <StudentAttendanceDetailPage /> },
    { module: "attendance", path: "/attendance/faculty/:id", element: <FacultyAttendanceDetailPage /> },
    
    { module: "fees", path: "/fees", element: withSuspense(<FeesPage />) },
    { module: "exams", path: "/exams", element: withSuspense(<ExamsPage />) },

    { module: "faculty", path: "/faculty", element: withSuspense(<FacultyPage />) },
    { module: "faculty", path: "/faculty/payroll/:id", element: <FacultyPayrollDetailPage /> },
    { module: "leave", path: "/leave", element: withSuspense(<LeavePage />) },
    { module: "chat", path: "/chat", element: withSuspense(<ChatPage />) },
    { module: "inventory", path: "/inventory", element: withSuspense(<InventoryPage />) },
    {
      module: "notifications",
      path: "/notifications",
      element: withSuspense(<NotificationsPage />),
    },
    { module: "audit_logs", path: "/audit-logs", element: withSuspense(<AuditLogsPage />) },
    { module: "reports", path: "/reports", element: withSuspense(<ReportsPage />) },
    { module: "payroll", path: "/payroll", element: withSuspense(<PayrollPage />) },
    { module: "users", path: "/users", element: withSuspense(<UsersPage />) },
    { module: "results", path: "/results", element: withSuspense(<ResultsPage />) },
  ].map(({ module, path, element }) => ({
    element: <ProtectedRoute module={module as any} />,
    children: [
      {
        element: <AppShell />,
        children: [{ path, element }],
      },
    ],
  })),

  /* ── Catch-all 404 ─────────────────────────────────────────── */
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
