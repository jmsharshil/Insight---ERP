import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, AlertTriangle, Send, X } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/common/ConfirmDialog";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DUMMY_TIMETABLE,
  DAYS,
  PERIODS,
  PERIOD_TIMES,
  TT_BATCHES,
  FACULTY,
  SUBJECTS,
  CLASSROOMS,
  type Day,
  type TimetableSlot,
} from "@/constants/dummy/timetable";
import { cn } from "@/lib/utils";

function detectConflicts(slots: TimetableSlot[]) {
  const map: TimetableSlot[] = slots.map((s) => ({ ...s, isConflict: false }));
  for (let i = 0; i < map.length; i++) {
    for (let j = i + 1; j < map.length; j++) {
      const a = map[i],
        b = map[j];
      if (a.day === b.day && a.period === b.period) {
        if (a.facultyId === b.facultyId || a.classroom === b.classroom) {
          a.isConflict = true;
          b.isConflict = true;
        }
      }
    }
  }
  return map;
}

export default function TimetablePage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  useEffect(() => {
    setPageTitle("Timetable");
  }, [setPageTitle]);

  const [slots, setSlots] = useState(() => detectConflicts(DUMMY_TIMETABLE));
  const [batch, setBatch] = useState(user?.role === "faculty" ? "Batch A" : "Batch A");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [adding, setAdding] = useState<{ day?: Day; period?: number } | null>(null);
  const [conflictsPanel, setConflictsPanel] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const isFaculty = user?.role === "faculty";
  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_exec"].includes(user.role);

  const batchSlots = useMemo(() => slots.filter((s) => s.batch === batch), [slots, batch]);
  const conflicts = useMemo(() => slots.filter((s) => s.isConflict), [slots]);
  const hasConflicts = conflicts.length > 0;

  function saveSlot(s: TimetableSlot) {
    setSlots((prev) => {
      const next = prev.some((x) => x.id === s.id)
        ? prev.map((x) => (x.id === s.id ? s : x))
        : [...prev, s];
      return detectConflicts(next);
    });
    const newConflicts = detectConflicts(slots.map((x) => (x.id === s.id ? s : x))).filter(
      (x) => x.id === s.id && x.isConflict,
    );
    if (newConflicts.length > 0) {
      toast.warning("Conflict detected: faculty or classroom already assigned at this time.");
    } else {
      toast.success("Timetable slot saved.");
    }
    setEditing(null);
    setAdding(null);
  }

  function deleteSlot(s: TimetableSlot) {
    setSlots((prev) => detectConflicts(prev.filter((x) => x.id !== s.id)));
    toast.success("Slot deleted.");
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Timetable & Scheduling"
        subtitle="Plan classes, faculty assignments and classrooms."
        actions={
          canEdit ? (
            <>
              <Button
                variant="outline"
                onClick={() => setConflictsPanel(true)}
                className="relative"
              >
                <AlertTriangle className="w-4 h-4" /> Conflicts
                {hasConflicts && (
                  <span className="ml-1 px-1.5 rounded-full bg-destructive text-white text-[10px]">
                    {conflicts.length}
                  </span>
                )}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        disabled={hasConflicts}
                        onClick={() => setPublishOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-primary-foreground"
                      >
                        <Send className="w-4 h-4" /> Publish
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {hasConflicts && <TooltipContent>Resolve conflicts to publish</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" onClick={() => setAdding({})}>
                <Plus className="w-4 h-4" /> Add Slot
              </Button>
            </>
          ) : undefined
        }
      />

      {/* Academic Calendar mini */}
      <div className="rounded-xl bg-primary-light/40 border border-primary/30 p-3 mb-4 flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Term:</span> <b>2024–25 Winter</b>
        </div>
        <div>
          <span className="text-muted-foreground">Exam Period:</span> <b>15 Dec – 30 Dec</b>
        </div>
        <div>
          <span className="text-muted-foreground">Holidays:</span> <b>25–26 Dec</b>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-3">
        <Tabs value={batch} onValueChange={setBatch}>
          <TabsList>
            {TT_BATCHES.map((b) => (
              <TabsTrigger key={b} value={b}>
                {b}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
          >
            Grid
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            List
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <GridView
          batchSlots={batchSlots}
          isFaculty={isFaculty}
          facultyId={user?.id}
          canEdit={!!canEdit}
          onCellClick={(day, period) => {
            const existing = batchSlots.find((s) => s.day === day && s.period === period);
            if (existing) setEditing(existing);
            else if (canEdit) setAdding({ day, period });
          }}
        />
      ) : (
        <ListView slots={batchSlots} onEdit={setEditing} />
      )}

      {/* Slot dialog */}
      <SlotDialog
        open={!!editing || !!adding}
        existing={editing ?? undefined}
        defaults={adding ? { day: adding.day, period: adding.period, batch } : undefined}
        onClose={() => {
          setEditing(null);
          setAdding(null);
        }}
        onSave={saveSlot}
        onDelete={editing && canEdit ? () => deleteSlot(editing) : undefined}
      />

      {/* Conflicts panel */}
      <Sheet open={conflictsPanel} onOpenChange={setConflictsPanel}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Conflicts ({conflicts.length})</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {conflicts.length === 0 && (
              <p className="text-sm text-muted-foreground">No conflicts. Ready to publish.</p>
            )}
            {conflicts.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-medium">
                      {c.batch} · {c.day} · P{c.period}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.subject} — {c.facultyName} @ {c.classroom}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(c);
                      setConflictsPanel(false);
                    }}
                  >
                    Resolve
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={`Publish timetable for ${batch}?`}
        description="Students and faculty will be notified."
        confirmLabel="Publish"
        onConfirm={() =>
          toast.success(
            `Timetable published for ${batch}! Push notifications sent to students and faculty.`,
          )
        }
      />
    </div>
  );
}

function GridView({
  batchSlots,
  isFaculty,
  facultyId,
  canEdit,
  onCellClick,
}: {
  batchSlots: TimetableSlot[];
  isFaculty: boolean;
  facultyId?: string;
  canEdit: boolean;
  onCellClick: (day: Day, period: number) => void;
}) {
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
          <>
            <div key={`p-${p}`} className="border-t border-border p-2 text-xs">
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
                    "border-t border-l border-border p-2 text-xs text-left min-h-[80px] transition-colors",
                    !slot && canEdit && "hover:bg-primary-light/20",
                    !slot && !canEdit && "cursor-default",
                    slot && "cursor-pointer",
                    slot?.isConflict && "border-2 border-destructive bg-destructive/5",
                    isMine && "bg-primary-light/40",
                  )}
                >
                  {slot ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="font-medium">{slot.subject}</p>
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
          </>
        ))}
      </div>
    </div>
  );
}

function ListView({
  slots,
  onEdit,
}: {
  slots: TimetableSlot[];
  onEdit: (s: TimetableSlot) => void;
}) {
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
            <p className="font-medium text-sm">{s.subject}</p>
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

function SlotDialog({
  open,
  existing,
  defaults,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  existing?: TimetableSlot;
  defaults?: { day?: Day; period?: number; batch: string };
  onClose: () => void;
  onSave: (s: TimetableSlot) => void;
  onDelete?: () => void;
}) {
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
  }, [existing, defaults?.day, defaults?.period, defaults?.batch]);

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
