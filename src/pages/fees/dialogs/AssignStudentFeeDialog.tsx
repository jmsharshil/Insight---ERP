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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type FeesStructure } from "@/redux/slices/feesSlice";

interface AssignStudentFeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  students: any[];
  feeStructures: FeesStructure[];
  loading: boolean;
}

export function AssignStudentFeeDialog({
  open,
  onClose,
  onSubmit,
  students,
  feeStructures,
  loading,
}: AssignStudentFeeDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [discountReason, setDiscountReason] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (feeStructureId) {
      const selectedFs = feeStructures.find((fs) => fs.id === feeStructureId);
      if (selectedFs) {
        setTotalAmount(String(selectedFs.total_amount));
      }
    } else {
      setTotalAmount("");
    }
  }, [feeStructureId, feeStructures]);

  useEffect(() => {
    if (open) {
      setStudentId("");
      setFeeStructureId("");
      setTotalAmount("");
      setDiscount("0");
      setDiscountReason("");
      setDueDate("");
    }
  }, [open]);

  const handleSave = () => {
    if (!studentId || !feeStructureId || !totalAmount || !dueDate) {
      return;
    }
    onSubmit({
      student: studentId,
      fee_structure: feeStructureId,
      total_amount: parseFloat(totalAmount),
      discount: parseFloat(discount) || 0,
      discount_reason: discountReason || undefined,
      due_date: dueDate,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Assign Student Fee</SheetTitle>
          <SheetDescription>
            Assign a fee structure to a student and optionally configure a discount.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="student">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Select student..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name} ({s.admission_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee_structure">Fee Structure</Label>
            <Select value={feeStructureId} onValueChange={setFeeStructureId}>
              <SelectTrigger id="fee_structure">
                <SelectValue placeholder="Select fee structure..." />
              </SelectTrigger>
              <SelectContent>
                {feeStructures.map((fs) => (
                  <SelectItem key={fs.id} value={fs.id}>
                    {fs.name} ({formatCurrency(Number(fs.total_amount))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount Amount</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discount_reason">Discount Reason</Label>
            <Input
              id="discount_reason"
              placeholder="e.g. Early bird discount, Scholarship"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              disabled={parseFloat(discount) <= 0}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !studentId || !feeStructureId || !totalAmount || !dueDate}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Assigning..." : "Assign Fee"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
