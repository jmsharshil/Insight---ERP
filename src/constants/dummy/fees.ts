import { DUMMY_STUDENTS } from "./students";

export type FeeStatus = "pending" | "verified" | "approved" | "rejected" | "refund_pending" | "refunded";
export type PaymentMode = "online" | "cash" | "bank_transfer" | "cheque";

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  penaltyPerDay: number;
}

export interface FeeStructure {
  id: string;
  course: string;
  admissionFee: number;
  tuitionFee: number;
  examFee: number;
  miscFee: number;
  installments: Installment[];
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMode: PaymentMode;
  status: FeeStatus;
  screenshotUrl?: string;
  submittedBy: string;
  submittedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  transactionRef?: string;
  remarks?: string;
}

const COURSES = ["CA Foundation", "CS Executive", "CMA Inter", "B.Com", "MBA"];

export const FEE_STRUCTURES: FeeStructure[] = COURSES.map((c, i) => ({
  id: `FS-${i + 1}`,
  course: c,
  admissionFee: 5000,
  tuitionFee: 25000 + i * 5000,
  examFee: 2500,
  miscFee: 1500,
  installments: [
    { id: `${c}-i1`, dueDate: "2024-07-15", amount: 15000, penaltyPerDay: 50 },
    { id: `${c}-i2`, dueDate: "2024-10-15", amount: 15000, penaltyPerDay: 50 },
    { id: `${c}-i3`, dueDate: "2025-01-15", amount: 15000, penaltyPerDay: 50 },
  ],
}));

const MODES: PaymentMode[] = ["online", "cash", "bank_transfer", "cheque"];
const STATUSES: FeeStatus[] = ["pending", "approved", "approved", "verified", "rejected", "refund_pending", "approved"];

function daysAgo(d: number) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); }

export const DUMMY_FEE_TXNS: FeeTransaction[] = Array.from({ length: 40 }, (_, i) => {
  const s = DUMMY_STUDENTS[i % DUMMY_STUDENTS.length];
  const status = STATUSES[i % STATUSES.length];
  const mode = MODES[i % MODES.length];
  return {
    id: `RCP-2024-${String(i + 1).padStart(3, "0")}`,
    studentId: s.id,
    studentName: s.name,
    amount: 5000 + ((i * 1234) % 20) * 1000,
    paymentMode: mode,
    status,
    screenshotUrl: mode === "online" ? `https://placehold.co/600x400?text=Screenshot+${i + 1}` : undefined,
    submittedBy: s.name,
    submittedAt: daysAgo(i),
    verifiedBy: status !== "pending" ? "Sunita Gupta" : undefined,
    verifiedAt: status !== "pending" ? daysAgo(Math.max(0, i - 1)) : undefined,
    approvedBy: status === "approved" ? "Priya Sharma" : undefined,
    approvedAt: status === "approved" ? daysAgo(Math.max(0, i - 2)) : undefined,
    transactionRef: mode !== "cash" ? `TXN${1000 + i}` : undefined,
    remarks: status === "rejected" ? "Amount mismatch" : undefined,
  };
});

export const FEE_STATUS_META: Record<FeeStatus, { label: string; bg: string; color: string }> = {
  pending: { label: "Pending", bg: "bg-amber-100", color: "text-amber-700" },
  verified: { label: "Verified", bg: "bg-blue-100", color: "text-blue-700" },
  approved: { label: "Approved", bg: "bg-green-100", color: "text-green-700" },
  rejected: { label: "Rejected", bg: "bg-red-100", color: "text-red-700" },
  refund_pending: { label: "Refund Pending", bg: "bg-purple-100", color: "text-purple-700" },
  refunded: { label: "Refunded", bg: "bg-gray-200", color: "text-gray-700" },
};
