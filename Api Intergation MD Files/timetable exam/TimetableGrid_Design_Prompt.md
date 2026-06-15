# TimetableTab Grid — Design Conversion Prompt

> Paste this into Cursor / Copilot Chat / Windsurf.
> This prompt ONLY changes the visual design of the timetable grid component.
> Do NOT touch any API calls, saga, slice, or business logic.

---

## CONTEXT

You are a senior React + TypeScript developer working inside **insight-ems**.

The existing project already has a working `TimetableTab` component (inside `ClassroomTimetablePage` or `TimetablePage`).
The current grid renders timetable slots. **Do not change any data-fetching, Redux, or API logic.**

**Only change the visual rendering of the grid view.**

Design tokens for this project:
- Primary orange: `#F7A900` → Tailwind `bg-primary` / `text-primary`
- Surface bg: `#F4F5F5`
- Card white: `#FFFFFF`
- Border: Tailwind `border-border`
- Muted text: Tailwind `text-muted-foreground`
- Font: already configured in project (DM Sans body, Sora headings)

---

## REFERENCE DESIGN (from screenshot)

The target design looks exactly like a real school/university timetable register:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Term info banner — warm yellow bg, shows Term name + Exam Period + Holidays]
├─────────────────────────────────────────────────────────────────────────────┤
│  [Batch S] [Test batch] [Batch B] [Batch C] [CSEET_JUNE_2026_001] [Batch D]
│                                                            [Grid] [List] ←toggle
├──────────┬──────────────┬──────────────┬────────────┬───────────┬───────────┤
│  Time    │   Monday     │  Tuesday     │ Wednesday  │ Thursday  │  Friday   │
├──────────┼──────────────┼──────────────┼────────────┼───────────┼───────────┤
│ P1       │              │              │            │           │           │
│ 08:00    │   + Add      │   + Add      │   + Add    │   + Add   │   + Add   │
├──────────┼──────────────┼──────────────┼────────────┼───────────┼───────────┤
│ P2       │              │              │            │           │           │
│ 10:15    │   + Add      │   + Add      │   + Add    │   + Add   │   + Add   │
└──────────┴──────────────┴──────────────┴────────────┴───────────┴───────────┘
```

---

## TASK

Replace the existing timetable grid render with the component below.
File: `src/pages/timetable/components/TimetableGridView.tsx` (CREATE NEW)

```tsx
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
          Use <span className="font-semibold">Timetable Slots</span> tab to manage class tests, prelims & custom sessions
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
```

---

## HOW TO WIRE IT INTO YOUR EXISTING PAGE

In your `TimetablePage.tsx` (or wherever the timetable tab content renders),
**replace the existing grid render** inside the `slots` TabsContent with this:

```tsx
// At top of TimetablePage.tsx — add import:
import TimetableGridView from "./components/TimetableGridView";

// In the JSX, add a new sub-tab or just swap the grid render:
// Option A — show GridView as the default visual inside SlotsTab
// Option B — add a dedicated "Weekly Grid" tab:

<TabsContent value="grid" className="mt-0">
  <TimetableGridView
    slots={slots}                    // from useSelector((s) => s.timetableNew.slots)
    batches={batches}                // already fetched in TimetablePage
    canEdit={canEdit}
    onAddClick={(day, slotCode) => {
      // pre-fill the slot form with session_type=regular, day_of_week, slot_code
      setEditingSlot(null);
      setFormPreFill({ session_type: "regular", day_of_week: DAY_TO_NUM[day], slot_code: slotCode });
      setFormOpen(true);
    }}
    onSlotClick={(slot) => {
      setEditingSlot(slot);
      setFormOpen(true);
    }}
    onDeleteSlot={(slot) => setDeleteTarget({ id: slot.id, name: slot.session_name || slot.id })}
  />
</TabsContent>
```

Where `DAY_TO_NUM` is:
```ts
const DAY_TO_NUM: Record<string, string> = {
  Monday: "0", Tuesday: "1", Wednesday: "2",
  Thursday: "3", Friday: "4", Saturday: "5", Sunday: "6",
};
```

---

## UPDATED TABS LIST for TimetablePage.tsx

Replace the existing `TABS` array with this to add the Weekly Grid tab:

```ts
const TABS = [
  { value: "grid",       label: "Weekly Grid"     },
  { value: "slots",      label: "All Slots"       },
  { value: "exam_types", label: "Exam Types"      },
  { value: "personal",   label: "Personal View"   },
] as const;
```

---

## DESIGN RULES — Do not deviate

- The grid uses a real `<table>` with `border-collapse` — this is intentional for the "register" aesthetic
- Column widths: time column fixed `w-[80px]`, day columns equal-width auto
- Row alternates: even rows `bg-white`, odd rows `bg-muted/10`
- Every cell has `border-b border-r border-border` — creates the grid lines
- The `+ Add` button is always present in canEdit mode but is visually muted (`opacity-60`) when the cell has content — becomes visible on hover
- Slot cards inside cells are colored by session type — not generic gray
- Batch selector uses pill buttons where selected batch shows `bg-primary text-white`
- Grid/List toggle uses a joined pill button group — selected side `bg-primary text-white`
- The amber banner at top is informational only — no interactive elements
- `min-width: 760px` on the table + `overflow-x-auto` on the wrapper handles narrow screens
- Do NOT add framer-motion page transitions to the outer table — only to individual SlotCards appearing

---

## NOTES FOR IDE AI

- Do NOT change any Redux slice, saga, or API call
- Do NOT install any new package — all imports are from existing dependencies
- The `TimetableGridView` only handles **regular** slots (slot_code P1–P4 + day_of_week)
- Non-regular sessions (class_test, prelim, practice, custom) are managed in the `SlotsTab` list view — this is by design
- `getSlotsForCell` filters by `day_label` OR `day_of_week_display` to handle both response formats from the API
- The component is fully self-contained — no new state in the parent needed beyond what already exists
