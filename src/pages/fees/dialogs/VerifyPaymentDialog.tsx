import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

interface VerifyPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  payment: any;
  onSubmit: (payload: { status: string; note: string }) => void;
  loading: boolean;
}

export function VerifyPaymentDialog({
  open,
  onClose,
  payment,
  onSubmit,
  loading,
}: VerifyPaymentDialogProps) {
  const [status, setStatus] = useState("verified");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setStatus("verified");
      setNote("");
    }
  }, [open]);

  if (!payment) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Verify Payment</SheetTitle>
          <SheetDescription>
            Review and update the verification status for this payment.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-3 text-sm">
          <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
            <div>
              <span className="text-xs text-muted-foreground block">Receipt Number</span>
              <span className="font-mono font-semibold text-foreground">{payment.receipt_number || "—"}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Amount</span>
              <span className="font-bold text-primary">{formatCurrency(Number(payment.amount))}</span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground block">Payment Mode</span>
              <span className="capitalize font-medium text-foreground">{payment.payment_mode?.replace("_", " ")}</span>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground block">Transaction Ref</span>
              <span className="font-mono font-medium text-foreground">{payment.transaction_ref || "—"}</span>
            </div>
            <div className="col-span-2 mt-2">
              <span className="text-xs text-muted-foreground block">Note from Student</span>
              <p className="text-xs italic bg-background p-2 rounded border mt-0.5 text-muted-foreground">
                {payment.note || "No note provided."}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="verify-status">Action *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="verify-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">Verify (Approve Payment)</SelectItem>
                <SelectItem value="rejected">Reject Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="verify-note">Note / Comment *</Label>
            <Textarea
              id="verify-note"
              placeholder={status === "verified" ? "Payment received in bank account." : "Reason for rejection..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit({ status, note })}
            disabled={loading || !note.trim()}
            className={cn(
              "text-white",
              status === "verified"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-destructive hover:bg-destructive/90"
            )}
          >
            {loading ? "Processing..." : status === "verified" ? "Verify" : "Reject"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
