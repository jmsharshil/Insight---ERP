import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAYS, PERIODS, PERIOD_TIMES, type Day, type TimetableSlot } from "@/constants/dummy/timetable";

interface GridViewProps {
  batchSlots: TimetableSlot[];
  isFaculty: boolean;
  facultyId?: string;
  canEdit: boolean;
  onCellClick: (day: Day, period: number) => void;
}

export default function GridView({
  batchSlots,
  isFaculty,
  facultyId,
  canEdit,
  onCellClick,
}: GridViewProps) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-x-auto">
      <div className="grid min-w-[800px]" style={{ gridTemplateColumns: "80px repeat(6, 1fr)" }}>
        <div className="bg-muted/40 p-3 text-xs font-medium text-muted-foreground">Time</div>
        {DAYS.map((d) => (
          <div key={d} className="bg-muted/40 p-3 text-xs font-medium">
            {d}
          </div>
        ))}
        {PERIODS.map((p) => (
          <div key={`p-row-${p}`} className="contents">
            <div className="border-t border-border p-2 text-xs">
              <p className="font-medium">P{p}</p>
              <p className="text-muted-foreground">{PERIOD_TIMES[p].start}</p>
            </div>
            {DAYS.map((d) => {
              const slot = batchSlots.find((s) => s.day === d && s.period === p);
              const isMine = slot && isFaculty && slot.facultyId === facultyId;
              return (
                <button
                  key={`${d}-${p}`}
                  disabled={isFaculty && !slot}
                  onClick={() => !isFaculty && onCellClick(d, p)}
                  className={cn(
                    "border-t border-l border-border p-2 text-xs text-left min-h-[80px] transition-colors w-full",
                    !slot && canEdit && "hover:bg-primary-light/20",
                    !slot && !canEdit && "cursor-default",
                    slot && "cursor-pointer",
                    slot?.isConflict && "border-2 border-destructive bg-destructive/5",
                    isMine && "bg-primary-light/40",
                  )}
                >
                  {slot ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="font-medium">{slot.subject_name || slot.subject}</p>
                      <p className="text-muted-foreground truncate">{slot.facultyName}</p>
                      <p className="text-muted-foreground">{slot.classroom}</p>
                      {slot.isConflict && (
                        <p className="mt-1 text-destructive font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Conflict
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    canEdit && <span className="text-muted-foreground">+ Add</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
