import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Plus, List, LayoutGrid, User, MapPin, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, Layers, GripVertical, Copy, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimetableSlot } from "@/redux/slices/timetableNewSlice";
import { timetableActions } from "@/redux/actions";
import { useToast } from "@/hooks/useToast";
import type { AppDispatch } from "@/store";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: string; label: string; short: string }[] = [
  { key: "Monday",    label: "Monday",    short: "MON" },
  { key: "Tuesday",   label: "Tuesday",   short: "TUE" },
  { key: "Wednesday", label: "Wednesday", short: "WED" },
  { key: "Thursday",  label: "Thursday",  short: "THU" },
  { key: "Friday",    label: "Friday",    short: "FRI" },
  { key: "Saturday",  label: "Saturday",  short: "SAT" },
  { key: "Sunday",    label: "Sunday",    short: "SUN" },
];

const BASE_SLOT_CODES = [
  { code: "P1", start: "08:00", end: "10:00" },
  { code: "P2", start: "10:15", end: "12:15" },
  { code: "P3", start: "12:45", end: "14:45" },
  { code: "P4", start: "15:00", end: "17:00" },
];

const EXTRA_SLOT_CODES = [
  { code: "P5", start: "Custom", end: "Time" },
  { code: "P6", start: "Custom", end: "Time" },
];

