# TimetablePage.tsx — Full API Integration Prompt

> Copy this entire prompt and paste it into your IDE AI assistant (Cursor / GitHub Copilot Chat / Windsurf).
> It is fully self-contained — no extra context needed.

---

## CONTEXT — Project Stack & Conventions

You are a senior React + TypeScript developer working inside **insight-ems** (Vite + React 18).

### Tech Stack (already installed — import only, NO new npm installs)
- **State:** Redux Toolkit + Redux Saga (`genericSaga` pattern)
- **Routing:** react-router-dom v6
- **UI:** Radix UI primitives via shadcn/ui (`@/components/ui/`)
- **Charts:** recharts
- **Animations:** framer-motion
- **Forms:** react-hook-form + zod
- **Icons:** lucide-react
- **Date:** date-fns
- **HTTP:** axios — always via `genericSaga`, never direct axios calls
- **Notifications:** `useToast` hook (`@/hooks/useToast`)
- **Skeletons:** `TableSkeleton` from `@/components/common/Skeletons`

### API Call Pattern — NEVER deviate from this
```ts
dispatch({
  type: ACTION_CONSTANT,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endPoint: "/api/v1/...",
  body: { ... },          // optional, for POST/PATCH
  auth: true,             // always true — token injected by genericSaga
  setLoading: (v: boolean) => dispatch(setSomeLoading(v)),
  getResponse: (res: any) => { /* handle res.data */ },
  getError: (err: any) => { toast.error(err?.response?.data?.message || err?.message || "Error"); },
});
```

### Design Tokens
- Primary orange: `#F7A900` → Tailwind `bg-primary` / `text-primary`
- Surface: `#F4F5F5` → page background
- Sidebar dark: `#2e3032`
- Border: `border-border`
- Status badges: present/success → `bg-green-100 text-green-700` | error/absent → `bg-red-100 text-red-700` | warning/late → `bg-yellow-100 text-yellow-700` | info → `bg-blue-100 text-blue-700`

### Existing Page Reference Pattern (mirror exactly)
The `ClassroomTimetablePage.tsx` in this project shows the pattern:
- `useDispatch<AppDispatch>()` + `useSelector((s: RootState) => s.xxx)`
- `useUI().setPageTitle(...)` in `useEffect`
- `PageHeader` with `title`, `subtitle`, `actions`
- `Tabs / TabsList / TabsTrigger / TabsContent` from `@/components/ui/tabs`
- `ConfirmDialog` from `@/components/common/ConfirmDialog` for delete confirmations
- Separate tab components for clean separation of concerns

---

## BUSINESS LOGIC — Read carefully before writing any code

### Session Types & Their Rules
| session_type | slot_code required | day_of_week required | session_date required | start_time | end_time | exam_data | chapters | examiners | paper_checkers |
|---|---|---|---|---|---|---|---|---|---|
| `regular` | ✅ P1–P4 | ✅ 0–6 | ❌ forbidden | auto from slot_code | auto from slot_code | ❌ forbidden | ❌ forbidden | ❌ forbidden | ❌ forbidden |
| `class_test` | ❌ forbidden | ❌ | ✅ | ✅ manual | auto (90 min) | ✅ required | ✅ required (order ≤ 2) | ✅ required | ✅ required |
| `prelim` | ❌ forbidden | ❌ | ✅ | ✅ manual | ✅ manual required | ✅ required | ✅ required | ✅ required | ✅ required |
| `practice` | ❌ forbidden | ❌ | ✅ | ✅ manual | auto | ❌ forbidden | ❌ | ✅ required | ❌ forbidden |
| `custom` | ❌ forbidden | ❌ | ✅ | ✅ manual | ✅ manual required | ⚙️ optional | ❌ | ❌ | ❌ |

### Slot Codes (regular only — auto-fills start/end time)
| slot_code | start_time | end_time |
|---|---|---|
| P1 | 08:00:00 | 10:00:00 |
| P2 | 10:15:00 | 12:15:00 |
| P3 | 12:45:00 | 14:45:00 |
| P4 | 15:00:00 | 17:00:00 |

### Day of Week
`0` = Monday, `1` = Tuesday, `2` = Wednesday, `3` = Thursday, `4` = Friday, `5` = Saturday, `6` = Sunday

### Exam Data Fields (inside exam_data object)
`title` (string), `exam_type` ("offline" | "online"), `total_marks` (number), `pass_marks` (number), `instructions` (string), `result_release_mode` ("instant" | "manual")

