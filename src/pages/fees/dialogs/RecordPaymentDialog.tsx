import { useEffect, useMemo, useRef, useState } from "react";
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
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { type StudentFee } from "@/redux/slices/feesSlice";
import { X, CheckCircle2, FileImage } from "lucide-react";

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
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPaymentProof(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    const formData = new FormData();
    formData.append("student", studentId);
    formData.append("student_fee", studentFeeId);
    formData.append("amount", String(parseFloat(amount)));
    formData.append("payment_mode", mode);
    formData.append("transaction_ref", txnRef);
    formData.append("payment_date", date);
    if (note) formData.append("note", note);
    if (installmentItemId && installmentItemId !== "none") {
      formData.append("installment_item", installmentItemId);
    }
    if (bankAccountId && bankAccountId !== "none") {
      formData.append("bank_account", bankAccountId);
    }
    if (paymentProof) {
      formData.append("payment_proof", paymentProof);
    }
    onSubmit(formData);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Record Payment</SheetTitle>
          <SheetDescription>
            Submit your fee payment details for verification.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label>Payment Proof <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
            <div
              className="relative rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
              style={{ borderColor: paymentProof ? 'hsl(var(--primary))' : undefined }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPaymentProof(e.target.files[0]);
                  }
                }}
              />
              {paymentProof ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-700 truncate max-w-xs">
                    {paymentProof.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPaymentProof(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
                    <FileImage className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> screenshot or receipt
                  </div>
                  <p className="text-xs text-muted-foreground/70">JPG, PNG or PDF (max. 5MB)</p>
                </div>
              )}
            </div>
          </div>

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

        <SheetFooter>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
