import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDropdown } from "@/hooks/useDropdown";

interface Course {
  id: string;
  name: string;
  code?: string;
}

interface BatchForm {
  course: string;
  name: string;
  batch_code: string;
  group_module: "full" | "both" | "module_1" | "module_2";
  batch_attempt: "june" | "oct" | "dec" | "feb";
  branch: string;
  start_date: string;
  end_date: string;
  max_students: number;
  timing: string;
  is_active: boolean;
}

interface BatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  batchForm: BatchForm;
  setBatchForm: (form: BatchForm) => void;
  onSave: () => void;
  courses: Course[];
}

export default function BatchDialog({
  open,
  onOpenChange,
  isEditing,
  batchForm,
  setBatchForm,
  onSave,
  courses,
}: BatchDialogProps) {
  const {
    options: branches,
    loading: branchesLoading,
    fetchOptions: fetchBranches,
  } = useDropdown("branches", false);

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open, fetchBranches]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-text-primary">
            {isEditing ? "Edit Batch Details" : "Create Student Batch"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-3">
          {/* Course Selector */}
          <div className="space-y-1">
            <Label
              htmlFor="batch-course"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Course Program
            </Label>
            <Select
              value={batchForm.course}
              onValueChange={(val) => setBatchForm({ ...batchForm, course: val })}
            >
              <SelectTrigger id="batch-course" className="bg-muted/10">
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Batch Name */}
          <div className="space-y-1">
            <Label
              htmlFor="batch-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Batch Name
            </Label>
            <Input
              id="batch-name"
              value={batchForm.name}
              onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
              placeholder="e.g. Batch A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Group Module */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-module"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Group Module
              </Label>
              <Select
                value={batchForm.group_module}
                onValueChange={(val: any) => setBatchForm({ ...batchForm, group_module: val })}
              >
                <SelectTrigger id="batch-module" className="bg-muted/10">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="module_1">Module 1</SelectItem>
                  <SelectItem value="module_2">Module 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Attempt Month */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-attempt"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Attempt Month
              </Label>
              <Select
                value={batchForm.batch_attempt}
                onValueChange={(val: any) => setBatchForm({ ...batchForm, batch_attempt: val })}
              >
                <SelectTrigger id="batch-attempt" className="bg-muted/10">
                  <SelectValue placeholder="Select attempt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="june">June</SelectItem>
                  <SelectItem value="oct">October</SelectItem>
                  <SelectItem value="dec">December</SelectItem>
                  <SelectItem value="feb">February</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-start"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Start Date
              </Label>
              <Input
                id="batch-start"
                type="date"
                value={batchForm.start_date}
                onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-end"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                End Date
              </Label>
              <Input
                id="batch-end"
                type="date"
                value={batchForm.end_date}
                onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Max Students */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-max-students"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Max Students
              </Label>
              <Input
                id="batch-max-students"
                type="number"
                value={batchForm.max_students}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, max_students: Number(e.target.value) })
                }
              />
            </div>

            {/* Branch Name */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-branch"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Branch Name
              </Label>
              <Select
                value={batchForm.branch || ""}
                onValueChange={(val) => setBatchForm({ ...batchForm, branch: val })}
                disabled={branchesLoading}
              >
                <SelectTrigger id="batch-branch" className="bg-muted/10">
                  <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select Branch"} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.value} value={String(b.value)}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* <div className="space-y-1"> */}
            {/* Timings */}
            {/* <Label
              htmlFor="batch-timing"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Timings
            </Label>
            <Input
              id="batch-timing"
              value={batchForm.timing}
              onChange={(e) => setBatchForm({ ...batchForm, timing: e.target.value })}
              placeholder="e.g. 09:00-12:00"
            /> */}
          {/* </div> */}

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
            <Label
              htmlFor="batch-active"
              className="text-xs font-semibold text-text-primary cursor-pointer"
            >
              Active Status
            </Label>
            <Switch
              id="batch-active"
              checked={batchForm.is_active}
              onCheckedChange={(checked) => setBatchForm({ ...batchForm, is_active: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