### Error Handling Special Case
When a 400 clash error comes back, it returns:
```json
{ "success": false, "message": "Faculty has a scheduling conflict.", "clashing_slots": ["slot-uuid-..."] }
```
Show this as a toast with the clash info, not a generic error.

---

## TASK — Generate ALL files listed below

---

## FILE 1 — ADD to `src/redux/actions/index.ts`

Add this export (do NOT replace existing exports):

```ts
export const timetableActions = {
  GET_SLOTS:          "GET_TIMETABLE_SLOTS",
  GET_SLOT_DETAIL:    "GET_TIMETABLE_SLOT_DETAIL",
  CREATE_SLOT:        "CREATE_TIMETABLE_SLOT",
  UPDATE_SLOT:        "UPDATE_TIMETABLE_SLOT",
  DELETE_SLOT:        "DELETE_TIMETABLE_SLOT",
  GET_EXAM_TYPES:     "GET_TIMETABLE_EXAM_TYPES",
  CREATE_EXAM_TYPE:   "CREATE_TIMETABLE_EXAM_TYPE",
  UPDATE_EXAM_TYPE:   "UPDATE_TIMETABLE_EXAM_TYPE",
  DELETE_EXAM_TYPE:   "DELETE_TIMETABLE_EXAM_TYPE",
  GET_FACULTY_VIEW:   "GET_TIMETABLE_FACULTY_VIEW",
  GET_STUDENT_VIEW:   "GET_TIMETABLE_STUDENT_VIEW",
} as const;
```

---

## FILE 2 — ADD to `src/service/api.ts`

Add inside the existing `API` export object (do NOT replace anything):

```ts
TIMETABLE: {
  SLOTS:              "/api/v1/timetable/",
  SLOT_DETAIL:        (id: string) => `/api/v1/timetable/${id}/`,
  EXAM_TYPES:         "/api/v1/timetable/exam-types/",
  EXAM_TYPE_DETAIL:   (id: string) => `/api/v1/timetable/exam-types/${id}/`,
  FACULTY_VIEW:       (facultyId: string) => `/api/v1/timetable/faculty/${facultyId}/`,
  STUDENT_VIEW:       (studentId: string) => `/api/v1/timetable/student/${studentId}/`,
},
```

---

## FILE 3 — CREATE `src/redux/slices/timetableNewSlice.ts`

> Note: The project already has a `timetableSlice.ts` for the old grid view.
> This is a SEPARATE slice named `timetableNew` to avoid conflicts.

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimetableSlot {
  id: string;
  batch: string;
  batch_name: string;
  course: string | null;
  course_name: string | null;
  course_code: string | null;
  subject: string | null;
  subject_name: string | null;
  faculty: string | null;
  faculty_name: string | null;
  faculty_employee_id: string | null;
  classroom: string | null;
  classroom_name: string | null;
  day_of_week: number | null;
  day_label: string | null;
  day_of_week_display: string | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  effective_from: string | null;
  effective_to: string | null;
  session_type: "regular" | "class_test" | "prelim" | "practice" | "custom";
  session_type_display: string;
  session_name: string | null;
  slot_code: string | null;
  session_date: string | null;
  chapters: string[];
  chapters_names: string[];
  examiners: string[];
  examiners_names: string[];
  paper_checkers: string[];
  paper_checkers_names: string[];
  timetable_exam_type: string | null;
  exam_type_name: string | null;
  exam: string | null;
}

export interface ExamType {
  id: string;
  organization: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export type PersonalTimetableDay = {
  [day: string]: PersonalSlot[];
};

export interface PersonalSlot {
  id: string;
  batch?: string;
  batch_name?: string;
  batch_code?: string;
  subject: string | null;
  subject_name: string | null;
  faculty?: string | null;
  faculty_name?: string | null;
  faculty_employee_id?: string | null;
  classroom: string | null;
  classroom_name: string | null;
  day_of_week: number;
  day_label: string;
  day_of_week_display: string;
  start_time: string;
  end_time: string;
  session_type: string;
  session_date: string | null;
  slot_code: string | null;
}

interface TimetableNewState {
  slots: TimetableSlot[];
  slotsCount: number;
  slotsLoading: boolean;

  selectedSlot: TimetableSlot | null;
  selectedSlotLoading: boolean;

  examTypes: ExamType[];
  examTypesLoading: boolean;

  facultyTimetable: PersonalTimetableDay;
  facultyTimetableLoading: boolean;

  studentTimetable: PersonalTimetableDay;
  studentTimetableLoading: boolean;

