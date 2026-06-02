export type NotificationEventType =
  | "fee_due" | "fee_paid" | "fee_approved" | "exam_scheduled" | "exam_result_published"
  | "attendance_low" | "attendance_delay" | "leave_approved" | "leave_rejected"
  | "lead_assigned" | "lead_converted" | "session_assigned" | "session_cancelled"
  | "payroll_disbursed" | "supervisor_assigned" | "malpractice_reported"
  | "refund_requested" | "message_received" | "chat_mention" | "announcement";

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  body: string;
  recipientId: string;
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  priority: "high" | "normal" | "low";
}

const TEMPLATES: Array<{ type: NotificationEventType; title: string; body: string; url?: string; priority: AppNotification["priority"] }> = [
  { type: "fee_due", title: "Fee installment due", body: "Your 2nd installment of ₹15,000 is due on 15 May.", url: "/fees", priority: "high" },
  { type: "fee_paid", title: "Payment received", body: "We received your payment of ₹15,000.", url: "/fees", priority: "normal" },
  { type: "fee_approved", title: "Fee approved", body: "Branch Manager approved the cash payment receipt.", url: "/fees", priority: "normal" },
  { type: "exam_scheduled", title: "New exam scheduled", body: "JEE Mock Test 6 scheduled for next Monday.", url: "/exams", priority: "normal" },
  { type: "exam_result_published", title: "Results published", body: "Physics sectional results are out.", url: "/exams", priority: "high" },
  { type: "attendance_low", title: "Low attendance alert", body: "Your attendance dropped below 75%.", url: "/attendance", priority: "high" },
  { type: "attendance_delay", title: "Attendance entry delay", body: "Attendance not marked for Batch A2.", url: "/attendance", priority: "high" },
  { type: "leave_approved", title: "Leave approved", body: "Your CL from 10 May to 11 May was approved.", url: "/leave", priority: "normal" },
  { type: "leave_rejected", title: "Leave rejected", body: "Your SL request was rejected. Reason: Insufficient notice.", url: "/leave", priority: "high" },
  { type: "lead_assigned", title: "New lead assigned", body: "Lead LD-042 was assigned to you.", url: "/crm", priority: "normal" },
  { type: "lead_converted", title: "Lead converted", body: "Lead LD-021 was converted to a student!", url: "/students", priority: "normal" },
  { type: "session_assigned", title: "Session assigned", body: "You have a Physics class at 10 AM tomorrow.", url: "/timetable", priority: "normal" },
  { type: "session_cancelled", title: "Session cancelled", body: "Tomorrow's Chemistry class is cancelled.", url: "/timetable", priority: "normal" },
  { type: "payroll_disbursed", title: "Payroll disbursed", body: "May payslip of ₹52,800 sent to your account.", url: "/payroll", priority: "normal" },
  { type: "supervisor_assigned", title: "Supervision duty", body: "You are assigned as supervisor for JEE Mock 5.", url: "/exam-supervision", priority: "normal" },
  { type: "malpractice_reported", title: "Malpractice reported", body: "Incident reported during Room 102 exam.", url: "/exam-supervision", priority: "high" },
  { type: "refund_requested", title: "Refund requested", body: "A refund request was submitted by student STU-007.", url: "/fees", priority: "high" },
  { type: "message_received", title: "New message", body: "You have 3 unread messages.", url: "/chat", priority: "low" },
  { type: "chat_mention", title: "You were mentioned", body: "Priya mentioned you in JEE-A1 group.", url: "/chat", priority: "normal" },
  { type: "announcement", title: "Institute announcement", body: "Holiday on 20 May for elections.", priority: "low" },
];

export const NOTIFICATIONS: AppNotification[] = Array.from({ length: 30 }).map((_, i) => {
  const t = TEMPLATES[i % TEMPLATES.length];
  const daysAgo = Math.floor(i / 5);
  return {
    id: `NOT-${String(i + 1).padStart(3, "0")}`,
    type: t.type,
    title: t.title,
    body: t.body,
    recipientId: "u010",
    isRead: i > 7,
    timestamp: new Date(Date.now() - daysAgo * 86400000 - i * 1800000).toISOString(),
    actionUrl: t.url,
    priority: t.priority,
  };
});
