import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import UnauthorizedPage from "@/pages/errors/UnauthorizedPage";
import DashboardRouter from "@/pages/dashboard/DashboardRouter";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import PageLoader from "@/components/common/PageLoader";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";

const CRMPage = lazy(() => import("@/pages/crm/CRMPage"));
const StudentsPage = lazy(() => import("@/pages/students/StudentsPage"));
const StudentDetailPage = lazy(() => import("@/pages/students/StudentDetailPage"));
const TimetablePage = lazy(() => import("@/pages/timetable/TimetablePage"));
const AttendancePage = lazy(() => import("@/pages/attendance/AttendancePage"));
const FeesPage = lazy(() => import("@/pages/fees/FeesPage"));
const ExamsPage = lazy(() => import("@/pages/exams/ExamsPage"));
const FacultyPage = lazy(() => import("@/pages/faculty/FacultyPage"));
const LeavePage = lazy(() => import("@/pages/leave/LeavePage"));
const ExamSupervisionPage = lazy(() => import("@/pages/exam-supervision/ExamSupervisionPage"));
const ChatPage = lazy(() => import("@/pages/chat/ChatPage"));
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage"));
const AuditLogsPage = lazy(() => import("@/pages/audit-logs/AuditLogsPage"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function Lazy({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/settings" element={<Lazy><SettingsPage /></Lazy>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute module="crm" />}>
        <Route element={<AppShell />}>
          <Route path="/crm" element={<Lazy><CRMPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="students" />}>
        <Route element={<AppShell />}>
          <Route path="/students" element={<Lazy><StudentsPage /></Lazy>} />
          <Route path="/students/:id" element={<Lazy><StudentDetailPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="timetable" />}>
        <Route element={<AppShell />}>
          <Route path="/timetable" element={<Lazy><TimetablePage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="attendance" />}>
        <Route element={<AppShell />}>
          <Route path="/attendance" element={<Lazy><AttendancePage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="fees" />}>
        <Route element={<AppShell />}>
          <Route path="/fees" element={<Lazy><FeesPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="exams" />}>
        <Route element={<AppShell />}>
          <Route path="/exams" element={<Lazy><ExamsPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="exam_supervision" />}>
        <Route element={<AppShell />}>
          <Route path="/exam-supervision" element={<Lazy><ExamSupervisionPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="faculty" />}>
        <Route element={<AppShell />}>
          <Route path="/faculty" element={<Lazy><FacultyPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="leave" />}>
        <Route element={<AppShell />}>
          <Route path="/leave" element={<Lazy><LeavePage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="chat" />}>
        <Route element={<AppShell />}>
          <Route path="/chat" element={<Lazy><ChatPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="notifications" />}>
        <Route element={<AppShell />}>
          <Route path="/notifications" element={<Lazy><NotificationsPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="audit_logs" />}>
        <Route element={<AppShell />}>
          <Route path="/audit-logs" element={<Lazy><AuditLogsPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="reports" />}>
        <Route element={<AppShell />}>
          <Route path="/reports" element={<Lazy><ReportsPage /></Lazy>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute module="payroll" />}>
        <Route element={<AppShell />}>
          <Route path="/payroll" element={<ModulePlaceholder title="My Payroll" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