  error: string | null;
}

const initialState: TimetableNewState = {
  slots: [],               slotsCount: 0,         slotsLoading: false,
  selectedSlot: null,      selectedSlotLoading: false,
  examTypes: [],           examTypesLoading: false,
  facultyTimetable: {},    facultyTimetableLoading: false,
  studentTimetable: {},    studentTimetableLoading: false,
  error: null,
};

const timetableNewSlice = createSlice({
  name: "timetableNew",
  initialState,
  reducers: {
    setSlots(s, a: PayloadAction<{ data: TimetableSlot[]; count: number }>) {
      s.slots = a.payload.data; s.slotsCount = a.payload.count; s.error = null;
    },
    setSlotsLoading(s, a: PayloadAction<boolean>)         { s.slotsLoading = a.payload; },

    setSelectedSlot(s, a: PayloadAction<TimetableSlot | null>) { s.selectedSlot = a.payload; },
    setSelectedSlotLoading(s, a: PayloadAction<boolean>)  { s.selectedSlotLoading = a.payload; },

    addSlot(s, a: PayloadAction<TimetableSlot>)           { s.slots.unshift(a.payload); s.slotsCount += 1; },
    updateSlotInList(s, a: PayloadAction<TimetableSlot>)  {
      const idx = s.slots.findIndex(x => x.id === a.payload.id);
      if (idx !== -1) s.slots[idx] = a.payload;
    },
    removeSlot(s, a: PayloadAction<string>)               {
      s.slots = s.slots.filter(x => x.id !== a.payload); s.slotsCount -= 1;
    },

    setExamTypes(s, a: PayloadAction<ExamType[]>)         { s.examTypes = a.payload; s.error = null; },
    setExamTypesLoading(s, a: PayloadAction<boolean>)     { s.examTypesLoading = a.payload; },
    addExamType(s, a: PayloadAction<ExamType>)            { s.examTypes.push(a.payload); },
    updateExamTypeInList(s, a: PayloadAction<ExamType>)   {
      const idx = s.examTypes.findIndex(x => x.id === a.payload.id);
      if (idx !== -1) s.examTypes[idx] = a.payload;
    },
    removeExamType(s, a: PayloadAction<string>)           { s.examTypes = s.examTypes.filter(x => x.id !== a.payload); },

    setFacultyTimetable(s, a: PayloadAction<PersonalTimetableDay>) { s.facultyTimetable = a.payload; },
    setFacultyTimetableLoading(s, a: PayloadAction<boolean>)       { s.facultyTimetableLoading = a.payload; },

    setStudentTimetable(s, a: PayloadAction<PersonalTimetableDay>) { s.studentTimetable = a.payload; },
    setStudentTimetableLoading(s, a: PayloadAction<boolean>)       { s.studentTimetableLoading = a.payload; },

    setTimetableError(s, a: PayloadAction<string>)        { s.error = a.payload; },
    clearTimetableError(s)                                { s.error = null; },
  },
});

export const {
  setSlots, setSlotsLoading,
  setSelectedSlot, setSelectedSlotLoading,
  addSlot, updateSlotInList, removeSlot,
  setExamTypes, setExamTypesLoading, addExamType, updateExamTypeInList, removeExamType,
  setFacultyTimetable, setFacultyTimetableLoading,
  setStudentTimetable, setStudentTimetableLoading,
  setTimetableError, clearTimetableError,
} = timetableNewSlice.actions;

export default timetableNewSlice.reducer;
```

---

## FILE 4 — CREATE `src/saga/timetableNewSaga.ts`

```ts
import { takeLatest } from "redux-saga/effects";
import { timetableActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchTimetableNewSaga() {
  yield takeLatest(timetableActions.GET_SLOTS,         genericSaga);
  yield takeLatest(timetableActions.GET_SLOT_DETAIL,   genericSaga);
  yield takeLatest(timetableActions.CREATE_SLOT,       genericSaga);
  yield takeLatest(timetableActions.UPDATE_SLOT,       genericSaga);
  yield takeLatest(timetableActions.DELETE_SLOT,       genericSaga);
  yield takeLatest(timetableActions.GET_EXAM_TYPES,    genericSaga);
  yield takeLatest(timetableActions.CREATE_EXAM_TYPE,  genericSaga);
  yield takeLatest(timetableActions.UPDATE_EXAM_TYPE,  genericSaga);
  yield takeLatest(timetableActions.DELETE_EXAM_TYPE,  genericSaga);
  yield takeLatest(timetableActions.GET_FACULTY_VIEW,  genericSaga);
  yield takeLatest(timetableActions.GET_STUDENT_VIEW,  genericSaga);
}
```

Register in your root saga file — same place where you registered `watchAdmissionSaga`:
```ts
import { watchTimetableNewSaga } from "@/saga/timetableNewSaga";
yield fork(watchTimetableNewSaga); // or yield all([..., call(watchTimetableNewSaga)])
```

Register the reducer in your store:
```ts
import timetableNewReducer from "@/redux/slices/timetableNewSlice";
// in combineReducers:
timetableNew: timetableNewReducer,
```

---

## FILE 5 — CREATE `src/pages/timetable/components/SlotForm.tsx`

This is the **core smart form** used for both Create and Edit. It dynamically shows/hides fields based on `session_type`. Use `react-hook-form` + `zod`.

```tsx
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
```

---

## FILE 6 — CREATE `src/pages/timetable/tabs/SlotsTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import {
  setSlots, setSlotsLoading,
  setSelectedSlot, setSelectedSlotLoading,
  addSlot, updateSlotInList, removeSlot,
} from "@/redux/slices/timetableNewSlice";
import { timetableActions } from "@/redux/actions";
import { API } from "@/service/api";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SlotForm, { buildSlotPayload, type SlotFormValues } from "../components/SlotForm";

const SESSION_BADGE: Record<string, string> = {
  regular:    "bg-blue-100 text-blue-700",
  class_test: "bg-yellow-100 text-yellow-700",
  prelim:     "bg-purple-100 text-purple-700",
  practice:   "bg-green-100 text-green-700",
  custom:     "bg-gray-100 text-gray-700",
};

const DAY_MAP: Record<string, string> = {
  "0": "Mon", "1": "Tue", "2": "Wed", "3": "Thu", "4": "Fri", "5": "Sat", "6": "Sun",
};

interface SlotsTabProps {
  batches:     { id: string; name: string }[];
  subjects:    { id: string; name: string }[];
  facultyList: { id: string; name: string; employee_id?: string }[];
  classrooms:  { id: string; name: string }[];
  examTypes:   { id: string; name: string }[];
  chapters:    { id: string; name: string; order: number; subject?: string }[];
}

export default function SlotsTab({ batches, subjects, facultyList, classrooms, examTypes, chapters }: SlotsTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { slots, slotsLoading, slotsCount } = useSelector((s: RootState) => s.timetableNew);

  const [filters, setFilters] = useState({ batch_id: "", day_of_week: "", faculty_id: "", subject_id: "", session_type: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const canEdit = user && ["super_admin", "branch_manager", "admin_senior_exec", "admin"].includes(user.role ?? "");

  const fetchSlots = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: timetableActions.GET_SLOTS,
      method: "GET",
      endPoint: `${API.TIMETABLE.SLOTS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setSlotsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          dispatch(setSlots({ data, count: res.count ?? data.length }));
        } else toast.error("Failed to load timetable slots.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading slots"),
    });
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleCreateOrUpdate = (payload: Record<string, any>) => {
    const isEdit = !!editingSlot;
    dispatch({
      type: isEdit ? timetableActions.UPDATE_SLOT : timetableActions.CREATE_SLOT,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.TIMETABLE.SLOT_DETAIL(editingSlot.id) : API.TIMETABLE.SLOTS,
      body: payload,
      auth: true,
      setLoading: (v: boolean) => setFormLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          if (isEdit) {
            dispatch(updateSlotInList(res.data));
            toast.success("Timetable slot updated.");
          } else {
            dispatch(addSlot(res.data));
            toast.success("Timetable slot created.");
          }
          setFormOpen(false);
          setEditingSlot(null);
        } else {
          toast.error("Unexpected response from server.");
        }
      },
      getError: (err: any) => {
        const data = err?.response?.data;
        // Handle clash error specifically
        if (data?.clashing_slots?.length) {
          toast.error(`Faculty scheduling conflict detected. Clashing slot IDs: ${data.clashing_slots.join(", ")}`);
        } else {
          toast.error(data?.message || err?.message || `Failed to ${isEdit ? "update" : "create"} slot`);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: timetableActions.DELETE_SLOT,
      method: "DELETE",
      endPoint: API.TIMETABLE.SLOT_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeSlot(deleteTarget.id));
        toast.success("Timetable slot deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete slot"),
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <Select value={filters.session_type} onValueChange={v => setFilters(f => ({ ...f, session_type: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Session Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["regular","class_test","prelim","practice","custom"].map(t => (
              <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.day_of_week} onValueChange={v => setFilters(f => ({ ...f, day_of_week: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-32"><SelectValue placeholder="Day" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {[["0","Monday"],["1","Tuesday"],["2","Wednesday"],["3","Thursday"],["4","Friday"],["5","Saturday"],["6","Sunday"]].map(([v,l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Batch UUID"   className="h-9 text-sm w-40" value={filters.batch_id}   onChange={e => setFilters(f => ({ ...f, batch_id:   e.target.value }))} />
        <Input placeholder="Faculty UUID" className="h-9 text-sm w-40" value={filters.faculty_id} onChange={e => setFilters(f => ({ ...f, faculty_id: e.target.value }))} />
        <Input placeholder="Subject UUID" className="h-9 text-sm w-40" value={filters.subject_id} onChange={e => setFilters(f => ({ ...f, subject_id: e.target.value }))} />
        <Button onClick={fetchSlots} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setFilters({ batch_id: "", day_of_week: "", faculty_id: "", subject_id: "", session_type: "" })}>
          <X className="w-3 h-3 mr-1" />Clear
        </Button>
        {canEdit && (
          <Button onClick={() => { setEditingSlot(null); setFormOpen(true); }} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm ml-auto gap-1.5">
            <Plus className="w-4 h-4" /> Add Slot
          </Button>
        )}
      </div>

      {slotsLoading ? <TableSkeleton columns={7} rows={6} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Timetable Slots</span>
            <span className="text-xs text-muted-foreground">{slotsCount} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40">
                <tr>{["Session", "Batch", "Subject", "Faculty", "Classroom", "Day / Date", "Time", "Exam", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {slots.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No slots found.</td></tr>
                ) : slots.map((slot, i) => (
                  <motion.tr key={slot.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge className={`text-xs capitalize ${SESSION_BADGE[slot.session_type] ?? ""}`}>
                        {slot.session_type_display || slot.session_type}
                      </Badge>
                      {slot.session_name && <div className="text-xs text-muted-foreground mt-0.5 max-w-[140px] truncate">{slot.session_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium">{slot.batch_name || "—"}</div>
                      {slot.course_code && <div className="text-muted-foreground">{slot.course_code}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{slot.subject_name || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{slot.faculty_name || "—"}</div>
                      {slot.faculty_employee_id && <div className="text-muted-foreground">{slot.faculty_employee_id}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{slot.classroom_name || "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {slot.session_type === "regular"
                        ? <span>{DAY_MAP[String(slot.day_of_week)] ?? slot.day_label ?? "—"}{slot.slot_code ? ` · ${slot.slot_code}` : ""}</span>
                        : <span>{slot.session_date ?? "—"}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {slot.exam
                        ? <Badge className="bg-purple-100 text-purple-700 text-xs">Exam linked</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditingSlot(slot); setFormOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget({ id: slot.id, name: slot.session_name || slot.id })}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={open => { setFormOpen(open); if (!open) setEditingSlot(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Timetable Slot" : "Create Timetable Slot"}</DialogTitle>
          </DialogHeader>
          <SlotForm
            batches={batches}
            subjects={subjects}
            facultyList={facultyList}
            classrooms={classrooms}
            examTypes={examTypes}
            chapters={chapters}
            loading={formLoading}
            isEdit={!!editingSlot}
            defaultValues={editingSlot ? {
              session_type:  editingSlot.session_type,
              batch:         editingSlot.batch,
              subject:       editingSlot.subject ?? "",
              faculty:       editingSlot.faculty ?? "",
              classroom:     editingSlot.classroom ?? "",
              session_name:  editingSlot.session_name ?? "",
              slot_code:     editingSlot.slot_code ?? "",
              day_of_week:   String(editingSlot.day_of_week ?? ""),
              session_date:  editingSlot.session_date ?? "",
              start_time:    editingSlot.start_time?.slice(0,5) ?? "",
              end_time:      editingSlot.end_time?.slice(0,5) ?? "",
              effective_from: editingSlot.effective_from ?? "",
              effective_to:   editingSlot.effective_to ?? "",
              is_recurring:   editingSlot.is_recurring ?? true,
              chapters:       (editingSlot.chapters ?? []).join(", "),
              examiners:      (editingSlot.examiners ?? []).join(", "),
              paper_checkers: (editingSlot.paper_checkers ?? []).join(", "),
              timetable_exam_type: editingSlot.timetable_exam_type ?? "",
            } : undefined}
            onSubmit={(payload) => handleCreateOrUpdate(payload)}
            onCancel={() => { setFormOpen(false); setEditingSlot(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete slot "${deleteTarget?.name}"?`}
        description="This removes only the timetable slot. Any linked Exam record will remain in the system."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 7 — CREATE `src/pages/timetable/tabs/ExamTypesTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { timetableActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setExamTypes, setExamTypesLoading, addExamType, updateExamTypeInList, removeExamType } from "@/redux/slices/timetableNewSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function ExamTypesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { examTypes, examTypesLoading } = useSelector((s: RootState) => s.timetableNew);

  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", is_active: true });

  const canEdit = user && ["super_admin", "branch_manager", "admin_senior_exec", "admin"].includes(user.role ?? "");

  useEffect(() => {
    dispatch({
      type: timetableActions.GET_EXAM_TYPES,
      method: "GET",
      endPoint: API.TIMETABLE.EXAM_TYPES,
      auth: true,
      setLoading: (v: boolean) => dispatch(setExamTypesLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setExamTypes(Array.isArray(res.data) ? res.data : []));
        else toast.error("Failed to load exam types.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "", is_active: true }); setFormOpen(true); };
  const openEdit = (et: any) => { setEditing(et); setForm({ name: et.name, description: et.description, is_active: et.is_active }); setFormOpen(true); };

  const handleSave = () => {
    const isEdit = !!editing;
    dispatch({
      type: isEdit ? timetableActions.UPDATE_EXAM_TYPE : timetableActions.CREATE_EXAM_TYPE,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.TIMETABLE.EXAM_TYPE_DETAIL(editing.id) : API.TIMETABLE.EXAM_TYPES,
      body: form,
      auth: true,
      setLoading: (v: boolean) => setFormLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          if (isEdit) { dispatch(updateExamTypeInList(res.data)); toast.success("Exam type updated."); }
          else { dispatch(addExamType(res.data)); toast.success("Exam type created."); }
          setFormOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save exam type"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: timetableActions.DELETE_EXAM_TYPE,
      method: "DELETE",
      endPoint: API.TIMETABLE.EXAM_TYPE_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeExamType(deleteTarget.id));
        toast.success("Exam type deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete exam type"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{examTypes.length} exam type(s)</span>
        {canEdit && (
          <Button onClick={openCreate} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
            <Plus className="w-4 h-4" /> Add Exam Type
          </Button>
        )}
      </div>

      {examTypesLoading ? <TableSkeleton columns={4} rows={4} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Name", "Description", "Status", "Created", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {examTypes.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">No exam types yet. Create one to get started.</td></tr>
              ) : examTypes.map((et, i) => (
                <motion.tr key={et.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{et.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px] truncate">{et.description || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={et.is_active ? "bg-green-100 text-green-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>
                      {et.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(et.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(et)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(et)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Exam Type" : "Create Exam Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Internal Assessment" className="h-9 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="text-sm resize-none" placeholder="Optional description..." />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: !!v }))} />
              <label htmlFor="is_active" className="text-sm cursor-pointer">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button onClick={handleSave} disabled={formLoading || !form.name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {formLoading ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete exam type "${deleteTarget?.name}"?`}
        description="Any timetable slots referencing this exam type will lose the association."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

---

## FILE 8 — CREATE `src/pages/timetable/tabs/PersonalTimetableTab.tsx`

This tab handles BOTH Faculty and Student weekly views. It renders slots grouped by day as a visual weekly grid.

```tsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Search, Clock } from "lucide-react";
import { timetableActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setFacultyTimetable, setFacultyTimetableLoading, setStudentTimetable, setStudentTimetableLoading } from "@/redux/slices/timetableNewSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SESSION_BADGE: Record<string, string> = {
  regular:    "bg-blue-100 text-blue-700",
  class_test: "bg-yellow-100 text-yellow-700",
  prelim:     "bg-purple-100 text-purple-700",
  practice:   "bg-green-100 text-green-700",
  custom:     "bg-gray-100 text-gray-700",
};

function WeekGrid({ data }: { data: Record<string, any[]> }) {
  const days = DAYS_ORDER.filter(d => data[d]?.length > 0);
  if (days.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No slots found for this person.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {days.map(day => (
        <motion.div key={day} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{day}</span>
            <span className="ml-2 text-xs text-muted-foreground">{data[day]?.length} slot(s)</span>
          </div>
          <div className="divide-y divide-border/50">
            {(data[day] || []).map((slot: any) => (
              <div key={slot.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {slot.subject_name || "No subject"}
                  </span>
                  <Badge className={`text-xs shrink-0 ${SESSION_BADGE[slot.session_type] ?? "bg-gray-100 text-gray-700"}`}>
                    {slot.session_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}
                  {slot.slot_code && <span className="ml-1 font-mono bg-muted px-1 rounded text-[10px]">{slot.slot_code}</span>}
                </div>
                {slot.faculty_name && <div className="text-xs text-muted-foreground">{slot.faculty_name}</div>}
                {slot.classroom_name && <div className="text-xs text-muted-foreground">{slot.classroom_name}</div>}
                {slot.batch_name && <div className="text-xs text-muted-foreground">{slot.batch_name}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function PersonalTimetableTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { facultyTimetable, facultyTimetableLoading, studentTimetable, studentTimetableLoading } = useSelector((s: RootState) => s.timetableNew);

  const [facultyId, setFacultyId] = useState("");
  const [studentId, setStudentId] = useState("");

  const fetchFaculty = () => {
    if (!facultyId.trim()) { toast.error("Please enter a Faculty UUID."); return; }
    dispatch({
      type: timetableActions.GET_FACULTY_VIEW,
      method: "GET",
      endPoint: API.TIMETABLE.FACULTY_VIEW(facultyId.trim()),
      auth: true,
      setLoading: (v: boolean) => dispatch(setFacultyTimetableLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setFacultyTimetable(res.data));
        else toast.error("Failed to load faculty timetable.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  const fetchStudent = () => {
    if (!studentId.trim()) { toast.error("Please enter a Student UUID."); return; }
    dispatch({
      type: timetableActions.GET_STUDENT_VIEW,
      method: "GET",
      endPoint: API.TIMETABLE.STUDENT_VIEW(studentId.trim()),
      auth: true,
      setLoading: (v: boolean) => dispatch(setStudentTimetableLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setStudentTimetable(res.data));
        else toast.error("Failed to load student timetable.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="faculty">
        <TabsList className="mb-4">
          <TabsTrigger value="faculty">Faculty View</TabsTrigger>
          <TabsTrigger value="student">Student View</TabsTrigger>
        </TabsList>

        {/* Faculty */}
        <TabsContent value="faculty" className="mt-0 space-y-4">
          <div className="bg-white rounded-xl border border-border p-4 flex gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 max-w-sm">
              <Label className="text-xs text-muted-foreground">Faculty UUID</Label>
              <Input
                placeholder="Enter faculty UUID..."
                className="h-9 text-sm font-mono"
                value={facultyId}
                onChange={e => setFacultyId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchFaculty()}
              />
            </div>
            <Button onClick={fetchFaculty} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
              <Search className="w-4 h-4" /> Load Timetable
            </Button>
          </div>
          {facultyTimetableLoading
            ? <TableSkeleton columns={3} rows={4} className="mt-0" />
            : Object.keys(facultyTimetable).length > 0 && <WeekGrid data={facultyTimetable} />}
        </TabsContent>

        {/* Student */}
        <TabsContent value="student" className="mt-0 space-y-4">
          <div className="bg-white rounded-xl border border-border p-4 flex gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 max-w-sm">
              <Label className="text-xs text-muted-foreground">Student UUID</Label>
              <Input
                placeholder="Enter student UUID..."
                className="h-9 text-sm font-mono"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchStudent()}
              />
            </div>
            <Button onClick={fetchStudent} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
              <Search className="w-4 h-4" /> Load Timetable
            </Button>
          </div>
          {studentTimetableLoading
            ? <TableSkeleton columns={3} rows={4} className="mt-0" />
            : Object.keys(studentTimetable).length > 0 && <WeekGrid data={studentTimetable} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## FILE 9 — CREATE `src/pages/timetable/TimetablePage.tsx` (MAIN PAGE)

```tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";
import { dropdownActions, subjectAction, batchAction, ClassroomAction } from "@/redux/actions";
import { API } from "@/service/api";
import type { AppDispatch } from "@/store";

// ── Tab Components ────────────────────────────────────────────────────────────
import SlotsTab           from "./tabs/SlotsTab";
import ExamTypesTab       from "./tabs/ExamTypesTab";
import PersonalTimetableTab from "./tabs/PersonalTimetableTab";

// ── Static Choice Maps ────────────────────────────────────────────────────────
const TABS = [
  { value: "slots",     label: "Timetable Slots" },
  { value: "exam_types", label: "Exam Types" },
  { value: "personal",  label: "Personal View" },
] as const;

type TabValue = typeof TABS[number]["value"];

export default function TimetablePage() {
  const { setPageTitle } = useUI();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabValue>("slots");

  // ── Shared dropdown data (loaded once, passed as props) ───────────────────
  const [batches,     setBatches]     = useState<{ id: string; name: string }[]>([]);
  const [subjects,    setSubjects]    = useState<{ id: string; name: string }[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: string; name: string; employee_id?: string }[]>([]);
  const [classrooms,  setClassrooms]  = useState<{ id: string; name: string }[]>([]);
  const [chapters,    setChapters]    = useState<{ id: string; name: string; order: number; subject?: string }[]>([]);
  const [examTypes,   setExamTypes]   = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setPageTitle("Timetable");
  }, [setPageTitle]);

  // ── Fetch all dropdown data on mount ──────────────────────────────────────
  useEffect(() => {
    // Batches
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: API.BATCHES.LIST,
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setBatches(Array.isArray(data) ? data : (data?.results ?? []));
      },
      getError: () => {},
    });

