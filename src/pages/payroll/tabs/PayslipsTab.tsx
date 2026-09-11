import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Sliders, CheckCircle2, Send, Users, MessageSquarePlus, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { payrollActions, dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import { ROLES } from "@/constants/roles";
import { setPayslips, setPayslipsLoading } from "@/redux/slices/payrollSlice";
import type { PaySlip, PayrollRun } from "@/redux/slices/payrollSlice";
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

  if (!row.deduction_note) {
    return <span className="text-muted-foreground">—</span>;
  }

  const parts: string[] = [];
  let current = "";
  row.deduction_note.split(/,\s*/).forEach((chunk: string) => {
    if (current) current += ", " + chunk;
    else current = chunk;

    // Check if the chunk ends with a deduction amount (e.g. ": -16500.00")
    if (/:\s*-?\d+(\.\d+)?\s*$/.test(chunk)) {
      parts.push(current);
      current = "";
    }
  });
  if (current) parts.push(current);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-primary hover:text-primary/80 mt-1"
        onClick={() => setIsOpen(true)}
      >
        View Deduction note
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] ">
          <DialogHeader>
            <DialogTitle>Deduction Note</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              {parts.map((part, idx) => {
                const match = part.match(/^(.*?):\s*(-?\d+(\.\d+)?)\s*$/);
                if (match) {
                  const text = match[1];
                  const amount = match[2];
                  
                  let title = text;
                  let dates: string[] = [];
                  const absenceMatch = text.match(/^Absent(?: \(\d+ days?\))? on (.*)/);
                  if (absenceMatch) {
                    title = "Absence Deductions";
                    dates = absenceMatch[1].split(/,\s*/);
                  }
                  
                  const parsedAmount = Math.abs(Number(amount));
                  
                  return (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-foreground">{title}</h4>
                          {dates.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                              {dates.length} day{dates.length > 1 ? 's' : ''} absent
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-sm text-red-600 font-medium shrink-0 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                          - ₹{parsedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {dates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {dates.map(d => (
                            <Badge key={d} variant="outline" className="text-[11px] font-normal bg-slate-50 text-slate-600 border-slate-200">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-border shadow-sm text-sm text-muted-foreground">
                    {part}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
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
              {selectedRun.employee_count} employees
            </span>
            <span className="text-xs font-semibold text-primary">
              Total: ₹{Number(selectedRun.total_amount ?? 0).toLocaleString("en-IN")}
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
      </div>

      {payslipsLoading ? (
        <TableSkeleton columns={7} rows={6} className="mt-0" />
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
                    <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                      No payslips found.
                    </td>
                  </tr>
                ) : (
                  payslips.map((slip, i) => (
                    <motion.tr
                      key={slip.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">
                          {slip.faculty_name}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {slip.employee_id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`text-[10px] ${slip.faculty ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {slip.faculty ? "Faculty" : "Staff"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {slip.employment_type === "part_time" ||
                        slip.employment_type === "visiting" ||
                        (Number(slip.basic_salary || slip.salary || 0) === 0 &&
                          Number(slip.hour_based_amount) > 0)
                          ? (() => {
                              const explicitRate = Number(slip.hourly_rate || 0);
                              const hours = Number(
                                slip.total_session_hours || slip.session_hours || 0,
                              );
                              const amount = Number(slip.hour_based_amount || 0);
                              const effectiveRate =
                                explicitRate > 0 ? explicitRate : hours > 0 ? amount / hours : 0;
                              return effectiveRate > 0
                                ? `₹${effectiveRate.toLocaleString("en-IN")}/hr`
                                : "—";
                            })()
                          : Number(slip.basic_salary || slip.salary || 0) > 0
                            ? `₹${Number(slip.basic_salary || slip.salary || 0).toLocaleString("en-IN")}`
                            : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {Number(slip.total_session_hours || slip.session_hours || 0) > 0 ? (
                          <div>
                            <div className="text-muted-foreground">
                              {Number(slip.total_session_hours || slip.session_hours)} hrs
                            </div>
                            <div className="text-green-600 font-medium">
                              ₹{Number(slip.hour_based_amount || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ) : Number(slip.hour_based_amount) > 0 ? (
                          <div className="text-green-600 font-medium">
                            ₹{Number(slip.hour_based_amount || 0).toLocaleString("en-IN")}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-green-600">
                        {slip.bonus > 0 ? `₹${Number(slip.bonus).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-green-600">
                        {Number(slip.reimbursements_amount || 0) > 0
                          ? `₹${Number(slip.reimbursements_amount).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-red-600">
                        ₹
                        {(
                          Number(slip.late_penalty || 0) +
                          Number(slip.leave_deductions || 0) +
                          Number(slip.absence_deductions || 0) +
                          Number(slip.retention_deduction || 0) +
                          Number(slip.other_deductions || 0)
                        ).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <DeductionNoteCell row={slip} />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                        ₹{Number(slip.net_salary || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`text-[10px] ${slip.is_disbursed ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {slip.is_disbursed ? "Disbursed" : "Pending"}
                        </Badge>
                      </td>
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
                  ))
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
