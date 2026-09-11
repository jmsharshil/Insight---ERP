export type ReimbursementStatus = "pending" | "approved" | "rejected";

export interface Reimbursement {
  id: string;
  user: string; // UUID
  user_name: string;
  user_email: string;
  user_role: string;
  branch: string; // UUID
  branch_name: string;
  title: string;
  description: string;
  amount: string; // string decimal
  proof: string; // URL
  expense_date: string;
  status: ReimbursementStatus;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
  rejection_reason: string;
  payroll_run: string | null;
  payroll_month: number | null;
  payroll_year: number | null;
  payslip: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReimbursementSummary {
  total_claims: number;
  total_amount: string;
  pending_count: number;
  pending_amount: string;
  approved_count: number;
  approved_amount: string;
  rejected_count: number;
  rejected_amount: string;
  paid_count: number;
  paid_amount: string;
}

export interface ReimbursementFilters {
  my?: boolean | number;
  status?: ReimbursementStatus | "";
  user_id?: string;
  branch_id?: string;
  from_date?: string;
  to_date?: string;
  month?: number;
  year?: number;
}
