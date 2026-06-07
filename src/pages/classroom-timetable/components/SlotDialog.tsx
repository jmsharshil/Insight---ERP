import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DAYS,
  PERIODS,
  PERIOD_TIMES,
  SUBJECTS,
  FACULTY,
  CLASSROOMS,
  type Day,
  type TimetableSlot,
} from "@/constants/dummy/timetable";

interface SlotDialogProps {
  open: boolean;
  existing?: TimetableSlot;
  defaults?: { day?: Day; period?: number; batch: string };
  onClose: () => void;
  onSave: (s: TimetableSlot) => void;
  onDelete?: () => void;
}

export default function SlotDialog({
  open,
  existing,
  defaults,
  onClose,
  onSave,
  onDelete,
}: SlotDialogProps) {
  const [s, setS] = useState<TimetableSlot>(
    () =>
      existing ?? {
        id: `TT-${Date.now()}`,
        batch: defaults?.batch ?? "Batch A",
        day: (defaults?.day ?? "Monday") as Day,
        period: (defaults?.period ?? 1) as 1,
        startTime: PERIOD_TIMES[defaults?.period ?? 1].start,
        endTime: PERIOD_TIMES[defaults?.period ?? 1].end,
        subject: SUBJECTS[0],
        facultyId: FACULTY[0].id,
        facultyName: FACULTY[0].name,
        classroom: CLASSROOMS[0],
      },
  );

  useEffect(() => {
    if (existing) setS(existing);
    else if (defaults)
      setS({
        id: `TT-${Date.now()}`,
        batch: defaults.batch,
        day: (defaults.day ?? "Monday") as Day,
        period: (defaults.period ?? 1) as 1,
        startTime: PERIOD_TIMES[defaults.period ?? 1].start,
        endTime: PERIOD_TIMES[defaults.period ?? 1].end,
        subject: SUBJECTS[0],
        facultyId: FACULTY[0].id,
        facultyName: FACULTY[0].name,
        classroom: CLASSROOMS[0],
      });
  }, [existing, defaults?.day, defaults?.period, defaults?.batch, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">{existing ? "Edit Slot" : "Add Slot"}</DialogTitle>
          <DialogDescription>{s.batch} timetable</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Day</Label>
            <Select value={s.day} onValueChange={(v) => setS({ ...s, day: v as Day })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Period</Label>
            <Select
              value={String(s.period)}
              onValueChange={(v) => {
                const p = Number(v) as 1 | 2 | 3 | 4 | 5 | 6;
                setS({
                  ...s,
                  period: p,
                  startTime: PERIOD_TIMES[p].start,
                  endTime: PERIOD_TIMES[p].end,
                });
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    P{p} ({PERIOD_TIMES[p].start})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Subject</Label>
            <Select value={s.subject} onValueChange={(v) => setS({ ...s, subject: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Faculty</Label>
            <Select
              value={s.facultyId}
              onValueChange={(v) => {
                const f = FACULTY.find((x) => x.id === v)!;
                setS({ ...s, facultyId: f.id, facultyName: f.name });
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FACULTY.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Classroom</Label>
            <Select value={s.classroom} onValueChange={(v) => setS({ ...s, classroom: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSROOMS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          {onDelete && (
            <Button variant="outline" onClick={onDelete} className="mr-auto text-destructive">
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(s)}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
