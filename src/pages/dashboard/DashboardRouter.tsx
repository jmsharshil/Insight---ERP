import { useAuth } from "@/hooks/useAuth";
import type { RoleId } from "@/types/role.types";
import SuperAdminDashboard from "@/pages/dashboard/SuperAdminDashboard";
import BranchManagerDashboard from "@/pages/dashboard/BranchManagerDashboard";
import AdminSeniorExecDashboard from "@/pages/dashboard/AdminSeniorExecDashboard";
import AdminExecDashboard from "@/pages/dashboard/AdminExecDashboard";
import FrontDeskDashboard from "@/pages/dashboard/FrontDeskDashboard";
import CounsellorDashboard from "@/pages/dashboard/CounsellorDashboard";
import TelecallerDashboard from "@/pages/dashboard/TelecallerDashboard";
import SalesSeniorExecDashboard from "@/pages/dashboard/SalesSeniorExecDashboard";
import SalesExecDashboard from "@/pages/dashboard/SalesExecDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import ParentDashboard from "@/pages/dashboard/ParentDashboard";
import FacultyDashboard from "@/pages/dashboard/FacultyDashboard";
import ExamSupervisorDashboard from "@/pages/dashboard/ExamSupervisorDashboard";
import PaperCheckerDashboard from "@/pages/dashboard/PaperCheckerDashboard";
import AccountantDashboard from "@/pages/dashboard/AccountantDashboard";

const DASHBOARDS: Record<RoleId, React.ComponentType> = {
  super_admin: SuperAdminDashboard,
  branch_manager: BranchManagerDashboard,
  admin_senior_executive: AdminSeniorExecDashboard,
  admin_executive: AdminExecDashboard,
  front_desk: FrontDeskDashboard,
  counsellor: CounsellorDashboard,
  tele_caller: TelecallerDashboard,
  sales_senior_executive: SalesSeniorExecDashboard,
  sales_executive: SalesExecDashboard,
  student: StudentDashboard,
  parents: ParentDashboard,
  faculty: FacultyDashboard,
  exam_supervisor: ExamSupervisorDashboard,
  paper_checker: PaperCheckerDashboard,
  accountant: AccountantDashboard,
};

export default function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  const Dashboard = DASHBOARDS[user.role];
  return <Dashboard />;
}
