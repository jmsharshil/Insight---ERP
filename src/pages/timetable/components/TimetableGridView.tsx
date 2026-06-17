import { useState, useEffect, Fragment } from "react";
import { Plus, List, LayoutGrid, Clock, User, MapPin, BookOpen, Coffee, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimetableSlot } from "@/redux/slices/timetableNewSlice";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: string; label: string; short: string }[] = [
  { key: "Monday",    label: "Monday",    short: "MON" },
  { key: "Tuesday",   label: "Tuesday",   short: "TUE" },
  { key: "Wednesday", label: "Wednesday", short: "WED" },
  { key: "Thursday",  label: "Thursday",  short: "THU" },
  { key: "Friday",    label: "Friday",    short: "FRI" },
  { key: "Saturday",  label: "Saturday",  short: "SAT" },
];

const SLOT_CODES = [
  { code: "P1", start: "08:00", end: "10:00" },
  { code: "P2", start: "10:15", end: "12:15" },
  { code: "P3", start: "12:45", end: "14:45" },
  { code: "P4", start: "15:00", end: "17:00" },
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
  onAddClick?:  (day: string, slotCode: string, batchId: string) => void;
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
      else derivedSlot = "P4";

      const codeMatch = derivedSlot === slotCode;
      return dayMatch && codeMatch;
    }
  });
}

