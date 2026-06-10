import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type TimetableSlot } from "@/constants/dummy/timetable";

interface ListViewProps {
  slots: TimetableSlot[];
  onEdit: (s: TimetableSlot) => void;
}

export default function ListView({ slots, onEdit }: ListViewProps) {
  return (
    <div className="rounded-xl bg-card border border-border divide-y divide-border">
      {slots.map((s) => (
        <div key={s.id} className="flex items-center gap-3 p-3">
          <div className="w-20 text-xs">
            <p className="font-medium">
              {s.day.slice(0, 3)} · P{s.period}
            </p>
            <p className="text-muted-foreground">{s.startTime}</p>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{s.subject_name}</p>
            <p className="text-xs text-muted-foreground">
              {s.facultyName} @ {s.classroom}
            </p>
          </div>
          {s.isConflict && (
            <span className="text-destructive text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Conflict
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(s)}>
            Edit
          </Button>
        </div>
      ))}
    </div>
  );
}
