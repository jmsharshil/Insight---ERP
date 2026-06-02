import type { ModuleId, RoleId } from "@/types/role.types";

export interface AuditLog {
  id: string;
  eventType: string;
  module: ModuleId;
  actingUser: string;
  actingUserRole: RoleId;
  affectedRecordId: string;
  affectedRecordType: string;
  description: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
  severity: "info" | "warning" | "critical";
}

const EVENTS: Array<{ event: string; module: ModuleId; severity: AuditLog["severity"]; desc: string }> = [
  { event: "fee_approved", module: "fees", severity: "info", desc: "Cash fee receipt approved" },
  { event: "fee_refund_issued", module: "fees", severity: "critical", desc: "Refund issued of ₹12,000" },
  { event: "leave_approved", module: "leave", severity: "info", desc: "Leave application approved" },
  { event: "leave_rejected", module: "leave", severity: "warning", desc: "Leave application rejected" },
  { event: "student_admitted", module: "students", severity: "info", desc: "New student record created" },
  { event: "student_record_modified", module: "students", severity: "warning", desc: "Student profile fields edited" },
  { event: "exam_result_published", module: "exams", severity: "info", desc: "Exam results published" },
  { event: "malpractice_reported", module: "exam_supervision", severity: "critical", desc: "Malpractice incident filed" },
  { event: "payroll_disbursed", module: "faculty", severity: "info", desc: "Payroll batch disbursed" },
  { event: "user_role_changed", module: "dashboard", severity: "critical", desc: "User role permission updated" },
  { event: "timetable_published", module: "timetable", severity: "info", desc: "Weekly timetable published" },
  { event: "attendance_override", module: "attendance", severity: "warning", desc: "Manual attendance override" },
];

const USERS: Array<{ name: string; role: RoleId }> = [
  { name: "Arjun Mehta", role: "super_admin" },
  { name: "Priya Sharma", role: "branch_manager" },
  { name: "Rahul Patel", role: "admin_senior_exec" },
  { name: "Sunita Gupta", role: "accountant" },
  { name: "Dr. Meera Nair", role: "faculty" },
];

export const AUDIT_LOGS: AuditLog[] = Array.from({ length: 50 }).map((_, i) => {
  const evt = EVENTS[i % EVENTS.length];
  const usr = USERS[i % USERS.length];
  return {
    id: `LOG-${String(i + 1).padStart(4, "0")}`,
    eventType: evt.event,
    module: evt.module,
    actingUser: usr.name,
    actingUserRole: usr.role,
    affectedRecordId: `REC-${String(i + 100).padStart(4, "0")}`,
    affectedRecordType: evt.module,
    description: evt.desc,
    beforeState: { status: "pending", amount: 15000 },
    afterState: { status: "approved", amount: 15000, approvedBy: usr.name },
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    ipAddress: `192.168.${i % 255}.${(i * 7) % 255}`,
    severity: evt.severity,
  };
});
