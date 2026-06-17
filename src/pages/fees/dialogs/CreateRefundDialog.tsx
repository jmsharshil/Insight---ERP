import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CreateRefundDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { payment: string; amount: number; reason: string }) => void;
  payments: any[];
  students: any[];
  loading: boolean;
}

export function CreateRefundDialog({
  open,
  onClose,
  onSubmit,
  payments,
  students,
  loading,
}: CreateRefundDialogProps) {
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const verifiedPayments = useMemo(() => {
    return payments.filter((p) => p.status === "verified");
  }, [payments]);

  const selectedPayment = useMemo(() => {
    return verifiedPayments.find((p) => p.id === paymentId);
  }, [verifiedPayments, paymentId]);

  useEffect(() => {
    if (selectedPayment) {
      setAmount(String(selectedPayment.amount));
    } else {
      setAmount("");
    }
  }, [selectedPayment]);

  useEffect(() => {
    if (open) {
      setPaymentId("");
      setAmount("");
      setReason("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!paymentId || !amount || !reason.trim()) return;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    onSubmit({
      payment: paymentId,
      amount: numAmount,
      reason: reason.trim(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Create Refund Request</SheetTitle>
          <SheetDescription>
            Initiate a refund for a previously verified payment.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 my-2 text-sm">
          <div>
            <Label htmlFor="refund-payment">Select Verified Payment *</Label>
            <Select value={paymentId} onValueChange={setPaymentId}>
              <SelectTrigger id="refund-payment" className="mt-1">
                <SelectValue placeholder="Select a payment receipt" />
              </SelectTrigger>
              <SelectContent className="max-h-56 overflow-y-auto">
                {verifiedPayments.map((p) => {
                  const s = students.find((x) => x.id === p.student);
                  const studentName = s?.full_name || p.student_name || "Unknown Student";
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      {studentName} - {p.receipt_number || "No Receipt"} ({formatCurrency(Number(p.amount))})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedPayment && (
            <div>
              <Label htmlFor="refund-amount">
                Refund Amount * (Max: {formatCurrency(Number(selectedPayment.amount))})
              </Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedPayment.amount}
                className="mt-1 font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <Label htmlFor="refund-reason">Reason for Refund *</Label>
            <Textarea
              id="refund-reason"
              className="mt-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Overcharged amount, student withdrew, etc."
              rows={3}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !paymentId ||
              !amount ||
              !reason.trim() ||
              Number(amount) <= 0 ||
              (selectedPayment && Number(amount) > Number(selectedPayment.amount))
            }
            className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
          >
            {loading ? "Creating..." : "Submit Refund"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
