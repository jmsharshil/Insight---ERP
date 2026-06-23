import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { levelActions } from "@/redux/actions";
import { API } from "@/service/api";
import { AppDispatch } from "@/store";
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
  loading: boolean;
}

export function FeeStructureDialog({
  open,
  onClose,
  onSubmit,
  structure,
  courses,
  loading,
}: FeeStructureDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [levels, setLevels] = useState<any[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Fetch levels when course changes
  useEffect(() => {
    if (course) {
      setLevelsLoading(true);
      dispatch({
        type: levelActions.GET_LEVELS,
        method: "GET",
        endPoint: API.COURSES.LEVELS.LIST(course),
        auth: true,
        getResponse: (res: any) => {
          setLevels(res?.data || res || []);
          setLevelsLoading(false);
        },
        getError: () => {
          setLevels([]);
          setLevelsLoading(false);
        },
      });
    } else {
      setLevels([]);
      setLevel("");
    }
  }, [course, dispatch]);

  // Auto-fill totalAmount from selected level's fee_amount
  useEffect(() => {
    if (level && levels.length > 0) {
      const selectedLevel = levels.find((l: any) => l.id === level);
      if (selectedLevel?.fee_amount) {
        setTotalAmount(String(selectedLevel.fee_amount));
      }
    } else if (!level) {
      setTotalAmount("");
    }
  }, [level, levels]);

  useEffect(() => {
    if (structure) {
      setName(structure.name || "");
      setCourse(structure.course || "");
      setLevel(structure.level || "");
      setTotalAmount(String(structure.total_amount) || "");
      setDescription(structure.description || "");
      setIsActive(structure.is_active !== false);
    } else {
      setName("");
      setCourse("");
      setLevel("");
      setTotalAmount("");
      setDescription("");
      setIsActive(true);
    }
  }, [structure, open]);

  const isEdit = !!structure;

  const handleSave = () => {
    if (!name.trim() || !course || !totalAmount) {
      return;
    }

    const payload: any = {
      name,
      course,
      level: level || null,
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
              : "Set up a new fee structure for a course and level combination."}
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
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel} disabled={!course || levelsLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={levelsLoading ? "Loading..." : "Select Level"} />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
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
              readOnly
              placeholder="Select a level to auto-fill"
              className="mt-1 bg-muted/50 cursor-not-allowed"
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
            disabled={loading || !name.trim() || !course || !totalAmount}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
