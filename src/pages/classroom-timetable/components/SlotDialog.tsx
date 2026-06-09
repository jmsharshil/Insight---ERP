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
  subjects?: any[];
  facultyList?: any[];
  classrooms?: any[];
}

export default function SlotDialog({
  open,
  existing,
  defaults,
  subjects = [],
  facultyList = [],
  classrooms = [],
  onClose,
  onSave,
  onDelete,
}: SlotDialogProps) {
  const [isViewMode, setIsViewMode] = useState(false);

  const [s, setS] = useState<TimetableSlot>(
    () =>
      existing ?? {
        id: `TT-${Date.now()}`,
        batch: defaults?.batch ?? "Batch A",
        day: (defaults?.day ?? "Monday") as Day,
        period: (defaults?.period ?? 1) as 1,
        startTime: PERIOD_TIMES[defaults?.period ?? 1].start,
        endTime: PERIOD_TIMES[defaults?.period ?? 1].end,
        subject: subjects[0]?.id || SUBJECTS[0],
        subject_name: subjects[0]?.name || SUBJECTS[0],
        facultyId: facultyList[0]?.id || FACULTY[0].id,
        facultyName: facultyList[0]?.name || facultyList[0]?.first_name || FACULTY[0].name,
        classroom: classrooms[0]?.name || CLASSROOMS[0],
      },
  );

  useEffect(() => {
    if (open) {
      if (existing) {
        setS(existing);
        setIsViewMode(true);
      } else if (defaults) {
        setS({
          id: `TT-${Date.now()}`,
          batch: defaults.batch,
          day: (defaults.day ?? "Monday") as Day,
          period: (defaults.period ?? 1) as 1,
          startTime: PERIOD_TIMES[defaults.period ?? 1].start,
          endTime: PERIOD_TIMES[defaults.period ?? 1].end,
          subject: subjects[0]?.id || SUBJECTS[0],
          subject_name: subjects[0]?.name || SUBJECTS[0],
          facultyId: facultyList[0]?.id || FACULTY[0].id,
          facultyName: facultyList[0]?.name || facultyList[0]?.first_name || FACULTY[0].name,
          classroom: classrooms[0]?.name || CLASSROOMS[0],
        });
        setIsViewMode(false);
      }
    }
  }, [open, existing, defaults?.day, defaults?.period, defaults?.batch, subjects, facultyList, classrooms]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isViewMode ? "View Slot" : existing ? "Edit Slot" : "Add Slot"}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? `Details for ${s.batch} timetable`
              : `${s.batch} timetable slot configuration`}
          </DialogDescription>
        </DialogHeader>
        {isViewMode ? (
          <div className="grid grid-cols-2 gap-4 py-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Day</span>
              <span className="font-medium">{s.day}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Period & Time</span>
              <span className="font-medium">
                P{s.period} ({s.startTime} - {s.endTime})
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-xs mb-1">Subject</span>
              <span className="font-medium">{s.subject_name || s.subject}</span>
            </div>
            {s.course_name && (
              <div className="col-span-2">
                <span className="text-muted-foreground block text-xs mb-1">Course</span>
                <span className="font-medium">{s.course_name} {s.course_code ? `(${s.course_code})` : ''}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Faculty</span>
              <span className="font-medium">{s.facultyName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Classroom</span>
              <span className="font-medium">{s.classroom}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Session</span>
              <span className="font-medium capitalize">{s.session || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Recurring</span>
              <span className="font-medium">{s.is_recurring ? "Yes" : "No"}</span>
            </div>
            {(s.effective_from || s.effective_to) && (
              <div className="col-span-2">
                <span className="text-muted-foreground block text-xs mb-1">Effective Dates</span>
                <span className="font-medium">{s.effective_from || "N/A"} to {s.effective_to || "N/A"}</span>
              </div>
            )}
          </div>
        ) : (
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
            <Select value={s.subject} onValueChange={(v) => {
              const sub = subjects.length > 0 ? subjects.find((x: any) => x.id === v) : { name: v };
              setS({ ...s, subject: v, subject_name: sub?.name || v });
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(subjects.length > 0 ? subjects : SUBJECTS.map(x => ({ id: x, name: x }))).map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
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
                const f = facultyList.length > 0 ? facultyList.find((x: any) => x.id === v) : FACULTY.find((x) => x.id === v);
                if (f) setS({ ...s, facultyId: f.id, facultyName: f.name || `${f.first_name || ''} ${f.last_name || ''}`.trim() || "Faculty" });
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(facultyList.length > 0 ? facultyList : FACULTY).map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name || `${f.first_name || ''} ${f.last_name || ''}`.trim() || f.id}
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
                {(classrooms.length > 0 ? classrooms : CLASSROOMS.map(x => ({ id: x, name: x }))).map((c: any) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        )}
        <DialogFooter>
          {isViewMode ? (
            <>
              {onDelete && (
                <Button variant="outline" onClick={onDelete} className="mr-auto text-destructive">
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setIsViewMode(false)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                Edit Slot
              </Button>
            </>
          ) : (
            <>
              {onDelete && existing && (
                <Button variant="outline" onClick={onDelete} className="mr-auto text-destructive">
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={() => existing ? setIsViewMode(true) : onClose()}>
                Cancel
              </Button>
              <Button
                onClick={() => onSave(s)}
                className="bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
