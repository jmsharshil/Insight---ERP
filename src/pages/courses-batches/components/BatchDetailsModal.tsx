import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Users, Calendar, Clock, MapPin, BookOpen, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  location: string;
  start_date: string;
  end_date: string;
  max_students: number;
  timing: string;
  is_active: boolean;
}

export type SheetMode = "view" | "edit" | "create" | null;

interface BatchDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SheetMode;
  batch?: any;
  batchForm: BatchForm;
  setBatchForm: (form: BatchForm) => void;
  onSave: () => void;
  courses: Course[];
  canEdit?: boolean;
  onEditClick?: () => void;
}

export default function BatchDetailsSheet({
  open,
  onOpenChange,
  mode,
  batch,
  batchForm,
  setBatchForm,
  onSave,
  courses,
  canEdit,
  onEditClick,
}: BatchDetailsSheetProps) {
  // If mode is null, render nothing or just close sheet
  if (!mode) return null;

  const isFormMode = mode === "edit" || mode === "create";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold tracking-tight text-text-primary flex items-center justify-between pr-6">
            {isFormMode ? (
              <span>{mode === "edit" ? "Edit Batch Details" : "Create Student Batch"}</span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span>{batch?.name}</span>
                  <Badge variant={batch?.is_active ? "default" : "destructive"} className="ml-2">
                    {batch?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={onEditClick}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        {isFormMode ? (
          <div className="space-y-4 py-4">
            {/* Form Fields */}
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

              <div className="space-y-1">
                <Label
                  htmlFor="batch-location"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Location / Classroom
                </Label>
                <Input
                  id="batch-location"
                  value={batchForm.location}
                  onChange={(e) => setBatchForm({ ...batchForm, location: e.target.value })}
                  placeholder="e.g. Campus 1"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label
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
              />
            </div>

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

            <div className="flex gap-3 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onSave}
                className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground flex items-center justify-center gap-2"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          batch && (
            <div className="space-y-6 py-4">
              {/* View Details Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Batch Code
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {batch.batch_code}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Location
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-primary" />
                    {batch.location || "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Group Module
                  </span>
                  <div className="text-sm font-medium capitalize">
                    {batch.group_module_display || batch.group_module?.replace("_", " ")}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Batch Attempt
                  </span>
                  <div className="text-sm font-medium capitalize">
                    {batch.batch_attempt_display || batch.batch_attempt}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Duration
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    {batch.start_date} to {batch.end_date}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Timing</span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    {batch.timing}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Max Students
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-primary" />
                    {batch.max_students}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Course Name
                  </span>
                  <div
                    className="text-sm font-medium truncate"
                    title={batch.course}
                  >
                    {batch.course_name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Enrolled Students
                  </span>
                  <div className="text-sm font-medium">
                    {batch.enrolled_students?.length || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Assigned Faculty
                  </span>
                  <div className="text-sm font-medium">
                    {batch.assigned_faculty?.length || 0}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Created At
                  </span>
                  <div className="text-xs font-medium text-muted-foreground">
                    {batch.created_at || "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Updated At
                  </span>
                  <div className="text-xs font-medium text-muted-foreground">
                    {batch.updated_at || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
