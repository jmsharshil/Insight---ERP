import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface ViewInstallmentPlanDialogProps {
  open: boolean;
  onClose: () => void;
  installment: any;
  message?: string | null;
}

export function ViewInstallmentPlanDialog({
  open,
  onClose,
  installment,
  message,
}: ViewInstallmentPlanDialogProps) {
  if (!installment) return null;

  const items = installment.items || [];
  const totalAmount = items.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

  const statusColors: Record<string, string> = {
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    pending_approval: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <span>Installment Plan Details</span>
          </DialogTitle>
          <DialogDescription>
            View the installment schedule and approval status for this plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-sm">
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
              <div>
                <p className="font-semibold text-xs">Success</p>
                <p className="text-xs opacity-90">{message}</p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
            <div>
              <span className="text-xs text-muted-foreground block">Student Name</span>
              <span className="font-semibold text-foreground">
                {installment.student_name || installment.student?.full_name || "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Status</span>
              <span
                className={cn(
                  "inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize mt-0.5",
                  statusColors[installment.status] ||
                    "bg-muted text-muted-foreground border-muted-foreground/20",
                )}
              >
                {installment.status_display || installment.status?.replace("_", " ") || "Pending Approval"}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground block">Total Plan Amount</span>
              <span className="text-base font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground block">Created At</span>
              <span className="font-medium text-foreground">
                {installment.created_at ? formatDate(installment.created_at) : "—"}
              </span>
            </div>
          </div>

          {/* Installment Items Table */}
          <div className="space-y-2">
            <h4 className="font-heading font-semibold text-sm">Installment Schedule</h4>
            <div className="border border-border rounded-xl overflow-hidden bg-card text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border font-medium text-muted-foreground">
                    <th className="p-3">#</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-medium text-muted-foreground">
                        Installment {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {formatCurrency(Number(item.amount))}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(item.due_date)}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap",
                            item.is_paid
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          )}
                        >
                          {item.is_paid ? `Paid ${item.paid_at ? formatDate(item.paid_at) : ""}` : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
