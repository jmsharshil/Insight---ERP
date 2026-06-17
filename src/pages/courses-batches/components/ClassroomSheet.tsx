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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DoorOpen, Users, HelpCircle, Trash2, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

interface ClassroomForm {
  name: string;
  capacity: number | string;
  is_active: boolean;
}

interface ClassroomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  classroom?: Classroom | null;
  onSave: (form: { name: string; capacity: number; is_active: boolean }) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export default function ClassroomSheet({
  open,
  onOpenChange,
  loading,
  classroom,
  onSave,
  onDelete,
  canDelete = true,
}: ClassroomSheetProps) {
  const isEditMode = !!classroom;

  const [form, setForm] = useState<ClassroomForm>({
    name: "",
    capacity: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    if (classroom) {
      setForm({
        name: classroom.name,
        capacity: classroom.capacity,
        is_active: classroom.is_active,
      });
    } else {
      setForm({
        name: "",
        capacity: "",
        is_active: true,
      });
    }

    setErrors({});
  }, [open, classroom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "Classroom name is required.";
    }

    const parsedCapacity = Number(form.capacity);

    if (!form.capacity) {
      newErrors.capacity = "Capacity is required.";
    } else if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      newErrors.capacity = "Capacity must be a positive number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: form.name.trim(),
      capacity: parsedCapacity,
      is_active: form.is_active,
    });
  };

  const handleDelete = () => {
    if (!classroom) return;
    onDelete?.(classroom.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DoorOpen className="w-5 h-5" />
            </div>

            <div>
              <SheetTitle className="text-xl font-bold">
                {isEditMode ? "Edit Classroom" : "Add Classroom"}
              </SheetTitle>

              <SheetDescription>
                {isEditMode
                  ? "Update classroom information and settings."
                  : "Create a new classroom for teaching and scheduling."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Classroom Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="classroom-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Classroom Name
            </Label>

            <div className="relative">
              <Input
                id="classroom-name"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });

                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
                placeholder="e.g. Room 101, Lab A"
                className={`pr-10 ${
                  errors.name ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DoorOpen className="w-4 h-4" />
              </div>
            </div>

            {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="classroom-capacity"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Student Capacity
              </Label>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>

                  <TooltipContent>
                    Maximum number of students this room can accommodate.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="relative">
              <Input
                id="classroom-capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => {
                  setForm({ ...form, capacity: e.target.value });

                  if (errors.capacity) {
                    setErrors({ ...errors, capacity: "" });
                  }
                }}
                placeholder="e.g. 40"
                className={`pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  errors.capacity ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Users className="w-4 h-4" />
              </div>
            </div>

            {errors.capacity && (
              <p className="text-xs text-destructive font-medium">{errors.capacity}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-all">
            <div>
              <Label htmlFor="classroom-active" className="text-sm font-semibold cursor-pointer">
                Active Status
              </Label>

              <p className="text-xs text-muted-foreground">
                Whether the classroom is available for scheduling.
              </p>
            </div>

            <Switch
              id="classroom-active"
              checked={form.is_active}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  is_active: checked,
                })
              }
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-border mt-8">
            {isEditMode && canDelete && (
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={handleDelete}
                className="w-[50%]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />

              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Classroom"
                  : "Create Classroom"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