    // Subjects
    dispatch({
      type: subjectAction.GET_SUBJECTS,
      method: "GET",
      endPoint: "/api/v1/subjects/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(data)) setSubjects(data);
      },
      getError: () => {},
    });

    // Faculty
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setFacultyList(data?.results ?? (Array.isArray(data) ? data : []));
      },
      getError: () => {},
    });

    // Classrooms
    dispatch({
      type: ClassroomAction.GET_CLASSROOMS,
      method: "GET",
      endPoint: "/api/v1/classrooms/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setClassrooms(Array.isArray(data) ? data : (data?.results ?? []));
      },
      getError: () => {},
    });

    // Chapters
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/chapters/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(data)) setChapters(data);
      },
      getError: () => {},
    });

    // Exam Types (for slot form dropdown)
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/timetable/exam-types/",
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          const data = Array.isArray(res.data) ? res.data : [];
          setExamTypes(data.map((et: any) => ({ id: et.id, name: et.name })));
        }
      },
      getError: () => {},
    });
  }, [dispatch]);

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Schedule sessions, manage exam types, and view personal timetables."
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
          <TabsList className="mb-5">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="slots" className="mt-0">
            <SlotsTab
              batches={batches}
              subjects={subjects}
              facultyList={facultyList}
              classrooms={classrooms}
              examTypes={examTypes}
              chapters={chapters}
            />
          </TabsContent>

          <TabsContent value="exam_types" className="mt-0">
            <ExamTypesTab />
          </TabsContent>

          <TabsContent value="personal" className="mt-0">
            <PersonalTimetableTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
