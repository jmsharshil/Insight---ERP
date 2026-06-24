export type RoleId =
  | "super_admin" | "branch_manager" | "admin_senior_executive" | "admin_executive"
  | "front_desk" | "counsellor" | "tele_caller" | "sales_senior_executive"
  | "sales_executive" | "student" | "parents" | "faculty"
  | "exam_supervisor" | "paper_checker" | "accountant" | "settings" | "users"
  | "security" | "house_keeping";

export type ModuleId =
  | "crm" | "students" | "courses_batches" | "timetable" | "attendance" | "fees"
  | "exams" | "exam_supervision" | "faculty" | "leave" | "chat" 
  | "notifications" | "audit_logs" | "reports" | "payroll" | "dashboard" | "settings" | "users" | "inventory";

export interface RoleDefinition {
  id: RoleId;
  label: string;
  description: string;
  color: string;  
  textColor: string;
  modules: ModuleId[];
  canDelete: boolean;
  canExport: boolean;
}
