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

const DASHBOARDS: Partial<Record<RoleId, React.ComponentType>> = {
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

import ModulePlaceholder from "@/pages/ModulePlaceholder";

export default function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === "student") {
    return <StudentDashboard />;
  }

  return <ModulePlaceholder title="Dashboard" />;
}

export function DashboardRouterOld() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const Dashboard = DASHBOARDS[user.role as RoleId];
  
  if (!Dashboard) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Dashboard Not Found</h2>
          <p className="text-muted-foreground">
            No dashboard component is configured for your role ({user.role || "unknown"}).
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
