import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { DUMMY_STUDENTS } from "@/constants/dummy/students";

interface CashEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { studentId: string; amount: number; remarks: string }) => void;
}

export function CashEntryDialog({
  open,
  onClose,
  onSubmit,
}: CashEntryDialogProps) {
  const toast = useToast();
  const [studentId, setStudentId] = useState(DUMMY_STUDENTS[0].id);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Add Cash Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUMMY_STUDENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const n = Number(amount);
              if (!n) {
                toast.error("Please fix the errors before submitting.");
                return;
              }
              onSubmit({ studentId, amount: n, remarks });
            }}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