// Removed SlotCard. Rendering is now inline within the cell.

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TimetableGridView({
  slots, batches, canEdit, canDelete, onAddClick, onSlotClick, onDeleteSlot,
}: TimetableGridViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (batches.length > 0 && !batches.some(b => b.id === selectedBatchId)) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

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
                    className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
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
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed" style={{ minWidth: "820px" }}>
            {/* Header row — days */}
            <thead>
              <tr>
                <th className="w-[90px] px-3 py-3.5 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-r border-border bg-muted/30">
                  <Clock className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground/60" />
                  Time
                </th>
                {DAYS.map(day => (
                  <th key={day.key}
                    className="px-3 py-3.5 text-center border-b border-r border-border bg-muted/30 last:border-r-0 w-[calc((100%-90px)/6)]">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{day.short}</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">{day.label}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {SLOT_CODES.map((slot, rowIdx) => (
                <Fragment key={slot.code}>
                <tr className={rowIdx % 2 === 0 ? "bg-white" : "bg-muted/5"}>
                  {/* Time column */}
                  <td className="w-[90px] px-3 py-4 border-b border-r border-border text-center">
                    <div className="text-sm font-bold text-foreground">{slot.code}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      {slot.start}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {slot.end}
                    </div>
                  </td>

                  {/* Day cells — entire cell is clickable */}
                  {DAYS.map(day => {
                    const cellSlots = getSlotsForCell(slots, day.key, slot.code, selectedBatchId);
                    const isEmpty = cellSlots.length === 0;
                    
                    const firstSlot = cellSlots[0];
                    const color = firstSlot ? (SESSION_COLORS[firstSlot.session_type] ?? SESSION_COLORS.custom) : null;

                    return (
                      <td key={day.key}
                        className={`p-0 border-b border-r border-border align-top last:border-r-0 transition-colors relative group
                          ${isEmpty && canEdit ? "hover:bg-[#1E88E5]/[0.04] cursor-pointer" : ""}
                          ${!isEmpty ? `cursor-pointer ${color?.bg}` : ""}`}
                        style={{ height: "100px" }}
                        onClick={() => {
                          if (isEmpty && canEdit) {
                            onAddClick?.(day.key, slot.code, selectedBatchId);
                          } else if (!isEmpty) {
                            onSlotClick?.(firstSlot);
                          }
                        }}
                      >
                        {!isEmpty ? (
                          <div className={`w-full h-full border-l-[4px] p-2 flex flex-col`} style={{ borderLeftColor: color?.accent }}>
                            {/* Primary info */}
                            <div className={`text-[13px] font-bold leading-tight line-clamp-2 break-all ${color?.text} mb-1.5`} title={`${firstSlot.subject_name || "No Subject"}${firstSlot.session_name ? ` — ${firstSlot.session_name}` : ""}`}>
                              {firstSlot.subject_name || "No Subject"}
                              {firstSlot.session_name && <span className="font-normal opacity-80 break-all"> — {firstSlot.session_name}</span>}
                            </div>
                            
                            <div className="flex-1"></div>

                            <div className="grid grid-cols-1 gap-1">
                              {firstSlot.faculty_name && (
                                <div className="flex items-center gap-1.5 text-muted-foreground/80">
                                  <User className="w-[11px] h-[11px]" />
                                  <span className="text-[11px] leading-none truncate">{firstSlot.faculty_name}</span>
                                </div>
                              )}
                              {firstSlot.classroom_name && (
                                <div className="flex items-center gap-1.5 text-muted-foreground/80">
                                  <MapPin className="w-[11px] h-[11px]" />
                                  <span className="text-[11px] leading-none truncate">{firstSlot.classroom_name}</span>
                                </div>
                              )}
                              {firstSlot.exam && (
                                <div className="flex items-center gap-1.5 text-purple-600/90 mt-0.5">
                                  <BookOpen className="w-[11px] h-[11px]" />
                                  <span className="text-[10px] font-medium leading-none">Exam linked</span>
                                </div>
                              )}
                            </div>

                            {/* Session type badge + delete — shown on hover */}
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Badge className={`text-[9px] px-1.5 py-0 h-[18px] capitalize font-semibold ${color?.bg} ${color?.text} border ${color?.border}`}>
                                {firstSlot.session_type_display || firstSlot.session_type}
                              </Badge>
                              {canDelete && onDeleteSlot && (
                                <button
                                  onClick={e => { e.stopPropagation(); onDeleteSlot(firstSlot); }}
                                  className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors text-xs font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full min-h-[90px] p-2 flex flex-col relative">
                            {/* Empty cell hint */}
                            {canEdit && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 border border-dashed border-muted-foreground/20 rounded-lg px-3 py-1.5 bg-white/50">
                                  <Plus className="w-3 h-3" /> Add session
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {/* Break Indicators */}
                {slot.code === "P1" && (
                  <tr>
                    <td className="border-b border-r border-border text-center bg-muted/20 py-2.5">
                      <div className="text-[10px] text-muted-foreground font-mono">10:00</div>
                      <div className="text-[10px] text-muted-foreground font-mono">10:15</div>
                    </td>
                    <td colSpan={DAYS.length} className="border-b border-border bg-muted/20 py-2.5">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground/80">
                        <Coffee className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-widest">Short Break (15m)</span>
                      </div>
                    </td>
                  </tr>
                )}
                {slot.code === "P2" && (
                  <tr>
                    <td className="border-b border-r border-border text-center bg-orange-50/50 py-2.5">
                      <div className="text-[10px] text-orange-600/70 font-mono">12:15</div>
                      <div className="text-[10px] text-orange-600/70 font-mono">12:45</div>
                    </td>
                    <td colSpan={DAYS.length} className="border-b border-border bg-orange-50/50 py-2.5">
                      <div className="flex items-center justify-center gap-2 text-orange-600/80">
                        <Utensils className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-widest">Lunch Break (30m)</span>
                      </div>
                    </td>
                  </tr>
                )}
                {slot.code === "P3" && (
                  <tr>
                    <td className="border-b border-r border-border text-center bg-muted/20 py-2.5">
                      <div className="text-[10px] text-muted-foreground font-mono">14:45</div>
                      <div className="text-[10px] text-muted-foreground font-mono">15:00</div>
                    </td>
                    <td colSpan={DAYS.length} className="border-b border-border bg-muted/20 py-2.5">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground/80">
                        <Coffee className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-widest">Short Break (15m)</span>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center flex-wrap gap-4 px-1 pt-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Legend:</span>
        {[
          { label: "Regular",    color: "#1E88E5" },
          { label: "Class Test", color: "#FB8C00" },
          { label: "Prelims",    color: "#E53935" },
          { label: "Practice",   color: "#43A047" },
          { label: "Special Session", color: "#8E24AA" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
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
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="text-xs text-amber-800">
          Showing <span className="font-bold">All</span> sessions — including Regular, Class Tests, and Prelims
        </span>
        <span className="text-[11px] text-amber-600">
          Non-regular sessions are automatically mapped to the grid based on their scheduled date and time.
        </span>
      </div>

      {/* Batch selector + view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Batch pills using Tabs */}
        <div className="flex flex-wrap gap-2">
          <Tabs value={selectedBatchId} onValueChange={onBatchChange}>
            <TabsList className="bg-muted flex flex-wrap h-auto rounded-xl p-1">
              {batches.map(b => (
                <TabsTrigger key={b.id} value={b.id} className="text-xs px-3.5 py-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  {b.name}
                </TabsTrigger>
              ))}
              {batches.length === 0 && (
                <span className="text-xs text-muted-foreground px-2 py-1.5">No batches loaded</span>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Grid / List toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white shrink-0 shadow-sm">
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
        </div>
      </div>
    </div>
  );
}
