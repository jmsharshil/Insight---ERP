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
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
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

const DeductionNoteCell = ({ row, status, handleSave }: { row: any; status: string; handleSave: (id: string, note: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(row.deduction_note || "");

  const onSave = () => {
    if (note !== (row.deduction_note || "")) {
      handleSave(row.id, note);
    }
    setIsOpen(false);
  };

  const onCancel = () => {
    setNote(row.deduction_note || "");
    setIsOpen(false);
  };

  if (!["draft", "pending", "pending_approval"].includes(status?.toLowerCase())) {
     return row.deduction_note ? (
        <div className="text-muted-foreground italic mt-1.5 p-1.5 bg-muted/30 rounded border border-border/50 max-w-xs whitespace-normal">
          <span className="font-semibold not-italic">Note:</span> {row.deduction_note}
        </div>
     ) : "—";
  }

  return (
    <>
      {!row.deduction_note ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-muted-foreground hover:text-primary mt-1"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquarePlus className="w-3 h-3 mr-1" /> Add Note
        </Button>
      ) : (
        <div className="group relative mt-1.5 p-1.5 bg-muted/30 transition-colors rounded border border-border/50 max-w-xs whitespace-normal">
          <div className="text-muted-foreground italic pr-5">
            {row.deduction_note || "—"}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        </div>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onCancel();
          setIsOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {row.deduction_note ? "Edit Deduction Note" : "Add Deduction Note"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Enter deduction note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save Note</Button>
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

  const [typeFilter, setTypeFilter] = useState("all");
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
      endPoint: API.PAYROLL.PAYSLIPS(selectedRun.id),
      auth: true,
      setLoading: (v: boolean) => dispatch(setPayslipsLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        dispatch(setPayslips(data));
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to load payslips"),
    });
  }, [selectedRun]);

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

  const filtered = payslips.filter((s) => {
    if (typeFilter === "faculty") return !!s.faculty;
    if (typeFilter === "staff") return !s.faculty;
    return true;
  });

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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            <SelectItem value="faculty">Faculty Only</SelectItem>
            <SelectItem value="staff">Staff Only</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} payslip(s)</span>
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
                    "Hours",
                    "Bonus",
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                      No payslips found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((slip, i) => (
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
                        {slip.employment_type === 'part_time' || slip.employment_type === 'visiting' 
                          ? `₹${Number(slip.hourly_rate || 0).toLocaleString("en-IN")}/hr`
                          : `₹${Number(slip.basic_salary || 0).toLocaleString("en-IN")}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-green-600">
                        {slip.hour_based_amount > 0
                          ? `₹${Number(slip.hour_based_amount).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-green-600">
                        {slip.bonus > 0 ? `₹${Number(slip.bonus).toLocaleString("en-IN")}` : "—"}
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
                        <DeductionNoteCell 
                          row={slip} 
                          status={selectedRun?.status || ""} 
                          handleSave={(slipId, note) => {
                            dispatch({
                              type: payrollActions.UPDATE_PAYSLIP,
                              method: "PATCH",
                              endPoint: API.PAYROLL.PAYSLIP_DETAIL(selectedRun!.id, slipId),
                              body: { deduction_note: note },
                              auth: true,
                              getResponse: () => {
                                toast.success("Deduction note updated.");
                                dispatch({
                                  type: payrollActions.GET_PAYSLIPS,
                                  method: "GET",
                                  endPoint: API.PAYROLL.PAYSLIPS(selectedRun!.id),
                                  auth: true,
                                  getResponse: (res: any) => {
                                    const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                                    dispatch(setPayslips(data));
                                  }
                                } as any);
                              },
                              getError: (err: any) => {
                                toast.error(err?.response?.data?.message || "Failed to update note");
                              },
                            } as any);
                          }} 
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                        ₹{(() => {
                          if (slip.employment_type === 'part_time' || slip.employment_type === 'visiting') {
                            const hourlyRate = Number(slip.hourly_rate || 0);
                            const sessionHours = Number(slip.session_hours || slip.total_session_hours || 0);
                            const base = hourlyRate * sessionHours;
                            const deductions = Number(slip.late_penalty || 0) +
                                               Number(slip.leave_deductions || 0) +
                                               Number(slip.absence_deductions || 0) +
                                               Number(slip.retention_deduction || 0) +
                                               Number(slip.other_deductions || 0);
                            const bonus = Number(slip.bonus || 0);
                            const hourBased = Number(slip.hour_based_amount || 0);
                            return (base + hourBased + bonus - deductions).toLocaleString("en-IN");
                          }
                          return Number(slip.net_salary || 0).toLocaleString("en-IN");
                        })()}
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
