export type LeaveType = "PL" | "SL" | "CL" | "Special";
export type LeaveStatus = "pending" | "approved_by_admin_sr" | "approved" | "rejected";

export interface LeaveApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  document?: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface LeaveBalance {
  facultyId: string;
  PL: { total: number; used: number; remaining: number };
  SL: { total: number; used: number; remaining: number };
  CL: { total: number; used: number; remaining: number };
  Special: { total: number; used: number; remaining: number };
}

const NAMES = [
  "Dr. Meera Nair", "Prof. Rakesh Sinha", "Ms. Anjali Kapoor", "Mr. Vikram Rao",
  "Neha Joshi", "Rahul Patel", "Sneha Rao", "Amit Verma",
];
const TYPES: LeaveType[] = ["PL", "SL", "CL", "Special"];
const STATUSES: LeaveStatus[] = ["pending", "approved", "rejected", "approved_by_admin_sr"];

export const LEAVE_APPLICATIONS: LeaveApplication[] = Array.from({ length: 20 }).map((_, i) => {
  const from = new Date(Date.now() - (i - 5) * 86400000);
  const days = (i % 4) + 1;
  const to = new Date(from.getTime() + (days - 1) * 86400000);
  const status = STATUSES[i % STATUSES.length];
  return {
    id: `LVE-${String(i + 1).padStart(3, "0")}`,
    applicantId: `u${String(i + 100)}`,
    applicantName: NAMES[i % NAMES.length],
    applicantRole: i % 3 === 0 ? "Faculty" : i % 3 === 1 ? "Admin Executive" : "Counsellor",
    leaveType: TYPES[i % 4],
    fromDate: from.toISOString().slice(0, 10),
    toDate: to.toISOString().slice(0, 10),
    totalDays: days,
    reason: ["Family function", "Medical appointment", "Personal work", "Travel"][i % 4],
    status,
    appliedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    reviewedBy: status !== "pending" ? "Rahul Patel" : undefined,
    rejectionReason: status === "rejected" ? "Insufficient notice period" : undefined,
  };
});

export const LEAVE_BALANCES: LeaveBalance[] = Array.from({ length: 8 }).map((_, i) => ({
  facultyId: `FAC-${String(i + 1).padStart(3, "0")}`,
  PL: { total: 12, used: i + 2, remaining: 12 - (i + 2) },
  SL: { total: 10, used: i, remaining: 10 - i },
  CL: { total: 6, used: i % 5, remaining: 6 - (i % 5) },
  Special: { total: 5, used: i % 3, remaining: 5 - (i % 3) },
}));

export function calculateLeaveDays(from: string, to: string): { days: number; weekendsIncluded: number } {
  if (!from || !to) return { days: 0, weekendsIncluded: 0 };
  const start = new Date(from);
  const end = new Date(to);
  if (end < start) return { days: 0, weekendsIncluded: 0 };
  let days = 0;
  let weekends = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    days++;
    if (d === 0 || d === 6) weekends++;
    cur.setDate(cur.getDate() + 1);
  }
  // Sandwich rule: if leave spans across weekend, include those days
  return { days, weekendsIncluded: weekends };
}
