import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionType = "regular" | "class_test" | "prelim" | "practice" | "custom";

const SESSION_TYPES: { value: SessionType; label: string; color: string }[] = [
  { value: "regular",    label: "Regular",    color: "bg-blue-100 text-blue-700" },
  { value: "class_test", label: "Class Test", color: "bg-yellow-100 text-yellow-700" },
  { value: "prelim",     label: "Prelim",     color: "bg-purple-100 text-purple-700" },
  { value: "practice",   label: "Practice",   color: "bg-green-100 text-green-700" },
  { value: "custom",     label: "Custom",     color: "bg-gray-100 text-gray-700" },
];

const SLOT_CODES = [
  { value: "P1", label: "P1  08:00 – 10:00" },
  { value: "P2", label: "P2  10:15 – 12:15" },
  { value: "P3", label: "P3  12:45 – 14:45" },
  { value: "P4", label: "P4  15:00 – 17:00" },
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
  timetable_exam_type: z.string().optional(),

  // exam_data sub-fields — shown when session needs exam
  exam_title:               z.string().optional(),
  exam_type:                z.enum(["offline", "online"]).optional(),
  exam_total_marks:         z.string().optional(),
  exam_pass_marks:          z.string().optional(),
  exam_instructions:        z.string().optional(),
  exam_result_release_mode: z.enum(["instant", "manual"]).optional(),
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
    base.chapters       = csvToArray(values.chapters);
    base.examiners      = csvToArray(values.examiners);
    base.paper_checkers = csvToArray(values.paper_checkers);
    base.timetable_exam_type = values.timetable_exam_type || undefined;
    base.exam_data = {
      title:               values.exam_title,
      exam_type:           values.exam_type,
      total_marks:         Number(values.exam_total_marks),
      pass_marks:          Number(values.exam_pass_marks),
      instructions:        values.exam_instructions,
      result_release_mode: values.exam_result_release_mode,
    };
  }

  if (values.session_type === "practice") {
    base.examiners = csvToArray(values.examiners);
  }

  if (values.session_type === "custom" && values.exam_title) {
    base.exam_data = {
      title:               values.exam_title,
      exam_type:           values.exam_type,
      total_marks:         Number(values.exam_total_marks),
      pass_marks:          Number(values.exam_pass_marks),
      instructions:        values.exam_instructions,
      result_release_mode: values.exam_result_release_mode,
    };
  }

  return base;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SlotFormProps {
  defaultValues?: Partial<SlotFormValues>;
  batches:        { id: string; name: string }[];
  subjects:       { id: string; name: string }[];
  facultyList:    { id: string; name: string; employee_id?: string }[];
  classrooms:     { id: string; name: string }[];
  examTypes:      { id: string; name: string }[];
  chapters:       { id: string; name: string; order: number; subject?: string }[];
  loading:        boolean;
  onSubmit:       (payload: Record<string, any>, values: SlotFormValues) => void;
  onCancel:       () => void;
  isEdit?:        boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlotForm({
  defaultValues, batches, subjects, facultyList, classrooms,
  examTypes, chapters, loading, onSubmit, onCancel, isEdit,
}: SlotFormProps) {
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SlotFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      session_type: "regular",
      is_recurring: true,
      exam_type: "offline",
      exam_result_release_mode: "manual",
      ...defaultValues,
    },
  });

  const sessionType = watch("session_type");
  const selectedSubject = watch("subject");

  const isRegular    = sessionType === "regular";
  const isClassTest  = sessionType === "class_test";
  const isPrelim     = sessionType === "prelim";
  const isPractice   = sessionType === "practice";
  const isCustom     = sessionType === "custom";
  const needsExam    = isClassTest || isPrelim;
  const needsChapters    = isClassTest || isPrelim;
  const needsExaminers   = isClassTest || isPrelim || isPractice;
  const needsPaperCheck  = isClassTest || isPrelim;
  const customExamOpt    = isCustom;

  // Filter chapters by selected subject
  const filteredChapters = selectedSubject
    ? chapters.filter(c => !c.subject || c.subject === selectedSubject)
    : chapters;

  const onFormSubmit = (values: SlotFormValues) => {
    onSubmit(buildSlotPayload(values), values);
  };

  // ─── Session Type Selector ─────────────────────────────────────────────────
  const SessionTypeRow = () => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session Type <span className="text-red-500">*</span></Label>
      <div className="flex flex-wrap gap-2">
        {SESSION_TYPES.map(st => (
          <button
            key={st.value}
            type="button"
            onClick={() => setValue("session_type", st.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all cursor-pointer
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
        {isCustom    && "Custom session. Optionally attach an exam by filling the Exam Details section."}
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

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

      {/* Session Type Picker */}
      <SessionTypeRow />

      {/* ── Common Fields ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="space-y-4 p-4 bg-blue-50/40 rounded-xl border border-blue-100">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Regular Session Settings</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="space-y-3 p-4 bg-yellow-50/40 rounded-xl border border-yellow-100">
          <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
            Chapters <span className="font-normal normal-case text-yellow-600">(comma-separated UUIDs or select below)</span>
          </div>
          <Field label="Chapter UUIDs" required error={errors.chapters?.message}>
            <Input {...register("chapters")} placeholder="uuid1, uuid2, ..." className="h-9 text-sm font-mono" />
          </Field>
          {filteredChapters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {filteredChapters.map(ch => (
                <Badge
                  key={ch.id}
                  className="text-xs cursor-pointer bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  onClick={() => {
                    const current = (watch("chapters") || "").split(",").map(s => s.trim()).filter(Boolean);
                    if (!current.includes(ch.id)) setValue("chapters", [...current, ch.id].join(", "));
                  }}
                >
                  {ch.name} (order {ch.order})
                </Badge>
              ))}
            </div>
          )}
          {isClassTest && (
            <p className="text-xs text-yellow-600">⚠ Class test only allows chapters with order ≤ 2</p>
          )}
        </div>
      )}

      {/* ── Examiners ──────────────────────────────────────────────────────── */}
      {needsExaminers && (
        <Field label="Examiners (comma-separated UUIDs)" required error={errors.examiners?.message}>
          <Input {...register("examiners")} placeholder="user-uuid-1, user-uuid-2" className="h-9 text-sm font-mono" />
        </Field>
      )}

      {/* ── Paper Checkers ─────────────────────────────────────────────────── */}
      {needsPaperCheck && (
        <Field label="Paper Checkers (comma-separated UUIDs)" required error={errors.paper_checkers?.message}>
          <Input {...register("paper_checkers")} placeholder="user-uuid-1, user-uuid-2" className="h-9 text-sm font-mono" />
        </Field>
      )}

      {/* ── Exam Type ──────────────────────────────────────────────────────── */}
      {needsExam && (
        <Field label="Timetable Exam Type" required error={errors.timetable_exam_type?.message}>
          <Controller name="timetable_exam_type" control={control} render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select exam type" /></SelectTrigger>
              <SelectContent>
                {examTypes.map(et => <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </Field>
      )}

      {/* ── Exam Data (class_test, prelim = required; custom = optional) ────── */}
      {(needsExam || customExamOpt) && (
        <div className="space-y-4 p-4 bg-purple-50/40 rounded-xl border border-purple-100">
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
            Exam Details {customExamOpt && <span className="font-normal normal-case text-purple-500">(optional for custom)</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Exam Title" required={needsExam} error={errors.exam_title?.message}>
              <Input {...register("exam_title")} placeholder="e.g. Company Law — Ch 1 & 2 Test" className="h-9 text-sm" />
            </Field>

            <Field label="Exam Type" required={needsExam}>
              <Controller name="exam_type" control={control} render={({ field }) => (
                <Select value={field.value || "offline"} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>

            <Field label="Total Marks" required={needsExam} error={errors.exam_total_marks?.message}>
              <Input type="number" {...register("exam_total_marks")} placeholder="100" className="h-9 text-sm" />
            </Field>

            <Field label="Pass Marks" required={needsExam} error={errors.exam_pass_marks?.message}>
              <Input type="number" {...register("exam_pass_marks")} placeholder="35" className="h-9 text-sm" />
            </Field>

            <Field label="Result Release Mode" required={needsExam}>
              <Controller name="exam_result_release_mode" control={control} render={({ field }) => (
                <Select value={field.value || "manual"} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="instant">Instant</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
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
