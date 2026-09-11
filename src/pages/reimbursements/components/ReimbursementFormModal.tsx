import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText } from "lucide-react";
import type { Reimbursement } from "@/types/reimbursement.types";

interface ReimbursementFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
  initialData?: Reimbursement | null;
}

export default function ReimbursementFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
}: ReimbursementFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setAmount(initialData.amount || "");
        setExpenseDate(initialData.expense_date || "");
        setProofFile(null); // Assuming editing requires re-upload or keep existing (usually kept if null)
      } else {
        setTitle("");
        setDescription("");
        setAmount("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
        setProofFile(null);
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !amount || !expenseDate) return;
    if (!proofFile && !initialData) return;
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("amount", amount);
    fd.append("expense_date", expenseDate);
    if (proofFile) fd.append("proof", proofFile);
    onSubmit(fd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Reimbursement Claim" : "Submit Reimbursement Claim"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              placeholder="e.g., Seminar Supplies"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseDate">Expense Date *</Label>
              <Input
                id="expenseDate"
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              required
              placeholder="Detailed explanation of the expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Supporting Document (Proof) *</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {proofFile ? proofFile.name : initialData?.proof ? "Replace Existing File" : "Upload Receipt / Invoice"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) setProofFile(e.target.files[0]);
                }}
              />
            </div>
            {proofFile && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Selected: {proofFile.name}
              </p>
            )}
            {!proofFile && initialData?.proof && (
              <p className="text-xs text-muted-foreground mt-1">
                Currently uploaded:{" "}
                <a
                  href={initialData.proof}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  View File
                </a>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (!initialData && !proofFile)}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {initialData ? "Save Changes" : "Submit Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
