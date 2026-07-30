import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Lock, Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionType = "regular" | "class_test" | "prelim" | "practice" | "custom";

const SESSION_TYPES: { value: SessionType; label: string; color: string }[] = [
  { value: "regular",    label: "Regular",    color: "bg-[#E3F2FD] text-[#1E88E5]" },
  { value: "class_test", label: "Class Test", color: "bg-[#FFF3E0] text-[#FB8C00]" },
  { value: "prelim",     label: "Prelim",     color: "bg-[#FFEBEE] text-[#E53935]" },
  { value: "practice",   label: "Practice",   color: "bg-[#E8F5E9] text-[#43A047]" },
  { value: "custom",     label: "Special Session", color: "bg-[#F3E5F5] text-[#8E24AA]" },
];

const SLOT_CODES = [
  { value: "P1", label: "P1  08:00 – 10:00", start: "08:00", end: "10:00" },
  { value: "P2", label: "P2  10:15 – 12:15", start: "10:15", end: "12:15" },
  { value: "P3", label: "P3  12:45 – 14:45", start: "12:45", end: "14:45" },
  { value: "P4", label: "P4  15:00 – 17:00", start: "15:00", end: "17:00" },
];

const DAY_OPTIONS = [
  { value: "0", label: "Monday" },
  { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" },
  { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" },
  { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
];

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  session_type:       z.enum(["regular", "class_test", "prelim", "practice", "custom"]),
  batch:              z.string().min(1, "Batch is required"),
  subject:            z.string().optional(),
  faculty:            z.string().optional(),
  classroom:          z.string().optional(),
  session_name:       z.string().optional(),

  // regular only
  slot_code:          z.string().optional(),
  day_of_week:        z.string().optional(),
  is_recurring:       z.boolean().optional(),
  effective_from:     z.string().optional(),
  effective_to:       z.string().optional(),

  // non-regular
  session_date:       z.string().optional(),
  start_time:         z.string().optional(),
  end_time:           z.string().optional(),

  // UUIDs as comma-separated strings (UI) — split before submitting
  chapters:           z.string().optional(), // comma-sep UUIDs
  examiners:          z.string().optional(), // comma-sep UUIDs
  paper_checkers:     z.string().optional(), // comma-sep UUIDs


  // exam_data sub-fields — shown when session needs exam
  exam_title:               z.string().optional(),
  exam_type:                z.enum(["mcq", "subjective"]).optional(),
  exam_mode:                z.enum(["online", "offline"]).optional(),
  exam_total_marks:         z.string().optional(),
  exam_pass_marks:          z.string().optional(),
  exam_instructions:        z.string().optional(),
  exam_result_release_mode: z.enum(["instant", "manual"]).optional(),
  selected_papers:          z.string().optional(), // comma-sep UUIDs
});

export type SlotFormValues = z.infer<typeof schema>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function csvToArray(val?: string): string[] {
  return (val || "").split(",").map(s => s.trim()).filter(Boolean);
}

export function buildSlotPayload(values: SlotFormValues): Record<string, any> {
  const base: Record<string, any> = {
    batch:        values.batch,
    session_type: values.session_type,
    session_name: values.session_name || undefined,
    subject:      values.subject || undefined,
    faculty:      values.faculty || undefined,
    classroom:    values.classroom || undefined,
    chapters:     csvToArray(values.chapters),
  };

  if (values.session_type === "regular") {
    base.slot_code    = values.slot_code;
    base.day_of_week  = Number(values.day_of_week);
    base.is_recurring = values.is_recurring ?? true;
    if (values.effective_from) base.effective_from = values.effective_from;
    if (values.effective_to)   base.effective_to   = values.effective_to;
  } else {
    base.session_date = values.session_date;
    base.start_time   = values.start_time ? values.start_time + ":00" : undefined;
    if (values.session_type === "prelim" || values.session_type === "custom") {
      base.end_time = values.end_time ? values.end_time + ":00" : undefined;
    }
  }

  if (["class_test", "prelim"].includes(values.session_type)) {
    base.examiners      = csvToArray(values.examiners);
    base.paper_checkers = csvToArray(values.paper_checkers);
    base.exam_data = {
      title:               values.exam_title,
      exam_type:           values.exam_type,
      exam_mode:           values.exam_mode,
      total_marks:         Number(values.exam_total_marks),
      pass_marks:          Number(values.exam_pass_marks),
      instructions:        values.exam_instructions,
      result_release_mode: (values.exam_mode === "online" && values.exam_type === "mcq") ? "instant" : "manual",
      selected_papers:     csvToArray(values.selected_papers),
    };
  }

  if (values.session_type === "practice") {
    base.examiners = csvToArray(values.examiners);
  }

  if (values.session_type === "custom" && values.exam_title) {
    base.examiners      = csvToArray(values.examiners);
    base.paper_checkers = csvToArray(values.paper_checkers);
    base.exam_data = {
      title:               values.exam_title,
      exam_type:           values.exam_type,
      exam_mode:           values.exam_mode,
      total_marks:         Number(values.exam_total_marks),
      pass_marks:          Number(values.exam_pass_marks),
      instructions:        values.exam_instructions,
      result_release_mode: (values.exam_mode === "online" && values.exam_type === "mcq") ? "instant" : "manual",
      selected_papers:     csvToArray(values.selected_papers),
    };
  }

  return base;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SlotFormProps {
  defaultValues?: Partial<SlotFormValues>;
  /** Fields that are pre-filled from grid context and should NOT be editable */
  lockedFields?:  (keyof SlotFormValues)[];
  batches:        { id: string; name: string }[];
  subjects:       { id: string; name: string }[];
  facultyList:    { id: string; name: string; employee_id?: string }[];
  classrooms:     { id: string; name: string }[];
  chapters:       { id: string; name: string; order: number; subject?: string }[];
  papers?:        { id: string; name: string; subject?: string; file?: string }[];
  examinersList?: { id: string; name: string; employee_id?: string }[];
  paperCheckersList?: { id: string; name: string; employee_id?: string }[];
  loading:        boolean;
  onSubmit:       (payload: Record<string, any>, values: SlotFormValues) => void;
  onCancel:       () => void;
  isEdit?:        boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlotForm({
  defaultValues, lockedFields = [], batches, subjects, facultyList, classrooms,
  chapters, papers = [], examinersList = [], paperCheckersList = [], loading, onSubmit, onCancel, isEdit,
}: SlotFormProps) {
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SlotFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      session_type: "regular",
      is_recurring: true,
      exam_type: "mcq",
      exam_mode: "offline",
      exam_result_release_mode: "manual",
      ...defaultValues,
    },
  });

  const isLocked = (field: keyof SlotFormValues) => lockedFields.includes(field);

  const sessionType = watch("session_type");
  const selectedSubject = watch("subject");

  const isRegular    = sessionType === "regular";
  const isClassTest  = sessionType === "class_test";
  const isPrelim     = sessionType === "prelim";
  const isPractice   = sessionType === "practice";
  const isCustom     = sessionType === "custom";
  const needsExam        = isClassTest || isPrelim;
  const needsChapters    = true; // chapters available for all session types
  const needsExaminers   = isClassTest || isPrelim || isPractice || isCustom;
  const needsPaperCheck  = isClassTest || isPrelim || isCustom;
  const customExamOpt    = isCustom;

  // Filter chapters by selected subject
  const filteredChapters = selectedSubject
    ? chapters.filter(c => !c.subject || c.subject === selectedSubject)
    : [];

  // Filter papers by selected subject
  const filteredPapers = selectedSubject
    ? papers.filter(p => p.subject === selectedSubject)
    : [];

  // Auto-fill start/end time when slot_code changes
  const slotCode = watch("slot_code");
  useEffect(() => {
    if (slotCode) {
      const slot = SLOT_CODES.find(s => s.value === slotCode);
      if (slot) {
        setValue("start_time", slot.start);
        setValue("end_time", slot.end);
      }
    }
  }, [slotCode, setValue]);

  const onFormSubmit = (values: SlotFormValues) => {
    onSubmit(buildSlotPayload(values), values);
  };

  // ── Resolve display labels for locked fields ───────────────────────────────
  const getBatchName = (id?: string) => batches.find(b => b.id === id)?.name ?? id ?? "—";
  const getDayLabel = (val?: string) => DAY_OPTIONS.find(d => d.value === val)?.label ?? val ?? "—";
  const getSlotLabel = (val?: string) => SLOT_CODES.find(s => s.value === val)?.label ?? val ?? "—";

  // ─── Locked Field Display ──────────────────────────────────────────────────
  const LockedDisplay = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {label}
        <Lock className="w-3 h-3 text-muted-foreground/50" />
      </Label>
      <div className="h-9 px-3 flex items-center bg-muted/50 rounded-md text-sm text-foreground font-medium border border-border">
        {value}
      </div>
    </div>
  );

  // ─── Session Type Selector ─────────────────────────────────────────────────
  const SessionTypeRow = () => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session Type <span className="text-red-500">*</span></Label>
      <div className="flex flex-wrap gap-2">
        {SESSION_TYPES.map(st => (
          <button
            key={st.value}
            type="button"
            disabled={isLocked("session_type")}
            onClick={() => !isLocked("session_type") && setValue("session_type", st.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all
              ${isLocked("session_type") ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
              ${sessionType === st.value
                ? `${st.color} border-current`
                : "bg-white border-border text-muted-foreground hover:border-muted-foreground"}`}
          >
            {st.label}
          </button>
        ))}
      </div>
      {/* Info hint per type */}
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        {isRegular   && "Regular lecture. Pick a slot code (P1–P4) — start/end time is auto-filled."}
        {isClassTest && "Class test. Exam record is auto-created. Chapters must have order ≤ 2."}
        {isPrelim    && "Prelim exam. Set custom start and end time. Exam record auto-created."}
        {isPractice  && "Practice session. No paper checkers or exam data allowed."}
        {isCustom    && "Special Session. Optionally attach an exam by filling the Exam Details section."}
      </div>
    </div>
  );

  // ─── Reusable Field ────────────────────────────────────────────────────────
  const Field = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );

  const ExaminersField = ({ required = true }: { required?: boolean }) => (
    <Field label="Supervisor" required={required} error={errors.examiners?.message}>
      <Controller name="examiners" control={control} render={({ field }) => (
        <Select value={field.value || ""} onValueChange={field.onChange}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Select supervisor..." />
          </SelectTrigger>
          <SelectContent className="max-h-[250px]">
            {examinersList.map((fac) => (
              <SelectItem key={fac.id} value={fac.id}>
                {fac.name} {fac.employee_id ? `(${fac.employee_id})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )} />
    </Field>
  );

  const PaperCheckersField = ({ required = true }: { required?: boolean }) => (
    <Field label="Paper Checker" required={required} error={errors.paper_checkers?.message}>
      <Controller name="paper_checkers" control={control} render={({ field }) => (
        <Select value={field.value || ""} onValueChange={field.onChange}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Select paper checker..." />
          </SelectTrigger>
          <SelectContent className="max-h-[250px]">
            {paperCheckersList.map((fac) => (
              <SelectItem key={fac.id} value={fac.id}>
                {fac.name} {fac.employee_id ? `(${fac.employee_id})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )} />
    </Field>
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

      {/* Session Type Picker */}
      <SessionTypeRow />

      {/* ── Pre-filled context banner (when coming from grid) ───────────────── */}
      {lockedFields.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-2.5 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
          <span className="text-xs text-blue-700">
            Some fields are pre-filled from the timetable grid and cannot be changed.
          </span>
        </div>
      )}

      {/* ── Common Fields ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLocked("batch") ? (
          <LockedDisplay label="Batch" value={getBatchName(defaultValues?.batch)} />
        ) : (
          <Field label="Batch" required error={errors.batch?.message}>
            <Controller name="batch" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </Field>
        )}

        <Field label="Subject">
          <Controller name="subject" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>

        <Field label="Faculty" required={isRegular || isClassTest || isPrelim || isPractice}>
          <Controller name="faculty" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {facultyList.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name} {f.employee_id ? `(${f.employee_id})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </Field>

        <Field label="Classroom">
          <Controller name="classroom" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select classroom" /></SelectTrigger>
              <SelectContent>
                {classrooms.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>

        <Field label="Session Name" error={errors.session_name?.message}>
          <Input {...register("session_name")} placeholder="e.g. Monday Morning Lecture" className="h-9 text-sm" />
        </Field>
      </div>

      {/* ── Regular Fields ─────────────────────────────────────────────────── */}
      {isRegular && (
        <div className="space-y-4 p-4 bg-[#E3F2FD]/40 rounded-xl border border-[#90CAF9]/60">
          <div className="text-xs font-semibold text-[#1E88E5] uppercase tracking-wide">Regular Session Settings</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLocked("slot_code") ? (
              <LockedDisplay label="Slot Code" value={getSlotLabel(defaultValues?.slot_code)} />
            ) : (
              <Field label="Slot Code" required error={errors.slot_code?.message}>
                <Controller name="slot_code" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pick slot" /></SelectTrigger>
                    <SelectContent>
                      {SLOT_CODES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </Field>
            )}

            {isLocked("day_of_week") ? (
              <LockedDisplay label="Day of Week" value={getDayLabel(defaultValues?.day_of_week)} />
            ) : (
              <Field label="Day of Week" required error={errors.day_of_week?.message}>
                <Controller name="day_of_week" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </Field>
            )}

            <Field label="Effective From">
              <Input type="date" {...register("effective_from")} className="h-9 text-sm" />
            </Field>
            <Field label="Effective To">
              <Input type="date" {...register("effective_to")} className="h-9 text-sm" />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Controller name="is_recurring" control={control} render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="is_recurring" />
            )} />
            <label htmlFor="is_recurring" className="text-sm text-foreground cursor-pointer">Is Recurring (repeats every week)</label>
          </div>
        </div>
      )}

      {/* ── Non-Regular Date/Time Fields ───────────────────────────────────── */}
      {!isRegular && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date & Time</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Session Date" required error={errors.session_date?.message}>
              <Input type="date" {...register("session_date")} className="h-9 text-sm" />
            </Field>
            <Field label="Start Time" required error={errors.start_time?.message}>
              <Input type="time" {...register("start_time")} className="h-9 text-sm" />
            </Field>
            {(isPrelim || isCustom) && (
              <Field label="End Time" required={isPrelim} error={errors.end_time?.message}>
                <Input type="time" {...register("end_time")} className="h-9 text-sm" />
              </Field>
            )}
            {(isClassTest || isPractice) && (
              <div className="flex flex-col gap-1 justify-end">
                <span className="text-xs text-muted-foreground">End time</span>
                <div className="h-9 px-3 flex items-center bg-muted/50 rounded-md text-sm text-muted-foreground border border-border">
                  {isClassTest ? "Auto (+90 min)" : "Auto-computed"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chapters (class_test + prelim) ─────────────────────────────────── */}
      {needsChapters && (
        <div className="space-y-3 p-4 bg-[#FFF3E0]/40 rounded-xl border border-[#FFCC80]/60">
          <div className="text-xs font-semibold text-[#FB8C00] uppercase tracking-wide">
            Chapters
          </div>
          <Field label="Select Chapters" required error={errors.chapters?.message}>
            <Controller name="chapters" control={control} render={({ field }) => {
              const selectedIds = csvToArray(field.value);
              const selectedNames = selectedIds.map(id => filteredChapters.find(c => c.id === id)?.name || id);

              return (
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal text-sm min-h-[36px] h-auto p-2"
                      disabled={!selectedSubject}
                    >
                      {!selectedSubject ? (
                        <span className="text-muted-foreground">Please select a subject first</span>
                      ) : selectedNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 text-left">
                          {selectedNames.map((name, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-medium bg-[#FFF3E0] text-[#FB8C00] hover:bg-[#FFE0B2]">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select chapters...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search chapters..." />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>No chapters found.</CommandEmpty>
                        <CommandGroup>
                          {filteredChapters.map((chapter) => (
                            <CommandItem
                              key={chapter.id}
                              value={chapter.name}
                              onSelect={() => {
                                const isSelected = selectedIds.includes(chapter.id);
                                const newIds = isSelected
                                  ? selectedIds.filter(id => id !== chapter.id)
                                  : [...selectedIds, chapter.id];
                                field.onChange(newIds.join(", "));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedIds.includes(chapter.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {chapter.name} (order {chapter.order})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              );
            }} />
          </Field>
          {isClassTest && (
            <p className="text-xs text-[#FB8C00]/80">⚠ Class test only allows chapters with order ≤ 2</p>
          )}
        </div>
      )}

      {/* ── Examiners (For Practice Session) ───────────────────────────────── */}
      {needsExaminers && !needsExam && !customExamOpt && <ExaminersField />}



      {/* ── Exam Data (class_test, prelim = required; custom = optional) ────── */}
      {(needsExam || customExamOpt) && (
        <div className="space-y-4 p-4 bg-[#F3E5F5]/40 rounded-xl border border-[#CE93D8]/60">
          <div className="text-xs font-semibold text-[#8E24AA] uppercase tracking-wide">
            Exam Details {customExamOpt && <span className="font-normal normal-case text-[#8E24AA]/60">(optional for custom)</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {needsExaminers && <ExaminersField required={needsExam || !!watch("exam_title")} />}
            {needsPaperCheck && <PaperCheckersField required={needsExam || !!watch("exam_title")} />}
            <Field label="Exam Title" required={needsExam} error={errors.exam_title?.message}>
              <Input {...register("exam_title")} placeholder="e.g. Company Law — Ch 1 & 2 Test" className="h-9 text-sm" />
            </Field>

            <Field label="Exam Type" required={needsExam}>
              <Controller name="exam_type" control={control} render={({ field }) => (
                <Select value={field.value || "mcq"} onValueChange={(val) => {
                  field.onChange(val);
                  if (val === "subjective") {
                    setValue("exam_mode", "offline", { shouldValidate: true });
                  }
                }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">MCQ</SelectItem>
                    <SelectItem value="subjective">Subjective</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>

            <Field label="Exam Mode" required={needsExam}>
              <Controller name="exam_mode" control={control} render={({ field }) => (
                <Select value={field.value || "offline"} onValueChange={field.onChange} disabled={watch("exam_type") === "subjective"}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>

            <Field label="Total Marks (Initial)" required={needsExam} error={errors.exam_total_marks?.message}>
              <div className="relative">
                <Input type="number" {...register("exam_total_marks")} placeholder="100" className="h-9 text-sm" />
                <span className="absolute -bottom-4 left-0 text-[10px] text-muted-foreground whitespace-nowrap">Auto-syncs when questions are added</span>
              </div>
            </Field>

            <Field label="Passing Marks" required={needsExam} error={errors.exam_pass_marks?.message}>
              <Input type="number" {...register("exam_pass_marks")} placeholder="35" className="h-9 text-sm" />
            </Field>

            <Field label="Result Release Mode" required={needsExam}>
              <Controller name="exam_result_release_mode" control={control} render={({ field }) => {
                const isOnlineMcq = watch("exam_mode") === "online" && watch("exam_type") === "mcq";
                return (
                  <Select value={isOnlineMcq ? "instant" : "manual"} onValueChange={field.onChange} disabled>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="instant">Instant</SelectItem>
                    </SelectContent>
                  </Select>
                );
              }} />
            </Field>

              {/* X */}
          </div>

          <Field label="Instructions">
            <Textarea {...register("exam_instructions")} placeholder="Attempt all questions..." rows={3} className="text-sm resize-none" />
          </Field>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">
          {loading ? "Saving…" : isEdit ? "Update Slot" : "Create Slot"}
        </Button>
      </div>
    </form>
  );
}