// User-specified hex colors
const SESSION_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  regular:    { bg: "bg-[#E3F2FD]", text: "text-[#1E88E5]", border: "border-[#90CAF9]", accent: "#1E88E5" },
  class_test: { bg: "bg-[#FFF3E0]", text: "text-[#FB8C00]", border: "border-[#FFCC80]", accent: "#FB8C00" },
  prelim:     { bg: "bg-[#FFEBEE]", text: "text-[#E53935]", border: "border-[#EF9A9A]", accent: "#E53935" },
  practice:   { bg: "bg-[#E8F5E9]", text: "text-[#43A047]", border: "border-[#A5D6A7]", accent: "#43A047" },
  custom:     { bg: "bg-[#F3E5F5]", text: "text-[#8E24AA]", border: "border-[#CE93D8]", accent: "#8E24AA" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimetableGridViewProps {
  slots:        TimetableSlot[];
  batches:      { id: string; name: string }[];
  canEdit?:     boolean;
  canDelete?:   boolean;
  onAddClick?:  (day: string, slotCode: string, batchId: string, date: string) => void;
  onSlotClick?: (slot: TimetableSlot) => void;
  onDeleteSlot?:(slot: TimetableSlot) => void;
  onDuplicateSlot?: (slotId: string, targetSlotCode: string, targetDayOfWeek: number, targetDayLabel: string, targetDate: string, sourceSlot: TimetableSlot) => void;
}

const DAY_TO_NUM: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSlotsForCell(
  slots: TimetableSlot[],
  day: string,
  slotCode: string,
  batchId: string,
): TimetableSlot[] {
  return slots.filter(s => {
    const batchMatch = !batchId || s.batch === batchId;
    if (!batchMatch) return false;

    if (s.session_type === "regular") {
      const dayMatch = s.day_label === day || s.day_of_week_display === day;
      const codeMatch = s.slot_code === slotCode;
      return dayMatch && codeMatch;
    } else {
      // Dynamic mapping for non-regular sessions (class tests, prelims, etc.)
      if (!s.session_date || !s.start_time) return false;
      
      const dateObj = new Date(s.session_date);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
      const dayMatch = dayName === day;

      const t = s.start_time.substring(0, 5);
      let derivedSlot = "";
      if (t < "10:15") derivedSlot = "P1";
      else if (t < "12:45") derivedSlot = "P2";
      else if (t < "15:00") derivedSlot = "P3";
      else if (t < "17:15") derivedSlot = "P4";
      else if (t < "19:15") derivedSlot = "P5";
      else derivedSlot = "P6";

      const codeMatch = derivedSlot === slotCode;
      return dayMatch && codeMatch;
    }
  });
}

/** Get Monday of the week containing the given date */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Build a map of day name → "YYYY-MM-DD" for the week of the given Monday */
function buildWeekDates(monday: Date): Map<string, string> {
  const result = new Map<string, string>();
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  dayNames.forEach((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    result.set(name, `${yyyy}-${mm}-${dd}`);
  });
  return result;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TimetableGridView({
  slots, batches, canEdit, canDelete, onAddClick, onSlotClick, onDeleteSlot, onDuplicateSlot,
}: TimetableGridViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [weekOffset, setWeekOffset] = useState(0);
  const [showExtraSlots, setShowExtraSlots] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const handlePublish = () => {
    if (!selectedBatchId) {
      toast.error("Please select a batch first");
      return;
    }

    dispatch({
      type: timetableActions.PUBLISH_TIMETABLE,
      method: "POST",
      endPoint: "/api/v1/timetable/publish/",
      body: { batch_id: selectedBatchId },
      auth: true,
      setLoading: (v: boolean) => setIsPublishing(v),
      getResponse: (res: any) => {
        if (res?.success) toast.success("Time Table Published successfully");
        else toast.error("Failed to publish timetable");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error publishing timetable"),
    } as any);
  };

  // ── Drag & Drop state ──────────────────────────────────────────────────────
  const [draggingSlot, setDraggingSlot] = useState<TimetableSlot | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null); // "dayKey:slotCode"

  const handleDragStart = useCallback((e: React.DragEvent, slot: TimetableSlot) => {
    if (slot.session_type !== "regular") { e.preventDefault(); return; }
    setDraggingSlot(slot);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", slot.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingSlot(null);
    setDragOverCell(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverCell(cellKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dayKey: string, slotCode: string, dateStr: string) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!draggingSlot || draggingSlot.session_type !== "regular") return;
    const dayNum = DAY_TO_NUM[dayKey];
    if (dayNum === undefined) return;
    onDuplicateSlot?.(draggingSlot.id, slotCode, dayNum, dayKey, dateStr, draggingSlot);
    setDraggingSlot(null);
  }, [draggingSlot, onDuplicateSlot]);

  useEffect(() => {
    if (batches.length > 0 && !batches.some(b => b.id === selectedBatchId)) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // Compute week dates based on offset from current week
  const { weekDates, todayStr, weekLabel } = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayStr();
    const currentMonday = getMondayOfWeek(today);
    const targetMonday = new Date(currentMonday);
    targetMonday.setDate(currentMonday.getDate() + weekOffset * 7);
    const weekDates = buildWeekDates(targetMonday);

    const weekLabel = `${formatDateShort(Array.from(weekDates.values())[0])} – ${formatDateShort(Array.from(weekDates.values())[6])}`;

    return { weekDates, todayStr, weekLabel };
  }, [weekOffset]);

  // ── List view ──────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    const filteredSlots = selectedBatchId
      ? slots.filter(s => s.batch === selectedBatchId)
      : slots;

    return (
      <div className="space-y-3">
        <GridHeader
          batches={batches}
          selectedBatchId={selectedBatchId}
          onBatchChange={setSelectedBatchId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          weekLabel={weekLabel}
          onPrevWeek={() => setWeekOffset(w => w - 1)}
          onNextWeek={() => setWeekOffset(w => w + 1)}
          onToday={() => setWeekOffset(0)}
          showWeekNav={false}
          showExtraSlots={showExtraSlots}
          onToggleExtraSlots={setShowExtraSlots}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Session Type", "Day / Date", "Time", "Subject", "Faculty", "Classroom", "Slot"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filteredSlots.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-muted-foreground text-sm">No slots for this batch.</td></tr>
              ) : filteredSlots.map((slot, i) => {
                const color = SESSION_COLORS[slot.session_type] ?? SESSION_COLORS.custom;
                return (
                  <tr key={slot.id}
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${canEdit ? "cursor-pointer" : ""}`}
                    onClick={() => onSlotClick?.(slot)}>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs capitalize font-semibold ${color.bg} ${color.text} border ${color.border}`}>
                        {slot.session_type_display || slot.session_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {slot.session_type === "regular"
                        ? slot.day_label ?? slot.day_of_week_display ?? "—"
                        : slot.session_date ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{slot.subject_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{slot.faculty_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{slot.classroom_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono">{slot.slot_code ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Grid view (new layout: days=rows, slots=columns) ──────────────────────
  return (
    <div className="space-y-3">
      <GridHeader
        batches={batches}
        selectedBatchId={selectedBatchId}
        onBatchChange={setSelectedBatchId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        weekLabel={weekLabel}
        onPrevWeek={() => setWeekOffset(w => w - 1)}
        onNextWeek={() => setWeekOffset(w => w + 1)}
        onToday={() => setWeekOffset(0)}
        showWeekNav={true}
        showExtraSlots={showExtraSlots}
        onToggleExtraSlots={setShowExtraSlots}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />

      {/* Grid Table — Days as Rows, Slots as Columns */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed" style={{ minWidth: "1100px" }}>
            {/* Header row — slot codes as columns */}
            <thead>
              <tr>
                <th className="w-[160px] min-w-[160px] px-4 py-4 text-center border-b-2 border-r border-border bg-gradient-to-b from-muted/40 to-muted/20">
                  <CalendarDays className="w-4 h-4 mx-auto mb-1 text-muted-foreground/50" />
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Day</div>
                </th>
                {(showExtraSlots ? [...BASE_SLOT_CODES, ...EXTRA_SLOT_CODES] : BASE_SLOT_CODES).map((slot, _, arr) => (
                  <th key={slot.code}
                    className="px-4 py-4 text-center border-b-2 border-r border-border bg-gradient-to-b from-muted/40 to-muted/20 last:border-r-0"
                    style={{ width: `calc((100% - 160px) / ${arr.length})` }}>
                    <div className="text-base font-extrabold text-foreground tracking-wide">{slot.code}</div>
                    <div className="text-md font-bold text-muted-foreground mt-1 font-mono">
                      {slot.start} – {slot.end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {DAYS.map((day, rowIdx) => {
                const dateStr = weekDates.get(day.key) ?? "";
                const isToday = dateStr === todayStr;

                return (
                  <tr key={day.key} className={isToday ? "bg-blue-50/50" : rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    {/* Day label + date column */}
                    <td className={`w-[160px] min-w-[160px] px-4 py-5 border-b border-r border-border text-center ${isToday ? "bg-blue-50/70" : ""}`}>
                      <div className={`text-base font-extrabold tracking-wide ${isToday ? "text-[#1E88E5]" : "text-foreground"}`}>
                        {day.short}
                      </div>
                      <div className={`text-sm mt-1 font-mono font-medium ${isToday ? "text-[#1E88E5]/70" : "text-muted-foreground"}`}>
                        {dateStr ? formatDateShort(dateStr) : ""}
                      </div>
                      {isToday && (
                        <div className="text-[10px] font-bold text-white bg-[#1E88E5] rounded-full px-3 py-0.5 mt-2 inline-block shadow-sm">
                          TODAY
                        </div>
                      )}
                    </td>

                    {/* Slot cells (one per slot code) */}
                    {(showExtraSlots ? [...BASE_SLOT_CODES, ...EXTRA_SLOT_CODES] : BASE_SLOT_CODES).map(slot => {
                      const cellSlots = getSlotsForCell(slots, day.key, slot.code, selectedBatchId);
                      const isEmpty = cellSlots.length === 0;
                      const firstSlot = cellSlots[0];
                      const color = firstSlot ? (SESSION_COLORS[firstSlot.session_type] ?? SESSION_COLORS.custom) : null;

                      const isRegular = firstSlot?.session_type === "regular";
                      const cellKey = `${day.key}:${slot.code}`;
                      const isDragOver = dragOverCell === cellKey && isEmpty;
                      const isStandardTime = firstSlot?.start_time?.slice(0,5) === slot.start && firstSlot?.end_time?.slice(0,5) === slot.end;

                      return (
                        <td key={slot.code}
                          className={`p-0 border-b border-r border-border align-top last:border-r-0 transition-all relative group
                            ${isEmpty && canEdit ? "hover:bg-blue-50/40 cursor-pointer" : ""}
                            ${!isEmpty && canEdit ? "cursor-pointer" : ""}
                            ${isDragOver ? "!bg-blue-100/60 ring-2 ring-inset ring-blue-400/50" : ""}
                            ${draggingSlot && !isEmpty ? "opacity-60" : ""}`}
                          style={{ height: "230px" }}
                          onClick={() => {
                            if (isEmpty && canEdit) {
                              onAddClick?.(day.key, slot.code, selectedBatchId, dateStr);
                            } else if (!isEmpty) {
                              onSlotClick?.(firstSlot);
                            }
                          }}
                          // Drop target (empty cells only)
                          {...(isEmpty && draggingSlot ? {
                            onDragOver: (e: React.DragEvent) => handleDragOver(e, cellKey),
                            onDragLeave: handleDragLeave,
                            onDrop: (e: React.DragEvent) => handleDrop(e, day.key, slot.code, dateStr),
                          } : {})}
                        >
                          {!isEmpty ? (
                            <div
                              className={`w-full h-full border-l-[6px] flex flex-col ${color?.bg} hover:brightness-[0.95] hover:shadow-inner transition-all relative overflow-hidden
                                ${draggingSlot?.id === firstSlot.id ? "opacity-40 scale-[0.97]" : ""}`}
                              style={{ borderLeftColor: color?.accent }}
                              // Drag source (regular sessions only)
                              draggable={isRegular && !!onDuplicateSlot}
                              onDragStart={isRegular ? (e) => handleDragStart(e, firstSlot) : undefined}
                              onDragEnd={isRegular ? handleDragEnd : undefined}
                            >
                              {/* Drag handle for regular sessions */}
                              {isRegular && onDuplicateSlot && (
                                <div className="absolute top-2 left-1 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing z-10">
                                  <GripVertical className="w-4 h-4 text-muted-foreground/60" />
                                </div>
                              )}

                              {/* ─── Top zone: badge + time ─── */}
                              <div className="flex items-start justify-between px-3.5 pt-3.5 pb-2">
                                <Badge className={`text-[11px] px-2.5 py-0.5 h-auto capitalize font-extrabold tracking-wide ${color?.bg} ${color?.text} border-2 ${color?.border}`}>
                                  {firstSlot.session_type_display || firstSlot.session_type}
                                </Badge>
                                {!isStandardTime && (
                                  <div className="flex items-center gap-1.5 bg-white/70 rounded-md px-2.5 py-1 border border-black/5 shadow-sm">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                    <span className="text-xs font-mono font-bold text-foreground/80">
                                      {firstSlot.start_time?.slice(0,5)} – {firstSlot.end_time?.slice(0,5)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* ─── Subject name ─── */}
                              <div className="px-3.5 pb-2">
                                <div className={`text-base font-extrabold leading-tight line-clamp-2 ${color?.text}`}
                                  title={firstSlot.subject_name || "No Subject"}>
                                  {firstSlot.subject_name || "No Subject"}
                                </div>
                                {firstSlot.session_name && (
                                  <div className="text-[13px] text-muted-foreground/70 truncate mt-1 italic font-medium" title={firstSlot.session_name}>
                                    {firstSlot.session_name}
                                  </div>
                                )}
                              </div>

                              {/* ─── Divider ─── */}
                              <div className="mx-3.5 border-t border-black/[0.08]"></div>

                              {/* ─── Detail rows ─── */}
                              <div className="px-3.5 pt-2.5 pb-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
                                {firstSlot.faculty_name && (
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <User className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                    <span className="text-sm font-medium text-foreground/80 truncate">{firstSlot.faculty_name}</span>
                                  </div>
                                )}
                                {firstSlot.classroom_name && (
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <MapPin className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                    <span className="text-sm font-medium text-foreground/80 truncate">{firstSlot.classroom_name}</span>
                                  </div>
                                )}
                                {firstSlot.chapters_names && firstSlot.chapters_names.length > 0 && (
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <Layers className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                                    <span className="text-[13px] font-medium text-foreground/70 leading-snug line-clamp-3">
                                      {firstSlot.chapters_names.join(" • ")}
                                    </span>
                                  </div>
                                )}
                                {firstSlot.exam && (
                                  <div className="flex items-center gap-2.5 mt-1">
                                    <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                                    <span className="text-[13px] font-extrabold text-purple-700 uppercase tracking-wide">Exam Linked</span>
                                  </div>
                                )}
                              </div>

                              {/* Delete — hover only */}
                              {canDelete && onDeleteSlot && (
                                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={e => { e.stopPropagation(); onDeleteSlot(firstSlot); }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/90 border border-red-200 text-red-500 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-colors text-base font-bold shadow-sm backdrop-blur-md"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`w-full h-full min-h-[230px] flex items-center justify-center relative transition-all
                              ${isDragOver ? "bg-blue-100/40" : ""}`}>
                              {isDragOver ? (
                                <div className="flex flex-col items-center gap-2 animate-pulse">
                                  <Copy className="w-8 h-8 text-blue-500/70" />
                                  <span className="text-sm font-semibold text-blue-600/80">Drop to copy here</span>
                                </div>
                              ) : canEdit && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-2 text-[15px] font-medium text-muted-foreground/60 border-2 border-dashed border-muted-foreground/20 rounded-xl px-5 py-2.5 bg-white/60 hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-colors">
                                    <Plus className="w-5 h-5" /> Add session
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center flex-wrap gap-5 px-2 pt-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Legend:</span>
        {[
          { label: "Regular",    color: "#1E88E5" },
          { label: "Class Test", color: "#FB8C00" },
          { label: "Prelims",    color: "#E53935" },
          { label: "Practice",   color: "#43A047" },
          { label: "Special",    color: "#8E24AA" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Grid Header (batch tabs + view toggle + week navigation) ─────────────────

function GridHeader({
  batches, selectedBatchId, onBatchChange, viewMode, onViewModeChange,
  weekLabel, onPrevWeek, onNextWeek, onToday, showWeekNav,
  showExtraSlots, onToggleExtraSlots, onPublish, isPublishing,
}: {
  batches:           { id: string; name: string }[];
  selectedBatchId:   string;
  onBatchChange:     (id: string) => void;
  viewMode:          "grid" | "list";
  onViewModeChange:  (v: "grid" | "list") => void;
  weekLabel:         string;
  onPrevWeek:        () => void;
  onNextWeek:        () => void;
  onToday:           () => void;
  showWeekNav:       boolean;
  showExtraSlots:    boolean;
  onToggleExtraSlots: (v: boolean) => void;
  onPublish:         () => void;
  isPublishing:      boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="space-y-3">
      {/* Term info banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="text-xs text-amber-800">
          Showing <span className="font-bold">All</span> sessions — including Regular, Class Tests, and Prelims
        </span>
        <span className="text-[11px] text-amber-600">
          Non-regular sessions are automatically mapped to the grid based on their scheduled date and time.
        </span>
      </div>

      {/* Batch selector + week nav + view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Searchable Batch Dropdown */}
        <div className="flex flex-wrap gap-2">
          {batches.length <= 1 ? (
            <div className="flex items-center h-9 px-4 text-sm font-medium bg-muted/30 border border-border rounded-xl text-foreground">
              {selectedBatch ? selectedBatch.name : (batches[0]?.name || "No Batch")}
            </div>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[400px] justify-between h-9 text-sm rounded-xl font-medium"
                >
                  {selectedBatch ? selectedBatch.name : "Select batch..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search batch..." className="h-9 " />
                  <CommandList className="">
                    <CommandEmpty>No batch found.</CommandEmpty>
                    <CommandGroup>
                      {batches.map((batch) => (
                        <CommandItem
                          key={batch.id}
                          value={batch.name}
                          onSelect={() => {
                            onBatchChange(batch.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBatchId === batch.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {batch.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        


          {/* Week navigation */}
          {showWeekNav && (
            <div className="flex items-center gap-1 border border-border rounded-lg bg-white px-1 py-0.5 shadow-sm">
              <button onClick={onPrevWeek} className="p-1.5 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={onToday} className="px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted/60 rounded-md transition-colors cursor-pointer whitespace-nowrap">
                {weekLabel}
              </button>
              <button onClick={onNextWeek} className="p-1.5 rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Extra Slots Toggle */}
          <button
            onClick={() => onToggleExtraSlots(!showExtraSlots)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-sm shrink-0
              ${showExtraSlots ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200" : "bg-white text-muted-foreground border-border hover:bg-muted/40"}`}
          >
            Show P5/P6
          </button>

          {/* Grid / List toggle */}
          {/* <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white shrink-0 shadow-sm">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer
                ${viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/40"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer
                ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/40"}`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div> */}
        </div>
      <Button 
        className="cursor-pointer" 
        onClick={onPublish}
        disabled={isPublishing}
      >
        {isPublishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Publish Time Table
      </Button>
      </div>
    </div>
  );
}
