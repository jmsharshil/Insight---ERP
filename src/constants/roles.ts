import type { RoleDefinition, RoleId } from "@/types/role.types";

/**
 * NOTE: "dashboard" and "reports" modules have been hidden from all roles for now
 * because they only contain dummy data. Add them back to the modules arrays once
 * real data is integrated.
 */
export const ROLES: Record<RoleId, RoleDefinition> = {
  super_admin: {
    id: "super_admin", label: "Super Admin", description: "Unrestricted access across all branches",
    color: "bg-red-100", textColor: "text-red-800",
    modules: ["dashboard","crm","students","courses_batches","timetable","attendance","fees","exams","results","faculty","leave","chat","inventory","notifications","audit_logs","payroll","settings","users","support"],
    canDelete: true, canExport: true,
  },
  branch_manager: {
    id: "branch_manager", label: "Branch Manager", description: "Controls a single assigned branch",
    color: "bg-purple-100", textColor: "text-purple-800",
    modules: ["dashboard","crm","students","courses_batches","timetable","attendance","fees","exams","results","faculty","payroll","leave","chat","notifications","audit_logs","settings","support"],
    canDelete: false, canExport: true,
  },
  admin_senior_executive: {
    id: "admin_senior_executive", label: "Admin Senior Executive", description: "Operational head for a branch",
    color: "bg-blue-100", textColor: "text-blue-800",
    modules: ["dashboard","crm","students","courses_batches","timetable","attendance","fees","exams","results","leave","chat","notifications","payroll","settings","support"],
    canDelete: false, canExport: true,
  },
  admin_executive: {
    id: "admin_executive", label: "Admin Executive", description: "Day-to-day data entry operator",
    color: "bg-sky-100", textColor: "text-sky-800",
    modules: ["dashboard","students","attendance","courses_batches","timetable","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  front_desk: {
    id: "front_desk", label: "Front Desk", description: "Reception and inquiry intake",
    color: "bg-teal-100", textColor: "text-teal-800",
    modules: ["dashboard","crm","attendance","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  counsellor: {
    id: "counsellor", label: "Counsellor", description: "Manages assigned leads through pipeline",
    color: "bg-cyan-100", textColor: "text-cyan-800",
    modules: ["dashboard","crm","students","attendance","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  tele_caller: {
    id: "tele_caller", label: "Telecaller", description: "Outreach and lead contact role",
    color: "bg-indigo-100", textColor: "text-indigo-800",
    modules: ["dashboard","crm","attendance","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  sales_senior_executive: {
    id: "sales_senior_executive", label: "Sales Senior Executive", description: "Full CRM pipeline authority",
    color: "bg-violet-100", textColor: "text-violet-800",
    modules: ["dashboard","crm","attendance","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: true,
  },
  sales_executive: {
    id: "sales_executive", label: "Sales Executive", description: "Lead assignment only",
    color: "bg-fuchsia-100", textColor: "text-fuchsia-800",
    modules: ["dashboard","crm","attendance","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  student: {
    id: "student", label: "Student", description: "Enrolled student — mobile app user",
    color: "bg-green-100", textColor: "text-green-800",
    modules: ["dashboard", "timetable","attendance","courses_batches","exams","fees","leave","chat","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  parents: {
    id: "parents", label: "Parents", description: "Guardian linked to enrolled student(s)",
    color: "bg-emerald-100", textColor: "text-emerald-800",
    modules: ["dashboard","timetable","attendance","courses_batches","fees","exams","leave","chat","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  faculty: {
    id: "faculty", label: "Faculty", description: "Teaching staff member",
    color: "bg-amber-100", textColor: "text-amber-800",
    modules: ["dashboard","timetable","attendance","exams","leave","chat","notifications","payroll","settings","support"],
    canDelete: false, canExport: false,
  },
  exam_supervisor: {
    id: "exam_supervisor", label: "Exam Supervisor", description: "On-ground exam operations",
    color: "bg-orange-100", textColor: "text-orange-800",
    modules: ["dashboard","attendance","exams","leave","notifications","payroll","settings","support"],
    canDelete: false, canExport: false,
  },
  paper_checker: {
    id: "paper_checker", label: "Paper Checker", description: "Evaluation-only role",
    color: "bg-yellow-100", textColor: "text-yellow-800",
    modules: ["dashboard","exams","leave","notifications","payroll","settings","support"],
    canDelete: false, canExport: false,
  },
  accountant: {
    id: "accountant", label: "Accountant", description: "Finance and billing role",
    color: "bg-lime-100", textColor: "text-lime-800",
    modules: ["dashboard","attendance","fees","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: true,
  },
  security: {
    id: "security", label: "Security", description: "Campus security personnel",
    color: "bg-slate-100", textColor: "text-slate-800",
    modules: ["dashboard","attendance","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
  house_keeping: {
    id: "house_keeping", label: "House Keeping", description: "Maintenance and house keeping staff",
    color: "bg-pink-100", textColor: "text-pink-800",
    modules: ["dashboard","attendance","leave","payroll","notifications","settings","support"],
    canDelete: false, canExport: false,
  },
};