```

---

## CHECKLIST — Do these after pasting all files

- [ ] Register `timetableNewReducer` in your store's `combineReducers`: `timetableNew: timetableNewReducer`
- [ ] Register `watchTimetableNewSaga` in your root saga file (same place as `watchAdmissionSaga`)
- [ ] Add `timetableActions` export to `src/redux/actions/index.ts`
- [ ] Add `API.TIMETABLE` namespace to `src/service/api.ts`
- [ ] Add route in your router: `<Route path="/timetable" element={<TimetablePage />} />`
- [ ] Add nav item for Timetable in your sidebar config
- [ ] If `/api/v1/chapters/` endpoint does not exist yet in your project, remove the chapters fetch block — the form will still work, users just won't see clickable chapter badges (they can still type UUIDs manually)

---

## NOTES FOR IDE AI — Read before writing any code

- **Do NOT install any new npm packages** — every library used is already in `package.json`
- **Do NOT use direct axios calls** — all HTTP goes through `dispatch({ type, method, endPoint, auth: true, ... })`
- **Do NOT change `genericSaga`** — it handles token injection automatically when `auth: true`
- **The `timetableNewSlice` name is intentional** — the project already has `timetableSlice` for the old grid view; this is a parallel, independent slice
- **Clash error format is special** — when the API returns `{ clashing_slots: [...] }`, show a descriptive toast with the slot IDs, not a generic error message
- **`buildSlotPayload` in SlotForm.tsx** strips forbidden fields per session type before sending to API — do not bypass or modify this logic
- **All Tailwind classes only** — no inline styles except `style={{ width: \`${v}%\` }}` for progress bars
- **Primary color** `bg-primary` maps to `#F7A900` in this project's Tailwind config
