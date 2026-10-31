import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Sliders, CheckCircle2, Send, Users, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { ROLES } from "@/constants/roles";
import { setPayslips, setPayslipsLoading } from "@/redux/slices/payrollSlice";
import type { PaySlip } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PayslipAdjustSheet from "../components/PayslipAdjustSheet";

const DeductionNoteCell = ({ row }: { row: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalDeduct =
    Number(row.late_penalty || 0) +
    Number(row.leave_deductions || 0) +
    Number(row.absence_deductions || 0) +
    Number(row.retention_deduction || 0) +
    Number(row.other_deductions || 0);

  const hasLogs = Array.isArray(row.per_day_deduction_log) && row.per_day_deduction_log.length > 0;
  const hasNote = !!row.deduction_note && row.deduction_note.trim().length > 0;

  if (totalDeduct === 0 && !hasNote && !hasLogs) {
    return <span className="text-muted-foreground">—</span>;
  }

  const parts: string[] = [];
  let current = "";
  if (hasNote) {
    row.deduction_note.split(/,\s*/).forEach((chunk: string) => {
      const isStartOfNew =
        /^Absent/i.test(chunk) ||
        /^Late check-in\/out/i.test(chunk) ||
        /^Leave/i.test(chunk) ||
        /^Retention/i.test(chunk) ||
        /^Other/i.test(chunk);

      if (current && /:\s*-?\d+(\.\d+)?\s*$/.test(current)) {
        parts.push(current);
        current = chunk;
      } else if (isStartOfNew && current) {
        parts.push(current);
        current = chunk;
      } else {
        if (current) current += ", " + chunk;
        else current = chunk;
      }
    });
    if (current) parts.push(current);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-primary hover:text-primary/80 mt-1 text-xs"
        onClick={() => setIsOpen(true)}
      >
        View Deductions
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 pr-6">
              <div>
                <DialogTitle className="text-base font-semibold">Deduction Details</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.faculty_name} ({row.employee_id})
                </p>
              </div>
              <span className="font-mono text-sm text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-md border border-red-100 whitespace-nowrap">
                Total: - ₹{totalDeduct.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </DialogHeader>

          <div className="py-2 flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Category Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Number(row.absence_deductions || 0) > 0 && (
                <div className="bg-red-50/60 border border-red-100 rounded-lg p-2.5">
                  <div className="text-[11px] text-muted-foreground font-medium">Absence Deductions</div>
                  <div className="font-mono text-xs font-semibold text-red-600 mt-0.5">
                    - ₹{Number(row.absence_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              {Number(row.leave_deductions || 0) > 0 && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-2.5">
                  <div className="text-[11px] text-muted-foreground font-medium">Leave Deductions</div>
                  <div className="font-mono text-xs font-semibold text-amber-700 mt-0.5">
                    - ₹{Number(row.leave_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              {Number(row.retention_deduction || 0) > 0 && (
                <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-2.5">
                  <div className="text-[11px] text-muted-foreground font-medium">Retention Deductions</div>
                  <div className="font-mono text-xs font-semibold text-purple-700 mt-0.5">
                    - ₹{Number(row.retention_deduction).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              {(Number(row.late_penalty || 0) > 0 || Number(row.late_penalty_minutes || 0) > 0) && (
                <div className="bg-orange-50/60 border border-orange-100 rounded-lg p-2.5">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Late Penalty {row.late_penalty_minutes ? `(${row.late_penalty_minutes} mins)` : ""}
                  </div>
                  <div className="font-mono text-xs font-semibold text-orange-700 mt-0.5">
                    - ₹{Number(row.late_penalty || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              {Number(row.other_deductions || 0) > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <div className="text-[11px] text-muted-foreground font-medium">Other Deductions</div>
                  <div className="font-mono text-xs font-semibold text-slate-700 mt-0.5">
                    - ₹{Number(row.other_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>

            {/* Parsed Deduction Note Cards */}
            {parts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Deduction Notes & Absences
                </h4>
                {parts.map((part, idx) => {
                  const match = part.match(/^(.*?):\s*(-?\d+(\.\d+)?)\s*$/);
                  let text = part;
                  let amount: string | null = null;

                  if (match) {
                    text = match[1].trim();
                    amount = match[2];
                  } else {
                    text = text.trim();
                  }

                  let title = text;
                  let dates: string[] = [];
                  let subtitle = "";

                  const absenceMatch = text.match(/^Absent(?: \(\d+ days?\))? on (.*)/i);
                  const lateMatch = text.match(/^Late check-in\/out on (.*?)(?:\s*\(([^)]+)\))?$/i);
                  const retentionMatch = text.match(/^Retention(?:\s*\(([^)]+)\))?/i);

                  if (absenceMatch) {
                    title = "Absence Deductions";
                    dates = absenceMatch[1].split(/,\s*/);
                    subtitle = `${dates.length} day${dates.length > 1 ? "s" : ""} absent`;
                  } else if (lateMatch) {
                    title = "Late Check-in/Out";
                    dates = lateMatch[1].split(/,\s*/);
                    subtitle = lateMatch[2] || `${dates.length} instance${dates.length > 1 ? "s" : ""}`;
                  } else if (retentionMatch) {
                    title = "Retention Deduction";
                    subtitle = retentionMatch[1] ? `Rate: ${retentionMatch[1]}` : "";
                  }

                  const parsedAmount =
                    amount !== null
                      ? Math.abs(Number(amount))
                      : title === "Absence Deductions" && Number(row.absence_deductions || 0) > 0
                        ? Number(row.absence_deductions)
                        : title === "Retention Deduction" && Number(row.retention_deduction || 0) > 0
                          ? Number(row.retention_deduction)
                          : null;

                  return (
                    <div key={idx} className="bg-white p-3.5 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h5 className="font-medium text-xs text-foreground">{title}</h5>
                          {subtitle && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {subtitle}
                            </p>
                          )}
                        </div>
                        {parsedAmount !== null && (
                          <span className="font-mono text-xs text-red-600 font-medium shrink-0 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            - ₹{parsedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      {dates.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {dates.map((d, i) => (
                            <Badge key={`${d}-${i}`} variant="outline" className="text-[10px] font-normal bg-slate-50 text-slate-600 border-slate-200 py-0">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-Day Deduction Log Table */}
            {hasLogs && (
              <div className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Per-Day Attendance & Deduction Log ({row.per_day_deduction_log.length})
                </h4>
                <div className="border border-border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Hours</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Late Mins</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Penalty</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Deduction</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {row.per_day_deduction_log.map((log: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-mono">{log.date}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{log.total_hours ?? "0.00"}h</td>
                          <td className="px-3 py-1.5 text-right font-mono">{log.late_minutes ?? log.penalty_minutes ?? 0}m</td>
                          <td className="px-3 py-1.5 text-right font-mono text-red-600">
                            ₹{Number(log.penalty_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-red-600">
                            ₹{Number(log.deduction || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">
                            ₹{Number(log.net_salary || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ReimbursementNoteCell = ({ row }: { row: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  const notes = Array.isArray(row.reimbursement_notes) ? row.reimbursement_notes : [];
  const singleNote = row.reimbursement_note;

  if (notes.length === 0 && !singleNote && Number(row.reimbursements_amount || 0) === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-primary hover:text-primary/80 mt-1 text-xs"
        onClick={() => setIsOpen(true)}
      >
        {notes.length > 0 ? `View Notes (${notes.length})` : "View Note"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 pr-6">
              <div>
                <DialogTitle className="text-base font-semibold">Reimbursement Details</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.faculty_name} ({row.employee_id})
                </p>
              </div>
              <span className="font-mono text-sm text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-md border border-green-100 whitespace-nowrap">
                Total: ₹{Number(row.reimbursements_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </DialogHeader>

          <div className="py-2 flex-1 overflow-y-auto space-y-3 pr-1">
            {notes.length > 0 ? (
              notes.map((note: any, idx: number) => (
                <div key={idx} className="bg-white p-3.5 rounded-lg border border-border shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h5 className="font-medium text-xs text-foreground">
                        {note.event || "Reimbursement / Claim"}
                      </h5>
                      {note.description && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {note.description}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-xs text-green-600 font-medium shrink-0 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                      ₹{Number(note.expense || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {note.date && (
                      <Badge variant="outline" className="text-[10px] font-normal bg-slate-50 text-slate-600 border-slate-200 py-0">
                        {note.date}
                      </Badge>
                    )}
                    {note.kms ? (
                      <Badge variant="outline" className="text-[10px] font-normal bg-blue-50 text-blue-600 border-blue-200 py-0">
                        {note.kms} kms
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ))
            ) : singleNote ? (
              <div className="bg-white p-4 rounded-lg border border-border shadow-sm text-xs text-foreground">
                {singleNote}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No reimbursement details recorded.
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  disbursed: "bg-blue-100 text-blue-700",
};

const MONTH_NAMES: Record<number, string> = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

export default function PayslipsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { payslips, payslipsLoading, selectedRun } = useSelector((s: RootState) => s.payroll);

  const [roleFilter, setRoleFilter] = useState("all");
  const [adjustTarget, setAdjustTarget] = useState<PaySlip | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [runStats, setRunStats] = useState<{ total_salary_sum?: string | number; count?: number } | null>(null);

  const role = user?.role ?? "";
  const canApprove = ["super_admin", "branch_manager"].includes(role);
  const canDisburse = ["super_admin", "accountant"].includes(role);
  const canAdjust = ["super_admin", "branch_manager", "accountant"].includes(role);

  useEffect(() => {
    if (!selectedRun) return;
    dispatch({
      type: payrollActions.GET_PAYSLIPS,
      method: "GET",
      endPoint: API.PAYROLL.PAYSLIPS(selectedRun.id) + (roleFilter !== "all" ? `?role=${roleFilter}` : ""),
      auth: true,
      setLoading: (v: boolean) => dispatch(setPayslipsLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        dispatch(setPayslips(data));
        if (res?.total_salary_sum !== undefined || res?.count !== undefined) {
          setRunStats({
            total_salary_sum: res.total_salary_sum,
            count: res.count,
          });
        }
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to load payslips"),
    });
  }, [selectedRun, roleFilter]);

  const triggerAction = (type: "approve" | "disburse") => {
    if (!selectedRun) return;
    const cfg = {
      approve: {
        actionType: payrollActions.APPROVE_RUN,
        endPoint: API.PAYROLL.APPROVE(selectedRun.id),
        msg: "Payroll approved.",
      },
      disburse: {
        actionType: payrollActions.DISBURSE_RUN,
        endPoint: API.PAYROLL.DISBURSE(selectedRun.id),
        msg: "Payroll disbursed.",
      },
    }[type];

    dispatch({
      type: cfg.actionType,
      method: "POST",
      endPoint: cfg.endPoint,
      auth: true,
      setLoading: (v: boolean) => setActionLoading(v),
      getResponse: () => {
        toast.success(cfg.msg);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || `Failed to ${type}`),
    });
  };

  const exportCsv = () => {
    const headers = [
      "Employee",
      "Employee ID",
      "Type",
      "Employment Type",
      "Working Days",
      "Leaves Taken",
      "Basic Salary",
      "Hourly Rate",
      "Per Paper Rate",
      "Session Hours",
      "Hours Amount",
      "Bonus",
      "Attendance Bonus",
      "Leave Encashment",
      "Reimbursements",
      "Absence Deductions",
      "Leave Deductions",
      "Retention Deductions",
      "Late Penalty",
      "Other Deductions",
      "Total Deductions",
      "Net Salary",
      "Status",
    ].join(",");

    const rows = payslips.map((slip) => {
      const isFaculty = !!slip.faculty;
      const isPaperChecker = Number(slip.per_paper_rate || 0) > 0;
      const type = isFaculty ? "Faculty" : isPaperChecker ? "Paper Evaluator" : "Staff";
      const empType = (slip.employment_type || "").replace(/_/g, " ");
      const basic = Number(slip.basic_salary || slip.salary || 0);
      const hourlyRate = Number(slip.hourly_rate || 0);
      const paperRate = Number(slip.per_paper_rate || 0);
      const sessionHours = Number(slip.total_session_hours || slip.session_hours || 0);
      const hourAmt = Number(slip.hour_based_amount || 0);
      const bonus = Number(slip.bonus || 0);
      const attBonus = Number(slip.attendance_bonus || 0);
      const encashBonus = Number(slip.leave_encashment || 0);
      const reimb = Number(slip.reimbursements_amount || 0);
      const absenceDeduct = Number(slip.absence_deductions || 0);
      const leaveDeduct = Number(slip.leave_deductions || 0);
      const retentionDeduct = Number(slip.retention_deduction || 0);
      const latePenalty = Number(slip.late_penalty || 0);
      const otherDeduct = Number(slip.other_deductions || 0);
      const totalDeduct = absenceDeduct + leaveDeduct + retentionDeduct + latePenalty + otherDeduct;
      const net = Number(slip.net_salary || 0);
      const statusStr = slip.is_disbursed ? "Disbursed" : "Pending";

      return [
        `"${slip.faculty_name}"`,
        `"${slip.employee_id}"`,
        `"${type}"`,
        `"${empType}"`,
        `"${slip.working_days ?? 0}"`,
        `"${slip.leaves_taken ?? 0}"`,
        `"${basic}"`,
        `"${hourlyRate}"`,
        `"${paperRate}"`,
        `"${sessionHours}"`,
        `"${hourAmt}"`,
        `"${bonus}"`,
        `"${attBonus}"`,
        `"${encashBonus}"`,
        `"${reimb}"`,
        `"${absenceDeduct}"`,
        `"${leaveDeduct}"`,
        `"${retentionDeduct}"`,
        `"${latePenalty}"`,
        `"${otherDeduct}"`,
        `"${totalDeduct}"`,
        `"${net}"`,
        `"${statusStr}"`,
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payslips_${selectedRun?.month}_${selectedRun?.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedRun) {
    return (
      <div className="bg-white rounded-xl border border-border py-16 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Select a payroll run from the Payroll Runs tab to view payslips.
        </p>
      </div>
    );
  }

  const effectiveEmployeeCount =
    runStats?.count !== undefined
      ? runStats.count
      : (payslips.length || selectedRun.employee_count);

  const effectiveTotalAmount =
    runStats?.total_salary_sum !== undefined
      ? Number(runStats.total_salary_sum)
      : Number(selectedRun.total_amount ?? 0);

  return (
    <div className="space-y-4">
      {/* Run Summary + Action Buttons */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[selectedRun.month]} {selectedRun.year}
            </span>
            <Badge className={`text-xs capitalize ${STATUS_BADGE[selectedRun.status] ?? ""}`}>
              {selectedRun.status.replace(/_/g, " ")}
            </Badge>
            {selectedRun.branch_name && (
              <span className="text-xs text-muted-foreground">· {selectedRun.branch_name}</span>
            )}
          </div>
          <div className="flex gap-4 mt-1.5">
            <span className="text-xs text-muted-foreground">
              {effectiveEmployeeCount} employees
            </span>
            <span className="text-xs font-semibold text-primary">
              Total Net Salary: ₹{effectiveTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {selectedRun.status === "pending_approval" && canApprove && (
            <Button
              size="sm"
              disabled={actionLoading}
              className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => triggerAction("approve")}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionLoading ? "Approving…" : "Approve Run"}
            </Button>
          )}
          {selectedRun.status === "approved" && canDisburse && (
            <Button
              size="sm"
              disabled={actionLoading}
              className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => triggerAction("disburse")}
            >
              <Send className="w-3.5 h-3.5" />
              {actionLoading ? "Disbursing…" : "Disburse"}
            </Button>
          )}
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground shrink-0">Show:</Label>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 text-xs w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.values(ROLES).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{payslips.length} payslip(s)</span>
        {role === "super_admin" && (
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs gap-1.5 ml-auto">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        )}
      </div>

      {payslipsLoading ? (
        <TableSkeleton columns={12} rows={6} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {[
                    "Employee",
                    "Type",
                    "Basic / Rate",
                    "Hours / Amount",
                    "Bonus",
                    "Reimbursements",
                    "Reimb. Note",
                    "Deductions",
                    "Deduction Note",
                    "Net Salary",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-12 text-muted-foreground text-sm">
                      No payslips found.
                    </td>
                  </tr>
                ) : (
                  payslips.map((slip, i) => {
                    const basic = Number(slip.basic_salary || slip.salary || 0);
                    const perPaperRate = Number(slip.per_paper_rate || 0);
                    const explicitHourlyRate = Number(slip.hourly_rate || 0);
                    const totalSessionHours = Number(slip.total_session_hours || slip.session_hours || 0);
                    const hourAmount = Number(slip.hour_based_amount || 0);
                    const effectiveHourlyRate =
                      explicitHourlyRate > 0
                        ? explicitHourlyRate
                        : totalSessionHours > 0 && hourAmount > 0
                          ? hourAmount / totalSessionHours
                          : 0;

                    const bonusVal = Number(slip.bonus || 0);
                    const attBonusVal = Number(slip.attendance_bonus || 0);
                    const encashBonusVal = Number(slip.leave_encashment || 0);
                    const totalBonus = bonusVal + attBonusVal + encashBonusVal;

                    const totalDeduct =
                      Number(slip.late_penalty || 0) +
                      Number(slip.leave_deductions || 0) +
                      Number(slip.absence_deductions || 0) +
                      Number(slip.retention_deduction || 0) +
                      Number(slip.other_deductions || 0);

                    return (
                      <motion.tr
                        key={slip.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        {/* Employee */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground text-xs">
                            {slip.faculty_name}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {slip.employee_id}
                          </div>
                          {((slip.working_days ?? 0) > 0 || (slip.leaves_taken ?? 0) > 0) && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {slip.working_days ?? 0} working days
                              {slip.leaves_taken ? ` · ${slip.leaves_taken} leaves` : ""}
                            </div>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            {slip.faculty ? (
                              <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">
                                {slip.employment_type === "visiting" ? "Visiting Faculty" : "Faculty"}
                              </Badge>
                            ) : perPaperRate > 0 ? (
                              <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">
                                Paper Evaluator
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] bg-gray-100 text-gray-700 border-gray-200">
                                Staff
                              </Badge>
                            )}
                            {slip.employment_type && (
                              <Badge variant="outline" className="text-[9px] capitalize text-muted-foreground px-1 py-0 font-normal">
                                {slip.employment_type.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Basic / Rate */}
                        <td className="px-4 py-3 font-mono text-xs">
                          {perPaperRate > 0 ? (
                            <span className="font-medium text-foreground">
                              ₹{perPaperRate.toLocaleString("en-IN")}/paper
                            </span>
                          ) : slip.employment_type === "visiting" ||
                            slip.employment_type === "part_time" ||
                            (basic === 0 && effectiveHourlyRate > 0) ? (
                            effectiveHourlyRate > 0 ? (
                              `₹${effectiveHourlyRate.toLocaleString("en-IN")}/hr`
                            ) : (
                              "—"
                            )
                          ) : basic > 0 ? (
                            `₹${basic.toLocaleString("en-IN")}`
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Hours / Amount */}
                        <td className="px-4 py-3 font-mono text-xs">
                          {totalSessionHours > 0 ? (
                            <div>
                              <div className="text-muted-foreground">
                                {totalSessionHours} hrs
                              </div>
                              {hourAmount > 0 && (
                                <div className="text-green-600 font-medium">
                                  ₹{hourAmount.toLocaleString("en-IN")}
                                </div>
                              )}
                            </div>
                          ) : hourAmount > 0 ? (
                            <div className="text-green-600 font-medium">
                              ₹{hourAmount.toLocaleString("en-IN")}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Bonus */}
                        <td className="px-4 py-3 font-mono text-xs text-green-600">
                          {totalBonus > 0 ? (
                            <div>
                              <div>₹{totalBonus.toLocaleString("en-IN")}</div>
                              {(attBonusVal > 0 || encashBonusVal > 0) && (
                                <div className="text-[10px] text-muted-foreground font-sans">
                                  {attBonusVal > 0 ? `Att: ₹${attBonusVal.toLocaleString("en-IN")}` : ""}
                                  {attBonusVal > 0 && encashBonusVal > 0 ? " · " : ""}
                                  {encashBonusVal > 0 ? `Encash: ₹${encashBonusVal.toLocaleString("en-IN")}` : ""}
                                </div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Reimbursements */}
                        <td className="px-4 py-3 font-mono text-xs text-green-600">
                          {Number(slip.reimbursements_amount || 0) > 0
                            ? `₹${Number(slip.reimbursements_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </td>

                        {/* Reimbursement Note */}
                        <td className="px-4 py-3 text-xs">
                          <ReimbursementNoteCell row={slip} />
                        </td>

                        {/* Deductions */}
                        <td className="px-4 py-3 font-mono text-xs text-red-600">
                          {totalDeduct > 0
                            ? `₹${totalDeduct.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </td>

                        {/* Deduction Note */}
                        <td className="px-4 py-3 text-xs">
                          <DeductionNoteCell row={slip} />
                        </td>

                        {/* Net Salary */}
                        <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                          ₹{Number(slip.net_salary || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-[10px] ${slip.is_disbursed ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {slip.is_disbursed ? "Disbursed" : "Pending"}
                          </Badge>
                        </td>

                        {/* Adjust */}
                        <td className="px-4 py-3">
                          {canAdjust && !slip.is_disbursed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 px-2"
                              onClick={() => setAdjustTarget(slip)}
                            >
                              <Sliders className="w-3 h-3" /> Adjust
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Sheet */}
      <PayslipAdjustSheet
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        payslip={adjustTarget}
        runId={selectedRun.id}
      />
    </div>
  );
}
