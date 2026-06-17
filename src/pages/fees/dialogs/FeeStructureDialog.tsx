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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { type FeesStructure } from "@/redux/slices/feesSlice";

interface FeeStructureDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  structure: FeesStructure | null;
  courses: any[];
  batches: any[];
  loading: boolean;
}

export function FeeStructureDialog({
  open,
  onClose,
  onSubmit,
  structure,
  courses,
  batches,
  loading,
}: FeeStructureDialogProps) {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (structure) {
      setName(structure.name || "");
      setCourse(structure.course || "");
      setBatch(structure.batch || "");
      setTotalAmount(String(structure.total_amount) || "");
      setDescription(structure.description || "");
      setIsActive(structure.is_active !== false);
    } else {
      setName("");
      setCourse("");
      setBatch("");
      setTotalAmount("");
      setDescription("");
      setIsActive(true);
    }
  }, [structure, open]);

  const isEdit = !!structure;

  const handleSave = () => {
    if (!name.trim() || !course || !batch || !totalAmount) {
      return;
    }

    const payload: any = {
      name,
      course,
      batch,
      total_amount: parseFloat(totalAmount),
      description,
      is_active: isActive,
    };

    onSubmit(payload);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {isEdit ? "Edit Fee Structure" : "Create Fee Structure"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modify the details for this fee structure."
              : "Set up a new fee structure for a course and batch combination."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="fs-name">Structure Name *</Label>
            <Input
              id="fs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Class 10 - Standard Science Batch 2026"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Course *</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Batch *</Label>
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="fs-desc">Description</Label>
            <Textarea
              id="fs-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard annual fee description..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="fs-amount">Total Amount *</Label>
            <Input
              id="fs-amount"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="e.g., 50000.00"
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="fs-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="fs-active" className="cursor-pointer select-none">
              Is Active
            </Label>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !name.trim() || !course || !batch || !totalAmount}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
