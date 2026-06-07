import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
}

export default function TimetableTab({
  batch,
  setBatch,
  slots,
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
}: TimetableTabProps) {
  const toast = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<TimetableSlot | null>(null);

  const batchSlots = useMemo(() => slots.filter((s) => s.batch === batch), [slots, batch]);
  const conflicts = useMemo(() => slots.filter((s) => s.isConflict), [slots]);

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
