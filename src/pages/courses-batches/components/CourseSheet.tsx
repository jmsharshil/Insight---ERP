import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CourseForm {
  name: string;
  code: string;
  description: string;
  course_type: string;
  duration_months: number;
  fee_amount: number | string;
  is_active: boolean;
}

interface CourseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSave: (courseForm: CourseForm) => void;
}

export default function CourseSheet({
  open,
  onOpenChange,
  loading,
  onSave,
}: CourseSheetProps) {
  const [form, setForm] = useState<CourseForm>({
    name: "",
    code: "",
    description: "",
    course_type: "cseet",
    duration_months: 12,
    fee_amount: 0,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        code: "",
        description: "",
        course_type: "cseet",
        duration_months: 12,
        fee_amount: "",
        is_active: true,
      });
    }
  }, [open]);

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Course</SheetTitle>
          <SheetDescription>Enter the details below to create a new course.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label
              htmlFor="course-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Course Name
            </Label>
            <Input
              id="course-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Business Management"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div className="space-y-1">
              <Label
                htmlFor="course-code"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Course Code
              </Label>
              <Input
                id="course-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. BM101"
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label
                htmlFor="course-type"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Course Type
              </Label>
              <Select
                value={form.course_type}
                onValueChange={(val) => setForm({ ...form, course_type: val })}
              >
                <SelectTrigger id="course-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cseet">CSEET</SelectItem>
                  <SelectItem value="cs_executive">CS Executive</SelectItem>
                  <SelectItem value="cs_professional">CS Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fee Amount */}
            <div className="space-y-1">
              <Label
                htmlFor="course-fees"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Fee Amount
              </Label>
              <Input
                id="course-fees"
                type="number"
                value={form.fee_amount}
                onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
                placeholder="e.g. 52000"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <Label
                htmlFor="course-duration"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Duration (Months)
              </Label>
              <Input
                id="course-duration"
                type="number"
                value={form.duration_months}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duration_months: Number(e.target.value),
                  })
                }
                placeholder="e.g. 12"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label
              htmlFor="course-desc"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="course-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the course..."
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30 h-[40px]">
            <Label
              htmlFor="course-active"
              className="text-xs font-semibold text-text-primary cursor-pointer"
            >
              Active Status
            </Label>
            <Switch
              id="course-active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>

          {/* Form Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
