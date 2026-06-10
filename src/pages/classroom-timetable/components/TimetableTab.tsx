import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { TimetableAction } from "@/redux/actions";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { TT_BATCHES, type Day, type TimetableSlot } from "@/constants/dummy/timetable";
import GridView from "./GridView";
import ListView from "./ListView";
import SlotDialog from "./SlotDialog";

interface TimetableTabProps {
  batch: string;
  setBatch: (b: string) => void;
  slots: TimetableSlot[];
  loading?: boolean;
  batches: any[];
  isFaculty: boolean;
  facultyId?: string;
  canEdit: boolean;
  saveSlot: (s: TimetableSlot) => void;
  deleteSlot: (s: TimetableSlot) => void;
  publishOpen: boolean;
  setPublishOpen: (open: boolean) => void;
  conflictsPanel: boolean;
  setConflictsPanel: (open: boolean) => void;
  adding: { day?: Day; period?: number } | null;
  setAdding: (adding: { day?: Day; period?: number } | null) => void;
  subjects?: any[];
  facultyList?: any[];
  classrooms?: any[];
}

export default function TimetableTab({
  batch,
  setBatch,
  slots,
  loading,
  batches,
  isFaculty,
  facultyId,
  canEdit,
  saveSlot,
  deleteSlot,
  publishOpen,
  setPublishOpen,
  conflictsPanel,
  setConflictsPanel,
  adding,
  setAdding,
  subjects,
  facultyList,
  classrooms,
}: TimetableTabProps) {
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<TimetableSlot | null>(null);

  const batchSlots = useMemo(() => slots.filter((s) => s.batch === batch), [slots, batch]);
  const conflicts = useMemo(() => slots.filter((s) => s.isConflict), [slots]);

  const handleEdit = (existing: TimetableSlot) => {
    // Open dialog instantly for a responsive UI
    setEditing(existing);

    if (existing.id.startsWith("TT-")) {
      return;
    }

    dispatch({
      type: TimetableAction.GET_TIMETABLE_DETAIL,
      method: "GET",
      endPoint: `/api/v1/timetable/${existing.id}/`,
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        const updatedSlot: TimetableSlot = {
          ...existing,
          subject: data.subject || existing.subject,
          subject_name: data.subject_name || existing.subject_name,
          facultyId: data.faculty || existing.facultyId,
          facultyName: data.faculty_name || existing.facultyName,
          classroom: data.classroom_name || data.classroom || existing.classroom,
          startTime: data.start_time?.substring(0, 5) || existing.startTime,
          endTime: data.end_time?.substring(0, 5) || existing.endTime,
          course_name: data.course_name || existing.course_name,
          course_code: data.course_code || existing.course_code,
          session: data.session || existing.session,
          is_recurring: data.is_recurring ?? existing.is_recurring,
          effective_from: data.effective_from || existing.effective_from,
          effective_to: data.effective_to || existing.effective_to,
        };
        setEditing(updatedSlot);
      }
    });
  };

  const batchNames = useMemo(() => {
    if (batches.length === 0) return [];
    return batches.map((b) => b.name);
  }, [batches]);

  // If selected batch is not in the list, set to first one
  useMemo(() => {
    if (batchNames.length > 0 && !batchNames.includes(batch)) {
      setBatch(batchNames[0]);
    }
  }, [batchNames, batch, setBatch]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Academic Calendar mini skeleton */}
        <Skeleton className="h-14 w-full rounded-xl" />

        {/* Tabs skeleton */}
        <div className="flex gap-3 mb-3 items-center">
          <Skeleton className="h-10 w-64 rounded-md" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>

        {/* Grid skeleton */}
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
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
        {batchNames.length > 0 ? (
          <Tabs value={batch} onValueChange={setBatch}>
            <TabsList>
              {batchNames.map((b) => (
                <TabsTrigger key={b} value={b}>
                  {b}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <div className="text-sm text-muted-foreground">No active student batches available.</div>
        )}
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
          facultyId={facultyId}
          canEdit={canEdit}
          onCellClick={(day, period) => {
            const existing = batchSlots.find((s) => s.day === day && s.period === period);
            if (existing) handleEdit(existing);
            else if (canEdit) setAdding({ day, period });
          }}
        />
      ) : (
        <ListView slots={batchSlots} onEdit={handleEdit} />
      )}

      {/* Slot dialog */}
      <SlotDialog
        open={!!editing || !!adding}
        existing={editing ?? undefined}
        defaults={adding ? { day: adding.day, period: adding.period, batch } : undefined}
        subjects={subjects}
        facultyList={facultyList}
        classrooms={classrooms}
        onClose={() => {
          setEditing(null);
          setAdding(null);
        }}
        onSave={(s) => {
          saveSlot(s);
          setEditing(null);
          setAdding(null);
        }}
        onDelete={
          editing && canEdit
            ? () => {
                deleteSlot(editing);
                setEditing(null);
                setAdding(null);
              }
            : undefined
        }
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
