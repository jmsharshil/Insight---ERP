import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { type FeesStructure, type StudentFee } from "@/redux/slices/feesSlice";

const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

interface CreateInstallmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  students: any[];
  studentFees: StudentFee[];
  feeStructure: FeesStructure[];
  loading: boolean;
}

export function CreateInstallmentDialog({
  open,
  onClose,
  onSubmit,
  students,
  studentFees,
  feeStructure,
  loading,
}: CreateInstallmentDialogProps) {
  const [instStudentId, setInstStudentId] = useState("");
  const [instStudentFeeId, setInstStudentFeeId] = useState("");
  const [instTotalAmount, setInstTotalAmount] = useState(0);
  const [instItems, setInstItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setInstStudentId("");
      setInstStudentFeeId("");
      setInstTotalAmount(0);
      setInstItems([]);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Installment Plan</SheetTitle>
          <SheetDescription>
            Set up a multi-part payment schedule for a student's assigned fee.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 my-2 text-sm">
          <div>
            <Label className="text-xs font-semibold">Select Student</Label>
            <Select
              value={instStudentId}
              onValueChange={(val) => {
                setInstStudentId(val);
                setInstStudentFeeId("");
                setInstItems([]);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent className="max-h-56 overflow-y-auto">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name} ({s.admission_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {instStudentId && (
            <div>
              <Label className="text-xs font-semibold">Select Student Fee Record</Label>
              <Select
                value={instStudentFeeId}
                onValueChange={(val) => {
                  setInstStudentFeeId(val);
                  const selectedSf = studentFees.find((sf) => sf.id === val);
                  const totalDue = selectedSf ? Number(selectedSf.amount_due) : 0;
                  setInstTotalAmount(totalDue);
                  setInstItems([
                    { amount: String(Math.floor(totalDue / 2)), due_date: "" },
                    { amount: String(totalDue - Math.floor(totalDue / 2)), due_date: "" },
                  ]);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select assigned fee" />
                </SelectTrigger>
                <SelectContent className="max-h-56 overflow-y-auto">
                  {studentFees
                    .filter((sf) => sf.student === instStudentId)
                    .map((sf) => {
                      const fs = feeStructure.find((x) => x.id === sf.fee_structure);
                      return (
                        <SelectItem key={sf.id} value={sf.id}>
                          {fs?.name || "Assigned Fee"} — Due:{" "}
                          {formatCurrency(Number(sf.amount_due))}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          )}

          {instStudentFeeId && (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Installment Breakdown (Total: {formatCurrency(instTotalAmount)})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={instItems.length >= 6}
                  onClick={() => {
                    setInstItems((prev) => {
                      if (prev.length >= 6) return prev;
                      const newCount = prev.length + 1;
                      const baseAmount = Math.floor(instTotalAmount / newCount);
                      const remainder = instTotalAmount - baseAmount * newCount;
                      const newItems = prev.map((item) => ({
                        ...item,
                        amount: String(baseAmount),
                      }));
                      newItems.push({
                        amount: String(baseAmount + remainder),
                        due_date: "",
                      });
                      return newItems;
                    });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Installment
                </Button>
              </div>

              <div className="space-y-2 overflow-y-auto pr-1">
                {instItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Amount (₹)</Label>
                      <Input
                        type="number" min="0"
                        placeholder="Amount"
                        className="h-8 text-xs mt-0.5"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...instItems];
                          newItems[idx].amount = e.target.value;
                          setInstItems(newItems);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Due Date</Label>
                      <Input
                        type="date"
                        className="h-8 text-xs mt-0.5"
                        value={item.due_date}
                        onChange={(e) => {
                          const newItems = [...instItems];
                          newItems[idx].due_date = e.target.value;
                          setInstItems(newItems);
                        }}
                      />
                    </div>
                    {instItems.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive mt-4"
                        onClick={() => {
                          setInstItems((prev) => {
                            const newItems = prev.filter((_, i) => i !== idx);
                            const newCount = newItems.length;
                            if (newCount === 0) return newItems;
                            const baseAmount = Math.floor(instTotalAmount / newCount);
                            const remainder = instTotalAmount - baseAmount * newCount;
                            return newItems.map((item, i) => ({
                              ...item,
                              amount: String(
                                baseAmount + (i === newCount - 1 ? remainder : 0)
                              ),
                            }));
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {(() => {
                const sum = instItems.reduce((acc, curr) => acc + toNumber(curr.amount), 0);
                const isCorrect = Math.abs(sum - instTotalAmount) < 0.01;
                return (
                  <div className="flex justify-between items-center text-xs mt-2 border-t pt-2">
                    <span className="text-muted-foreground">Sum of installments:</span>
                    <span
                      className={cn(
                        "font-bold",
                        isCorrect ? "text-green-600" : "text-destructive",
                      )}
                    >
                      {formatCurrency(sum)} / {formatCurrency(instTotalAmount)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              loading ||
              !instStudentId ||
              !instStudentFeeId ||
              instItems.length === 0 ||
              instItems.some((x) => !x.due_date || toNumber(x.amount) <= 0) ||
              Math.abs(
                instItems.reduce((acc, curr) => acc + toNumber(curr.amount), 0) - instTotalAmount,
              ) >= 0.01
            }
            onClick={() => {
              const payload = {
                student: instStudentId,
                student_fee_id: instStudentFeeId,
                total_amount: instTotalAmount,
                items: instItems.map((it) => ({
                  amount: toNumber(it.amount),
                  due_date: it.due_date,
                })),
              };
              onSubmit(payload);
            }}
          >
            {loading ? "Creating..." : "Create Plan"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
