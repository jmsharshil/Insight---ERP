import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { type StudentFee } from "@/redux/slices/feesSlice";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  studentFees: StudentFee[];
  installments: any[];
  studentId?: string;
  students?: any[];
  bankAccounts?: any[];
  loading: boolean;
}

export function RecordPaymentDialog({
  open,
  onClose,
  onSubmit,
  studentFees,
  installments,
  studentId: initialStudentId,
  students,
  bankAccounts = [],
  loading,
}: RecordPaymentDialogProps) {
  const toast = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentFeeId, setStudentFeeId] = useState("");
  const [installmentItemId, setInstallmentItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("dd");
  const [txnRef, setTxnRef] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  // Determine active student ID
  const studentId = initialStudentId || selectedStudentId;

  // Filter student fees for the selected student if we are in admin mode
  const filteredStudentFees = useMemo(() => {
    if (students && selectedStudentId) {
      return studentFees.filter((sf) => String(sf.student) === String(selectedStudentId));
    }
    return studentFees;
  }, [students, selectedStudentId, studentFees]);

  const availableInstallmentItems = useMemo(() => {
    if (!studentFeeId) return [];
    const plan = installments.find(
      (inst) =>
        String(inst.student_fee) === String(studentFeeId) ||
        String(inst.student_fee?.id) === String(studentFeeId)
    );
    if (!plan || !plan.items) return [];
    return plan.items.filter((item: any) => !item.is_paid);
  }, [studentFeeId, installments]);

  useEffect(() => {
    if (open) {
      setSelectedStudentId("");
      setStudentFeeId("");
      setInstallmentItemId("");
      setAmount("");
      setMode("dd");
      setTxnRef("");
      setDate(new Date().toISOString().split("T")[0]);
      setNote("");
      setBankAccountId("");
    }
  }, [open]);

  useEffect(() => {
    if (studentFeeId) {
      const selected = filteredStudentFees.find((sf) => sf.id === studentFeeId);
      if (selected) {
        setAmount(String(selected.amount_due));
      }
    } else {
      setAmount("");
    }
  }, [studentFeeId, filteredStudentFees]);

  useEffect(() => {
    if (installmentItemId && installmentItemId !== "none" && availableInstallmentItems.length > 0) {
      const selectedItem = availableInstallmentItems.find((item: any) => item.id === installmentItemId);
      if (selectedItem) {
        setAmount(String(selectedItem.amount));
      }
    }
  }, [installmentItemId, availableInstallmentItems]);

  const handleSave = () => {
    if (!studentId || !studentFeeId || !amount || !mode || !txnRef || !date) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const payload: any = {
      student: studentId,
      student_fee: studentFeeId,
      amount: parseFloat(amount),
      payment_mode: mode,
      transaction_ref: txnRef,
      payment_date: date,
      note: note || undefined,
    };
    if (installmentItemId && installmentItemId !== "none") {
      payload.installment_item = installmentItemId;
    }
    if (bankAccountId && bankAccountId !== "none") {
      payload.bank_account = bankAccountId;
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Record Payment</DialogTitle>
          <DialogDescription>
            Submit your fee payment details for verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {students && (
            <div className="space-y-1.5">
              <Label htmlFor="student-select">Select Student *</Label>
              <Select
                value={selectedStudentId}
                onValueChange={(v) => {
                  setSelectedStudentId(v);
                  setStudentFeeId("");
                  setInstallmentItemId("");
                }}
              >
                <SelectTrigger id="student-select">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} ({s.admission_number || "No Admin No"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="student-fee">Select Fee Allocation *</Label>
            <Select value={studentFeeId} onValueChange={setStudentFeeId} disabled={students && !selectedStudentId}>
              <SelectTrigger id="student-fee">
                <SelectValue placeholder={students && !selectedStudentId ? "Select student first..." : "Select fee structure..."} />
              </SelectTrigger>
              <SelectContent>
                {filteredStudentFees.map((sf) => (
                  <SelectItem key={sf.id} value={sf.id}>
                    (Outstanding: {formatCurrency(Number(sf.amount_due))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableInstallmentItems.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="installment-item">Select Installment (Optional)</Label>
              <Select value={installmentItemId} onValueChange={setInstallmentItemId}>
                <SelectTrigger id="installment-item">
                  <SelectValue placeholder="Pay for installment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't link to an installment</SelectItem>
                  {availableInstallmentItems.map((item: any, idx: number) => (
                    <SelectItem key={item.id} value={item.id}>
                      Installment {idx + 1} (Amount: {formatCurrency(Number(item.amount))}, Due: {formatDate(item.due_date)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Amount *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-mode">Payment Mode *</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger id="payment-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd">Demand Draft</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="txn-ref">Transaction Reference *</Label>
              <Input
                id="txn-ref"
                placeholder="e.g. TXN12345678"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-date">Payment Date *</Label>
              <Input
                id="payment-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {bankAccounts && bankAccounts.length > 0 && (mode === "bank_transfer" || mode === "online" || mode === "cheque" || mode === "dd") && (
            <div className="space-y-1.5">
              <Label htmlFor="bank-account">Target Bank Account</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Select target bank account..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((ac) => (
                    <SelectItem key={ac.id} value={ac.id}>
                      {ac.bank_name} - {ac.name} ({ac.account_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="payment-note">Note / Remarks</Label>
            <Textarea
              id="payment-note"
              placeholder="e.g. First installment payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2.5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !studentId || !studentFeeId || !amount || !mode || !txnRef || !date}
            className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
          >
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
