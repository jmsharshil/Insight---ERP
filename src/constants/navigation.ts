import {
  LayoutDashboard, Users, GraduationCap, Calendar, ScanLine, CreditCard,
  BookOpen, Eye, Briefcase, CalendarOff, MessageSquare, Bell, FileText,
  BarChart3, Wallet, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ModuleId } from "@/types/role.types";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export const NAV_ITEMS: Record<ModuleId, NavItem> = {
  dashboard:        { label: "Branch",        icon: LayoutDashboard, path: "/dashboard" },
  crm:              { label: "CRM & Leads", icon: Users,           path: "/crm" },
  students:         { label: "Students & Admissions",         icon: GraduationCap,   path: "/students" },
  timetable:        { label: "Timetable",        icon: Calendar,        path: "/timetable" },
  attendance:       { label: "Attendance",       icon: ScanLine,        path: "/attendance" },
  fees:             { label: "Fees",             icon: CreditCard,      path: "/fees" },
  exams:            { label: "Exams",            icon: BookOpen,        path: "/exams" },
  exam_supervision: { label: "Exam Supervision", icon: Eye,             path: "/exam-supervision" },
  faculty:          { label: "Faculty & Payroll",icon: Briefcase,       path: "/faculty" },
  leave:            { label: "Leave Management", icon: CalendarOff,     path: "/leave" },
  chat:             { label: "Messages",         icon: MessageSquare,   path: "/chat" },
  notifications:    { label: "Notifications",    icon: Bell,            path: "/notifications" },
  audit_logs:       { label: "Audit Logs",       icon: FileText,        path: "/audit-logs" },
  reports:          { label: "Reports",          icon: BarChart3,       path: "/reports" },
  payroll:          { label: "My Payroll",       icon: Wallet,          path: "/payroll" },
  settings:         { label: "Settings",         icon: Settings,        path: "/settings" },
  users:            { label: "Users",            icon: Users,           path: "/users" },
};
