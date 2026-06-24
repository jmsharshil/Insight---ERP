import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { updatePayslipInList } from "@/redux/slices/payrollSlice";
import type { PaySlip } from "@/redux/slices/payrollSlice";
import type { AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { DollarSign, Clock, TrendingDown, TrendingUp } from "lucide-react";

interface PayslipAdjustSheetProps {
  open:      boolean;
  onClose:   () => void;
  payslip:   PaySlip | null;
  runId:     string;
}

export default function PayslipAdjustSheet({ open, onClose, payslip, runId }: PayslipAdjustSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ bonus: "", other_deductions: "", deduction_note: "" });

  useEffect(() => {
    if (payslip) {
      setForm({
        bonus:            String(payslip.bonus ?? ""),
        other_deductions: String(payslip.other_deductions ?? ""),
        deduction_note:   payslip.deduction_note ?? "",
      });
    }
  }, [payslip]);

  const handleSave = () => {
    if (!payslip) return;
    dispatch({
      type: payrollActions.ADJUST_PAYSLIP,
      method: "PATCH",
      endPoint: API.PAYROLL.PAYSLIP_DETAIL(runId, payslip.id),
      body: {
        bonus:            Number(form.bonus) || 0,
        other_deductions: Number(form.other_deductions) || 0,
        deduction_note:   form.deduction_note,
      },
      auth: true,
      setLoading: (v: boolean) => setLoading(v),
      getResponse: (res: any) => {
        const updated = res?.data ?? res;
        if (updated?.id) {
          dispatch(updatePayslipInList(updated));
          toast.success("Payslip adjusted successfully.");
          onClose();
        } else {
          toast.error("Unexpected response.");
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to adjust payslip"),
    });
  };

  const isFaculty = !!payslip?.faculty;

  const SummaryRow = ({ label, value, color = "" }: { label: string; value: string | number; color?: string }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold font-mono ${color}`}>
        ₹{Number(value ?? 0).toLocaleString("en-IN")}
      </span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Adjust Payslip</SheetTitle>
          {payslip && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {payslip.faculty_name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{payslip.faculty_name}</div>
                <div className="text-xs text-muted-foreground font-mono">{payslip.employee_id}</div>
              </div>
              <Badge className={`ml-auto text-xs ${isFaculty ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                {isFaculty ? "Faculty" : "Staff"}
              </Badge>
            </div>
          )}
        </SheetHeader>

        {payslip && (
          <div className="space-y-5">
            {/* Current Payslip Summary */}
            <div className="bg-muted/30 rounded-xl border border-border p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Current Breakdown</div>
              <SummaryRow label="Basic Salary"       value={payslip.basic_salary} />
              {isFaculty && <SummaryRow label="Hour-based Amount" value={payslip.hour_based_amount} color="text-green-600" />}
              <SummaryRow label="Bonus"              value={payslip.bonus} color="text-green-600" />
              <SummaryRow label="Late Penalty"       value={payslip.late_penalty} color="text-red-600" />
              <SummaryRow label="Leave Deductions"   value={payslip.leave_deductions} color="text-red-600" />
              {payslip.absence_deductions !== undefined && (
                <SummaryRow label="Absence Deductions" value={payslip.absence_deductions} color="text-red-600" />
              )}
              {payslip.other_deductions !== undefined && (
                <SummaryRow label="Other Deductions"   value={payslip.other_deductions} color="text-red-600" />
              )}
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Net Salary</span>
                <span className="text-lg font-bold text-primary font-mono">
                  ₹{Number(payslip.net_salary ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
              {isFaculty && payslip.sessions_conducted > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {payslip.sessions_conducted} session(s) conducted
                </div>
              )}
            </div>

            {/* Adjustment Fields */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adjustments</div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" /> Bonus (₹)
                </Label>
                <Input
                  type="number"
                  value={form.bonus}
                  onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))}
                  placeholder="0"
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-500" /> Other Deductions (₹)
                </Label>
                <Input
                  type="number"
                  value={form.other_deductions}
                  onChange={e => setForm(f => ({ ...f, other_deductions: e.target.value }))}
                  placeholder="0"
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Deduction / Adjustment Note</Label>
                <Textarea
                  value={form.deduction_note}
                  onChange={e => setForm(f => ({ ...f, deduction_note: e.target.value }))}
                  placeholder="e.g. Adjusted for special project, performance bonus..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              {/* Preview recalculated net */}
              {(form.bonus || form.other_deductions) && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-xs text-primary font-medium">Estimated new net salary</span>
                  <span className="text-sm font-bold text-primary font-mono">
                    ₹{Math.max(0,
                      payslip.net_salary
                      + (Number(form.bonus) || 0)
                      - (Number(form.other_deductions) || 0)
                      - (payslip.bonus || 0)
                      - (payslip.other_deductions || 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <SheetFooter className="mt-6 flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !payslip}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? "Saving…" : "Save Adjustment"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
