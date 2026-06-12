import type { RoleDefinition, RoleId } from "@/types/role.types";

export const ROLES: Record<RoleId, RoleDefinition> = {
  super_admin: {
    id: "super_admin", label: "Super Admin", description: "Unrestricted access across all branches",
    color: "bg-red-100", textColor: "text-red-800",
    modules: ["dashboard","crm","students","courses_batches","classroom_timetable","timetable","attendance","fees","exams","exam_supervision","faculty","leave","chat","notifications","audit_logs","reports","payroll","settings","users"],
    canDelete: true, canExport: true,
  },
  branch_manager: {
    id: "branch_manager", label: "Branch Manager", description: "Controls a single assigned branch",
    color: "bg-purple-100", textColor: "text-purple-800",
    modules: ["dashboard","crm","students","courses_batches","classroom_timetable","timetable","attendance","fees","exams","leave","chat","notifications","audit_logs","reports"],
    canDelete: false, canExport: true,
  },
  admin_senior_executive: {
    id: "admin_senior_executive", label: "Admin Senior Executive", description: "Operational head for a branch",
    color: "bg-blue-100", textColor: "text-blue-800",
    modules: ["dashboard","crm","students","courses_batches","classroom_timetable","timetable","attendance","fees","exams","leave","chat","notifications","reports"],
    canDelete: false, canExport: true,
  },
  admin_executive: {
    id: "admin_executive", label: "Admin Executive", description: "Day-to-day data entry operator",
    color: "bg-sky-100", textColor: "text-sky-800",
    modules: ["dashboard","students","attendance","courses_batches","classroom_timetable","timetable"],
    canDelete: false, canExport: false,
  },
  front_desk: {
    id: "front_desk", label: "Front Desk", description: "Reception and inquiry intake",
    color: "bg-teal-100", textColor: "text-teal-800",
    modules: ["dashboard","crm"],
    canDelete: false, canExport: false,
  },
  counsellor: {
    id: "counsellor", label: "Counsellor", description: "Manages assigned leads through pipeline",
    color: "bg-cyan-100", textColor: "text-cyan-800",
    modules: ["dashboard","crm"],
    canDelete: false, canExport: false,
  },
  tele_caller: {
    id: "tele_caller", label: "Tele Caller", description: "Outreach and lead contact role",
    color: "bg-indigo-100", textColor: "text-indigo-800",
    modules: ["dashboard","crm"],
    canDelete: false, canExport: false,
  },
  sales_senior_executive: {
    id: "sales_senior_executive", label: "Sales Senior Executive", description: "Full CRM pipeline authority",
    color: "bg-violet-100", textColor: "text-violet-800",
    modules: ["dashboard","crm","reports"],
    canDelete: false, canExport: true,
  },
  sales_executive: {
    id: "sales_executive", label: "Sales Executive", description: "Lead assignment only",
    color: "bg-fuchsia-100", textColor: "text-fuchsia-800",
    modules: ["dashboard","crm","chat"],
    canDelete: false, canExport: false,
  },
  student: {
    id: "student", label: "Student", description: "Enrolled student — mobile app user",
    color: "bg-green-100", textColor: "text-green-800",
    modules: ["dashboard","attendance","courses_batches","classroom_timetable","exams","fees","chat","notifications"],
    canDelete: false, canExport: false,
  },
  parents: {
    id: "parents", label: "Parents", description: "Guardian linked to enrolled student(s)",
    color: "bg-emerald-100", textColor: "text-emerald-800",
    modules: ["dashboard","attendance","fees","exams","chat","notifications"],
    canDelete: false, canExport: false,
  },
  faculty: {
    id: "faculty", label: "Faculty", description: "Teaching staff member",
    color: "bg-amber-100", textColor: "text-amber-800",
    modules: ["dashboard","courses_batches","classroom_timetable","exams","attendance","leave","chat","notifications","payroll"],
    canDelete: false, canExport: false,
  },
  exam_supervisor: {
    id: "exam_supervisor", label: "Exam Supervisor", description: "On-ground exam operations",
    color: "bg-orange-100", textColor: "text-orange-800",
    modules: ["dashboard","exam_supervision","notifications","payroll"],
    canDelete: false, canExport: false,
  },
  paper_checker: {
    id: "paper_checker", label: "Paper Checker", description: "Evaluation-only role",
    color: "bg-yellow-100", textColor: "text-yellow-800",
    modules: ["dashboard","exams","notifications","payroll"],
    canDelete: false, canExport: false,
  },
  accountant: {
    id: "accountant", label: "Accountant", description: "Finance and billing role",
    color: "bg-lime-100", textColor: "text-lime-800",
    modules: ["dashboard","fees","payroll","reports","notifications"],
    canDelete: false, canExport: true,
  },
};
