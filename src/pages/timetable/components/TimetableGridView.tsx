import { useState } from "react";
import { Plus, List, LayoutGrid, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TimetableSlot } from "@/redux/slices/timetableNewSlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: string; label: string }[] = [
  { key: "Monday",    label: "Monday" },
  { key: "Tuesday",   label: "Tuesday" },
  { key: "Wednesday", label: "Wednesday" },
  { key: "Thursday",  label: "Thursday" },
  { key: "Friday",    label: "Friday" },
  { key: "Saturday",  label: "Saturday" },
];

const SLOT_CODES = [
  { code: "P1", start: "08:00", end: "10:00" },
  { code: "P2", start: "10:15", end: "12:15" },
  { code: "P3", start: "12:45", end: "14:45" },
  { code: "P4", start: "15:00", end: "17:00" },
];

const SESSION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  regular:    { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200" },
  class_test: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200" },
  prelim:     { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  practice:   { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200" },
  custom:     { bg: "bg-gray-50",   text: "text-gray-700",   border: "border-gray-200" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimetableGridViewProps {
  slots:        TimetableSlot[];
  batches:      { id: string; name: string }[];
  canEdit?:     boolean;
  onAddClick?:  (day: string, slotCode: string) => void;
  onSlotClick?: (slot: TimetableSlot) => void;
  onDeleteSlot?:(slot: TimetableSlot) => void;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getSlotsForCell(
  slots: TimetableSlot[],
  day: string,
  slotCode: string,
  batchId: string,
): TimetableSlot[] {
  return slots.filter(s => {
    const dayMatch = s.day_label === day || s.day_of_week_display === day;
    const codeMatch = s.slot_code === slotCode;
    const batchMatch = !batchId || s.batch === batchId;
    return dayMatch && codeMatch && batchMatch && s.session_type === "regular";
  });
}

// ─── Slot Card (inside a cell) ────────────────────────────────────────────────

function SlotCard({ slot, onSlotClick, onDeleteSlot, canEdit }: {
  slot: TimetableSlot;
  onSlotClick?: (s: TimetableSlot) => void;
  onDeleteSlot?: (s: TimetableSlot) => void;
  canEdit?: boolean;
}) {
  const color = SESSION_COLORS[slot.session_type] ?? SESSION_COLORS.custom;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative rounded-lg border px-2.5 py-2 cursor-pointer transition-all hover:shadow-sm ${color.bg} ${color.border}`}
      onClick={() => onSlotClick?.(slot)}
    >
      {/* Subject */}
      <div className={`text-xs font-semibold leading-tight truncate ${color.text}`}>
        {slot.subject_name || "No subject"}
      </div>

      {/* Faculty */}
      {slot.faculty_name && (
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {slot.faculty_name}
        </div>
      )}

      {/* Classroom */}
      {slot.classroom_name && (
        <div className="text-[11px] text-muted-foreground truncate">
          {slot.classroom_name}
        </div>
      )}

      {/* Session type badge — shown on hover */}
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Badge className={`text-[10px] px-1.5 py-0 h-4 capitalize ${color.bg} ${color.text} border ${color.border}`}>
          {slot.session_type_display || slot.session_type}
        </Badge>
        {canEdit && onDeleteSlot && (
          <button
            onClick={e => { e.stopPropagation(); onDeleteSlot(slot); }}
            className="w-4 h-4 flex items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Exam linked indicator */}
      {slot.exam && (
        <div className="mt-1">
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">exam</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TimetableGridView({
  slots, batches, canEdit, onAddClick, onSlotClick, onDeleteSlot,
}: TimetableGridViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
        />
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Session Type", "Day / Date", "Time", "Subject", "Faculty", "Classroom", "Slot"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filteredSlots.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No slots for this batch.</td></tr>
              ) : filteredSlots.map((slot, i) => {
                const color = SESSION_COLORS[slot.session_type] ?? SESSION_COLORS.custom;
                return (
                  <tr key={slot.id}
                    className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => onSlotClick?.(slot)}>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs capitalize ${color.bg} ${color.text} border ${color.border}`}>
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

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <GridHeader
        batches={batches}
        selectedBatchId={selectedBatchId}
        onBatchChange={setSelectedBatchId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "760px" }}>
            {/* Header row — days */}
            <thead>
              <tr>
                <th className="w-[80px] px-3 py-3 text-left text-xs font-semibold text-muted-foreground border-b border-r border-border bg-muted/30">
                  Time
                </th>
                {DAYS.map(day => (
                  <th key={day.key}
                    className="px-3 py-3 text-left text-xs font-semibold text-foreground border-b border-r border-border bg-muted/30 last:border-r-0">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {SLOT_CODES.map((slot, rowIdx) => (
                <tr key={slot.code} className={rowIdx % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                  {/* Time column */}
                  <td className="w-[80px] px-3 py-3 border-b border-r border-border align-top">
                    <div className="text-xs font-bold text-foreground">{slot.code}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{slot.start}
                    </div>
                  </td>

                  {/* Day cells */}
                  {DAYS.map(day => {
                    const cellSlots = getSlotsForCell(slots, day.key, slot.code, selectedBatchId);

                    return (
                      <td key={day.key}
                        className="px-2 py-2 border-b border-r border-border align-top last:border-r-0 min-h-[72px]"
                        style={{ minHeight: "72px", verticalAlign: "top" }}>
                        <div className="flex flex-col gap-1.5 min-h-[64px]">
                          {/* Filled slots */}
                          {cellSlots.map(s => (
                            <SlotCard
                              key={s.id}
                              slot={s}
                              onSlotClick={onSlotClick}
                              onDeleteSlot={onDeleteSlot}
                              canEdit={canEdit}
                            />
                          ))}

                          {/* Add button — show when cell is empty or canEdit */}
                          {canEdit && (
                            <button
                              onClick={() => onAddClick?.(day.key, slot.code)}
                              className={`flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors px-1 py-0.5 rounded hover:bg-primary/5 w-fit
                                ${cellSlots.length === 0 ? "opacity-60 hover:opacity-100" : "opacity-0 hover:opacity-100"}`}
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Grid Header (batch tabs + view toggle) ───────────────────────────────────

function GridHeader({
  batches, selectedBatchId, onBatchChange, viewMode, onViewModeChange,
}: {
  batches:           { id: string; name: string }[];
  selectedBatchId:   string;
  onBatchChange:     (id: string) => void;
  viewMode:          "grid" | "list";
  onViewModeChange:  (v: "grid" | "list") => void;
}) {
  return (
    <div className="space-y-3">
      {/* Term info banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="text-xs text-amber-800">
          Showing <span className="font-semibold">Regular</span> sessions — weekly recurring schedule
        </span>
        <span className="text-xs text-amber-700">
          Use <span className="font-semibold">All Slots</span> tab to manage class tests, prelims & custom sessions
        </span>
      </div>

      {/* Batch selector + view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Batch pills */}
        <div className="flex flex-wrap gap-2">
          {batches.map(b => (
            <button
              key={b.id}
              onClick={() => onBatchChange(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer
                ${selectedBatchId === b.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-foreground border-border hover:border-primary/40 hover:bg-primary/5"}`}
            >
              {b.name}
            </button>
          ))}
          {batches.length === 0 && (
            <span className="text-xs text-muted-foreground px-2">No batches loaded</span>
          )}
        </div>

        {/* Grid / List toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white shrink-0">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
              ${viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/40"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
              ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/40"}`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>
    </div>
  );
}
