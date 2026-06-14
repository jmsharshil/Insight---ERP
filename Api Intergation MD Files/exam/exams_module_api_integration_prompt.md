# ExamsPage.tsx — Full API Integration Prompt

> Copy this entire prompt and paste it into Cursor / Copilot Chat / Windsurf.
> Fully self-contained — no extra context needed.

---

## CONTEXT — Project Stack & Conventions

You are a senior React + TypeScript developer working inside **insight-ems** (Vite + React 18).

### Tech Stack (already installed — NO new npm installs)

- **State:** Redux Toolkit + Redux Saga (`genericSaga` pattern)
- **Routing:** react-router-dom v6
- **UI:** Radix UI + shadcn/ui (`@/components/ui/`)
- **Charts:** recharts
- **Animations:** framer-motion
- **Forms:** react-hook-form + zod
- **Icons:** lucide-react
- **HTTP:** axios — always via `genericSaga`, never direct calls
- **Notifications:** `useToast` hook (`@/hooks/useToast`)
- **Skeletons:** `TableSkeleton` from `@/components/common/Skeletons`

### API Call Pattern — NEVER deviate

```ts
dispatch({
  type: ACTION_CONSTANT,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endPoint: "/api/v1/...",
  body: { ... },       // optional
  auth: true,          // always — token injected by genericSaga
  setLoading: (v: boolean) => dispatch(setSomeLoading(v)),
  getResponse: (res: any) => { /* handle */ },
  getError: (err: any) => { toast.error(err?.response?.data?.message || err?.message || "Error"); },
});
```

### Role System (from `useAuth().user.role`)

```
super_admin      → full access, all tabs, all CRUD
branch_manager   → full access
admin            → full access
faculty          → view exams, manage questions, view seating, report malpractice
student          → view own exams + results only (read-only)
parent           → view child's results only (read-only)
```

### Design Tokens

- Primary orange: `#F7A900` → `bg-primary` / `text-primary`
- Surface: `#F4F5F5`, Card: `#FFFFFF`, Border: `border-border`
- Status: success `bg-green-100 text-green-700` | danger `bg-red-100 text-red-700` | warning `bg-yellow-100 text-yellow-700` | info `bg-blue-100 text-blue-700`

### Folder Structure to Create

```
src/pages/exams/
  ExamsPage.tsx                ← REPLACE existing stub
  tabs/
    ExamsListTab.tsx           ← All exams list with role-aware actions
    QuestionsTab.tsx           ← Add/edit/delete questions for selected exam
    SeatingTab.tsx             ← Auto + manual seating arrangement
    MalpracticeTab.tsx         ← Report & manage malpractice (admin/faculty)
    ResultsTab.tsx             ← Results view for students/parents
```

---

## BUSINESS LOGIC

### Role-based Tab Visibility

|
Tab
|
super_admin / branch_manager / admin
|
faculty
|
student
|
parent
|
|

---

## |

## |

## |

## |

|
|
Exams List
|
✅ Full CRUD
|
✅ View + manage questions
|
✅ Own exams only
|
✅ Child's exams
|
|
Questions
|
✅
|
✅
|
❌ hidden
|
❌ hidden
|
|
Seating
|
✅
|
✅ view only
|
❌ hidden
|
❌ hidden
|
|
Malpractice
|
✅ Full CRUD
|
✅ Can report
|
❌ hidden
|
❌ hidden
|
|
Results
|
✅
|
✅
|
✅ own results
|
✅ child results
|

### Exam is created by Timetable module — ExamsPage is READ + MANAGE only

- `GET /api/v1/exams/` → list all exams
- `GET /api/v1/exams/{exam_id}/` → single exam detail
- `PATCH /api/v1/exams/{exam_id}/` → update exam meta (title, instructions etc)
- `DELETE /api/v1/exams/{exam_id}/` → delete exam

### Questions — bulk POST, individual PATCH/DELETE

- `GET  /api/v1/exams/{exam_id}/questions/` → list questions
- `POST /api/v1/exams/{exam_id}/questions/` → body is an ARRAY of question objects
- `PATCH /api/v1/exams/{exam_id}/questions/{question_id}/` → update one question
- `DELETE /api/v1/exams/{exam_id}/questions/{question_id}/` → delete one question

Question object shape:

```json
{
  "question_text": "What is X?",
  "question_type": "mcq",
  "marks": 5,
  "order": 1,
  "choices": [
    { "text": "Option A", "is_correct": true },
    { "text": "Option B", "is_correct": false }
  ]
}
```

### Seating — auto or manual

- `GET  /api/v1/exams/{exam_id}/seating/` → list seats
- `POST /api/v1/exams/{exam_id}/seating/` → `{ "auto": true }` OR array of manual assignments
- `PATCH /api/v1/exams/{exam_id}/seating/{seat_id}/` → update one seat
- `DELETE /api/v1/exams/{exam_id}/seating/{seat_id}/` → remove one seat

Manual assignment object:

```json
{ "student_id": "uuid", "room_name": "Room 101", "seat_number": "A1", "row_number": 1 }
```

### Answer Key

- `POST /api/v1/exams/{exam_id}/answer-key/distribute/` → sends email to paper checkers (no body)
- `GET  /api/v1/answer-key/{exam_id}/?token=log_hash` → public view (no auth needed)

### Malpractice

- `GET  /api/v1/exams/{exam_id}/malpractice/` → list reports
- `POST /api/v1/exams/{exam_id}/malpractice/` → create report
- `PATCH /api/v1/exams/{exam_id}/malpractice/{report_id}/` → update
- `DELETE /api/v1/exams/{exam_id}/malpractice/{report_id}/` → delete

Malpractice POST body:

```json
{ "student_id": "uuid", "description": "...", "severity": "minor" | "major" | "disqualified" }
```

---

## FILE 1 — ADD to `src/redux/actions/index.ts`

```ts
export const examActions = {
  GET_EXAMS: "GET_EXAMS",
  GET_EXAM_DETAIL: "GET_EXAM_DETAIL",
  UPDATE_EXAM: "UPDATE_EXAM",
  DELETE_EXAM: "DELETE_EXAM",

  GET_QUESTIONS: "GET_EXAM_QUESTIONS",
  ADD_QUESTIONS: "ADD_EXAM_QUESTIONS",
  UPDATE_QUESTION: "UPDATE_EXAM_QUESTION",
  DELETE_QUESTION: "DELETE_EXAM_QUESTION",

  GET_SEATING: "GET_EXAM_SEATING",
  ASSIGN_SEATING: "ASSIGN_EXAM_SEATING",
  UPDATE_SEAT: "UPDATE_EXAM_SEAT",
  DELETE_SEAT: "DELETE_EXAM_SEAT",

  DISTRIBUTE_ANSWER_KEY: "DISTRIBUTE_ANSWER_KEY",

  GET_MALPRACTICE: "GET_EXAM_MALPRACTICE",
  REPORT_MALPRACTICE: "REPORT_EXAM_MALPRACTICE",
  UPDATE_MALPRACTICE: "UPDATE_EXAM_MALPRACTICE",
  DELETE_MALPRACTICE: "DELETE_EXAM_MALPRACTICE",
} as const;
```

---

## FILE 2 — ADD to `src/service/api.ts`

```ts
EXAMS: {
  LIST:                     "/api/v1/exams/",
  DETAIL:                   (id: string) => `/api/v1/exams/${id}/`,
  QUESTIONS:                (examId: string) => `/api/v1/exams/${examId}/questions/`,
  QUESTION_DETAIL:          (examId: string, qId: string) => `/api/v1/exams/${examId}/questions/${qId}/`,
  SEATING:                  (examId: string) => `/api/v1/exams/${examId}/seating/`,
  SEAT_DETAIL:              (examId: string, seatId: string) => `/api/v1/exams/${examId}/seating/${seatId}/`,
  DISTRIBUTE_ANSWER_KEY:    (examId: string) => `/api/v1/exams/${examId}/answer-key/distribute/`,
  ANSWER_KEY_PUBLIC:        (examId: string) => `/api/v1/answer-key/${examId}/`,
  MALPRACTICE:              (examId: string) => `/api/v1/exams/${examId}/malpractice/`,
  MALPRACTICE_DETAIL:       (examId: string, rId: string) => `/api/v1/exams/${examId}/malpractice/${rId}/`,
},
```

---

## FILE 3 — CREATE `src/redux/slices/examSlice.ts`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Exam {
  id: string;
  title: string;
  exam_type: "offline" | "online";
  total_marks: number;
  pass_marks: number;
  instructions: string | null;
  result_release_mode: "instant" | "manual";
  session_type?: string;
  session_date?: string | null;
  subject_name?: string | null;
  batch_name?: string | null;
  faculty_name?: string | null;
  created_at?: string;
  [key: string]: any;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "subjective";
  marks: number;
  order: number;
  choices: { id?: string; text: string; is_correct: boolean }[];
}

export interface SeatAssignment {
  id: string;
  student_id: string;
  student_name?: string;
  room_name: string;
  seat_number: string;
  row_number: number;
}

export interface MalpracticeReport {
  id: string;
  student_id: string;
  student_name?: string;
  description: string;
  severity: "minor" | "major" | "disqualified";
  created_at: string;
}

interface ExamState {
  exams: Exam[];
  examsCount: number;
  examsLoading: boolean;

  selectedExam: Exam | null;
  selectedExamLoading: boolean;

  questions: Question[];
  questionsLoading: boolean;

  seating: SeatAssignment[];
  seatingLoading: boolean;

  malpractice: MalpracticeReport[];
  malpracticeLoading: boolean;

  error: string | null;
}

const initialState: ExamState = {
  exams: [],
  examsCount: 0,
  examsLoading: false,
  selectedExam: null,
  selectedExamLoading: false,
  questions: [],
  questionsLoading: false,
  seating: [],
  seatingLoading: false,
  malpractice: [],
  malpracticeLoading: false,
  error: null,
};

const examSlice = createSlice({
  name: "exams",
  initialState,
  reducers: {
    setExams(s, a: PayloadAction) {
      s.exams = a.payload.data;
      s.examsCount = a.payload.count;
      s.error = null;
    },
    setExamsLoading(s, a: PayloadAction) {
      s.examsLoading = a.payload;
    },

    setSelectedExam(s, a: PayloadAction) {
      s.selectedExam = a.payload;
      s.error = null;
    },
    setSelectedExamLoading(s, a: PayloadAction) {
      s.selectedExamLoading = a.payload;
    },
    updateExamInList(s, a: PayloadAction) {
      const i = s.exams.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.exams[i] = a.payload;
      if (s.selectedExam?.id === a.payload.id) s.selectedExam = a.payload;
    },
    removeExam(s, a: PayloadAction) {
      s.exams = s.exams.filter((x) => x.id !== a.payload);
      s.examsCount -= 1;
      if (s.selectedExam?.id === a.payload) s.selectedExam = null;
    },

    setQuestions(s, a: PayloadAction) {
      s.questions = a.payload;
      s.error = null;
    },
    setQuestionsLoading(s, a: PayloadAction) {
      s.questionsLoading = a.payload;
    },
    updateQuestion(s, a: PayloadAction) {
      const i = s.questions.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.questions[i] = a.payload;
    },
    removeQuestion(s, a: PayloadAction) {
      s.questions = s.questions.filter((x) => x.id !== a.payload);
    },

    setSeating(s, a: PayloadAction) {
      s.seating = a.payload;
      s.error = null;
    },
    setSeatingLoading(s, a: PayloadAction) {
      s.seatingLoading = a.payload;
    },
    updateSeat(s, a: PayloadAction) {
      const i = s.seating.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.seating[i] = a.payload;
    },
    removeSeat(s, a: PayloadAction) {
      s.seating = s.seating.filter((x) => x.id !== a.payload);
    },

    setMalpractice(s, a: PayloadAction) {
      s.malpractice = a.payload;
      s.error = null;
    },
    setMalpracticeLoading(s, a: PayloadAction) {
      s.malpracticeLoading = a.payload;
    },
    addMalpracticeReport(s, a: PayloadAction) {
      s.malpractice.unshift(a.payload);
    },
    updateMalpracticeReport(s, a: PayloadAction) {
      const i = s.malpractice.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.malpractice[i] = a.payload;
    },
    removeMalpracticeReport(s, a: PayloadAction) {
      s.malpractice = s.malpractice.filter((x) => x.id !== a.payload);
    },

    setExamError(s, a: PayloadAction) {
      s.error = a.payload;
    },
    clearExamError(s) {
      s.error = null;
    },
  },
});

export const {
  setExams,
  setExamsLoading,
  setSelectedExam,
  setSelectedExamLoading,
  updateExamInList,
  removeExam,
  setQuestions,
  setQuestionsLoading,
  updateQuestion,
  removeQuestion,
  setSeating,
  setSeatingLoading,
  updateSeat,
  removeSeat,
  setMalpractice,
  setMalpracticeLoading,
  addMalpracticeReport,
  updateMalpracticeReport,
  removeMalpracticeReport,
  setExamError,
  clearExamError,
} = examSlice.actions;

export default examSlice.reducer;
```

---

## FILE 4 — CREATE `src/saga/examSaga.ts`

```ts
import { takeLatest } from "redux-saga/effects";
import { examActions } from "@/redux/actions";
import { genericSaga } from "@/saga/createGenericSaga/genericSaga";

export function* watchExamSaga() {
  yield takeLatest(examActions.GET_EXAMS, genericSaga);
  yield takeLatest(examActions.GET_EXAM_DETAIL, genericSaga);
  yield takeLatest(examActions.UPDATE_EXAM, genericSaga);
  yield takeLatest(examActions.DELETE_EXAM, genericSaga);
  yield takeLatest(examActions.GET_QUESTIONS, genericSaga);
  yield takeLatest(examActions.ADD_QUESTIONS, genericSaga);
  yield takeLatest(examActions.UPDATE_QUESTION, genericSaga);
  yield takeLatest(examActions.DELETE_QUESTION, genericSaga);
  yield takeLatest(examActions.GET_SEATING, genericSaga);
  yield takeLatest(examActions.ASSIGN_SEATING, genericSaga);
  yield takeLatest(examActions.UPDATE_SEAT, genericSaga);
  yield takeLatest(examActions.DELETE_SEAT, genericSaga);
  yield takeLatest(examActions.DISTRIBUTE_ANSWER_KEY, genericSaga);
  yield takeLatest(examActions.GET_MALPRACTICE, genericSaga);
  yield takeLatest(examActions.REPORT_MALPRACTICE, genericSaga);
  yield takeLatest(examActions.UPDATE_MALPRACTICE, genericSaga);
  yield takeLatest(examActions.DELETE_MALPRACTICE, genericSaga);
}
```

Register in your root saga and store:

```ts
// root saga — same pattern as watchAdmissionSaga
import { watchExamSaga } from "@/saga/examSaga";
yield fork(watchExamSaga);

// store combineReducers
import examReducer from "@/redux/slices/examSlice";
exams: examReducer,
```

---

## FILE 5 — CREATE `src/pages/exams/tabs/ExamsListTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, Trash2, Pencil, Search, X, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setExams, setExamsLoading,
  setSelectedExam, setSelectedExamLoading,
  updateExamInList, removeExam,
} from "@/redux/slices/examSlice";
import type { Exam } from "@/redux/slices/examSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const EXAM_TYPE_BADGE: Record = {
  online:  "bg-blue-100 text-blue-700",
  offline: "bg-gray-100 text-gray-700",
};

const RELEASE_BADGE: Record = {
  instant: "bg-green-100 text-green-700",
  manual:  "bg-yellow-100 text-yellow-700",
};

interface ExamsListTabProps {
  onSelectExam: (exam: Exam) => void;
  selectedExamId: string | null;
}

export default function ExamsListTab({ onSelectExam, selectedExamId }: ExamsListTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { exams, examsLoading, examsCount } = useSelector((s: RootState) => s.exams);

  const [search, setSearch]           = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "", instructions: "", total_marks: "", pass_marks: "",
    exam_type: "offline", result_release_mode: "manual",
  });

  const isAdmin   = user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";
  const isParent  = user?.role === "parent";
  const canEdit   = isAdmin;
  const canDelete = isAdmin;

  const fetchExams = () => {
    dispatch({
      type: examActions.GET_EXAMS,
      method: "GET",
      endPoint: API.EXAMS.LIST,
      auth: true,
      setLoading: (v: boolean) => dispatch(setExamsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          dispatch(setExams({ data, count: res.count ?? data.length }));
        } else toast.error("Failed to load exams.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading exams"),
    });
  };

  useEffect(() => { fetchExams(); }, []);

  const openEdit = (exam: Exam) => {
    setEditTarget(exam);
    setEditForm({
      title:               exam.title ?? "",
      instructions:        exam.instructions ?? "",
      total_marks:         String(exam.total_marks ?? ""),
      pass_marks:          String(exam.pass_marks ?? ""),
      exam_type:           exam.exam_type ?? "offline",
      result_release_mode: exam.result_release_mode ?? "manual",
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_EXAM,
      method: "PATCH",
      endPoint: API.EXAMS.DETAIL(editTarget.id),
      body: {
        ...editForm,
        total_marks: Number(editForm.total_marks),
        pass_marks:  Number(editForm.pass_marks),
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(updateExamInList(res.data));
          toast.success("Exam updated.");
          setEditOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update exam"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_EXAM,
      method: "DELETE",
      endPoint: API.EXAMS.DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeExam(deleteTarget.id));
        toast.success("Exam deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete exam"),
    });
  };

  const filtered = exams.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchType   = !examTypeFilter || e.exam_type === examTypeFilter;
    return matchSearch && matchType;
  });

  return (

      {/* Filters */}



          <Input
            placeholder="Search exams..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

        <Select value={examTypeFilter} onValueChange={v => setExamTypeFilter(v === "all" ? "" : v)}>


            All Types
            Online
            Offline


        <Button variant="outline" className="h-9 text-sm" onClick={() => { setSearch(""); setExamTypeFilter(""); }}>
          Clear


          Refresh



      {/* Info banner for students/parents */}
      {(isStudent || isParent) && (


          {isStudent ? "Showing your enrolled exams." : "Showing exams for your child."}
          {" "}Exam-taking is available on the mobile app.

      )}

      {/* Count */}

        {examsCount} exam(s) total · {filtered.length} shown


      {examsLoading ?  : (



              {["Title", "Type", "Marks", "Pass Marks", "Result Release", "Subject / Batch", ""].map(h => (
                {h}
              ))}


              {filtered.length === 0 ? (
                No exams found.
              ) : filtered.map((exam, i) => (
                <motion.tr
                  key={exam.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className={`border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors
                    ${selectedExamId === exam.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  onClick={() => onSelectExam(exam)}
                >

                    {exam.title}
                    {exam.session_date && (

                        {exam.session_date}

                    )}



                      {exam.exam_type}


                  {exam.total_marks}
                  {exam.pass_marks}


                      {exam.result_release_mode}



                    {exam.subject_name ?? "—"}
                    {exam.batch_name ?? "—"}



                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={e => { e.stopPropagation(); onSelectExam(exam); }}>


                      {canEdit && (
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={e => { e.stopPropagation(); openEdit(exam); }}>


                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={e => { e.stopPropagation(); setDeleteTarget(exam); }}>


                      )}



              ))}



      )}

      {/* Edit Exam Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>

          Edit Exam


              Title *
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="h-9 text-sm" />



                Total Marks
                <Input type="number" value={editForm.total_marks} onChange={e => setEditForm(f => ({ ...f, total_marks: e.target.value }))} className="h-9 text-sm" />


                Pass Marks
                <Input type="number" value={editForm.pass_marks} onChange={e => setEditForm(f => ({ ...f, pass_marks: e.target.value }))} className="h-9 text-sm" />




                Exam Type
                <Select value={editForm.exam_type} onValueChange={v => setEditForm(f => ({ ...f, exam_type: v }))}>


                    Offline
                    Online




                Result Release
                <Select value={editForm.result_release_mode} onValueChange={v => setEditForm(f => ({ ...f, result_release_mode: v }))}>


                    Manual
                    Instant





              Instructions
              <Textarea value={editForm.instructions} onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))} rows={3} className="text-sm resize-none" />



            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel

              {editLoading ? "Saving…" : "Update Exam"}





      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently deletes the exam and all associated questions, seating, and malpractice reports."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />

  );
}
```

---

## FILE 6 — CREATE `src/pages/exams/tabs/QuestionsTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, CheckCircle2, Circle, X } from "lucide-react";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setQuestions, setQuestionsLoading, updateQuestion, removeQuestion } from "@/redux/slices/examSlice";
import type { Question } from "@/redux/slices/examSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface QuestionsTabProps { examId: string; }

// ─── New Question Builder (local state) ──────────────────────────────────────
const blankQuestion = () => ({
  question_text: "",
  question_type: "mcq" as "mcq" | "subjective",
  marks: 1,
  order: 1,
  choices: [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ],
});

type DraftQuestion = ReturnType;

export default function QuestionsTab({ examId }: QuestionsTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { questions, questionsLoading } = useSelector((s: RootState) => s.exams);

  const [addOpen, setAddOpen]           = useState(false);
  const [drafts, setDrafts]             = useState([blankQuestion()]);
  const [addLoading, setAddLoading]     = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [editLoading, setEditLoading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canManage = user && ["super_admin", "branch_manager", "admin", "faculty"].includes(user.role ?? "");

  useEffect(() => {
    dispatch({
      type: examActions.GET_QUESTIONS,
      method: "GET",
      endPoint: API.EXAMS.QUESTIONS(examId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setQuestionsLoading(v)),
      getResponse: (res: any) => {
        const data = res?.data ?? res?.results ?? (Array.isArray(res) ? res : []);
        dispatch(setQuestions(Array.isArray(data) ? data : []));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load questions"),
    });
  }, [examId]);

  // ── Draft management ──────────────────────────────────────────────────────
  const updateDraft = (idx: number, field: keyof DraftQuestion, value: any) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };
  const updateChoice = (draftIdx: number, choiceIdx: number, field: "text" | "is_correct", value: any) => {
    setDrafts(prev => prev.map((d, i) => {
      if (i !== draftIdx) return d;
      const choices = d.choices.map((c, ci) => {
        if (field === "is_correct" && value === true) return { ...c, is_correct: ci === choiceIdx };
        if (ci === choiceIdx) return { ...c, [field]: value };
        return c;
      });
      return { ...d, choices };
    }));
  };
  const addDraft    = () => setDrafts(prev => [...prev, { ...blankQuestion(), order: prev.length + 1 }]);
  const removeDraft = (idx: number) => setDrafts(prev => prev.filter((_, i) => i !== idx));

  const handleAddQuestions = () => {
    const payload = drafts.map(d => ({
      question_text: d.question_text,
      question_type: d.question_type,
      marks: Number(d.marks),
      order: Number(d.order),
      choices: d.question_type === "mcq" ? d.choices.filter(c => c.text.trim()) : [],
    }));
    dispatch({
      type: examActions.ADD_QUESTIONS,
      method: "POST",
      endPoint: API.EXAMS.QUESTIONS(examId),
      body: payload,
      auth: true,
      setLoading: (v: boolean) => setAddLoading(v),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(`${drafts.length} question(s) added.`);
          setAddOpen(false);
          setDrafts([blankQuestion()]);
          // Refresh questions list
          dispatch({
            type: examActions.GET_QUESTIONS,
            method: "GET",
            endPoint: API.EXAMS.QUESTIONS(examId),
            auth: true,
            setLoading: (v: boolean) => dispatch(setQuestionsLoading(v)),
            getResponse: (res2: any) => {
              const data = res2?.data ?? (Array.isArray(res2) ? res2 : []);
              dispatch(setQuestions(Array.isArray(data) ? data : []));
            },
            getError: () => {},
          });
        } else toast.error("Failed to add questions.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add questions"),
    });
  };

  const handleUpdateQuestion = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_QUESTION,
      method: "PATCH",
      endPoint: API.EXAMS.QUESTION_DETAIL(examId, editTarget.id),
      body: {
        question_text: editTarget.question_text,
        marks: Number(editTarget.marks),
        order: Number(editTarget.order),
        choices: editTarget.choices,
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateQuestion(res.data)); toast.success("Question updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update question"),
    });
  };

  const handleDeleteQuestion = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_QUESTION,
      method: "DELETE",
      endPoint: API.EXAMS.QUESTION_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeQuestion(deleteTarget.id)); toast.success("Question deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete question"),
    });
  };

  return (


        {questions.length} question(s)
        {canManage && (
          <Button onClick={() => { setDrafts([blankQuestion()]); setAddOpen(true); }}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
             Add Questions

        )}


      {questionsLoading ?  : (

          {questions.length === 0 ? (

              No questions yet. Click "Add Questions" to get started.

          ) : questions.map((q, i) => (



                  Q{q.order}.

                    {q.question_text}

                      {q.question_type}
                      {q.marks} mark{q.marks !== 1 ? "s" : ""}

                    {q.question_type === "mcq" && q.choices?.length > 0 && (

                        {q.choices.map((c, ci) => (

                            {c.is_correct
                              ?
                              : }
                            {c.text}

                        ))}

                    )}


                {canManage && (

                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(q); setEditOpen(true); }}>


                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(q)}>



                )}


          ))}

      )}

      {/* Add Questions Dialog */}
      <Dialog open={addOpen} onOpenChange={o => setAddOpen(o)}>

          Add Questions

            {drafts.map((draft, idx) => (


                  Question {idx + 1}
                  {drafts.length > 1 && (
                    <Button variant="ghost" size="icon" className="w-6 h-6 absolute top-3 right-3" onClick={() => removeDraft(idx)}>


                  )}


                  Question Text *
                  <Textarea
                    value={draft.question_text}
                    onChange={e => updateDraft(idx, "question_text", e.target.value)}
                    rows={2} className="text-sm resize-none"
                    placeholder="Enter the question..."
                  />



                    Type
                    <Select value={draft.question_type} onValueChange={v => updateDraft(idx, "question_type", v)}>


                        MCQ
                        Subjective




                    Marks
                    <Input type="number" value={draft.marks} onChange={e => updateDraft(idx, "marks", e.target.value)} className="h-9 text-sm" />


                    Order
                    <Input type="number" value={draft.order} onChange={e => updateDraft(idx, "order", e.target.value)} className="h-9 text-sm" />


                {draft.question_type === "mcq" && (

                    Choices (click radio to mark correct)
                    {draft.choices.map((choice, ci) => (

                        <button type="button" onClick={() => updateChoice(idx, ci, "is_correct", true)}
                          className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer
                            ${choice.is_correct ? "bg-green-500 border-green-500" : "border-muted-foreground"}`} />
                        <Input
                          value={choice.text}
                          onChange={e => updateChoice(idx, ci, "text", e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + ci)}`}
                          className="h-8 text-sm flex-1"
                        />

                    ))}

                )}

            ))}

               Add Another Question



            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel
            <Button onClick={handleAddQuestions} disabled={addLoading || drafts.some(d => !d.question_text.trim())}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {addLoading ? "Saving…" : `Add ${drafts.length} Question${drafts.length > 1 ? "s" : ""}`}





      {/* Edit Question Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>

          Edit Question
          {editTarget && (


                Question Text
                <Textarea
                  value={editTarget.question_text}
                  onChange={e => setEditTarget(prev => prev ? { ...prev, question_text: e.target.value } : null)}
                  rows={3} className="text-sm resize-none"
                />



                  Marks
                  <Input type="number" value={editTarget.marks}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, marks: Number(e.target.value) } : null)}
                    className="h-9 text-sm" />


                  Order
                  <Input type="number" value={editTarget.order}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, order: Number(e.target.value) } : null)}
                    className="h-9 text-sm" />


              {editTarget.question_type === "mcq" && editTarget.choices?.map((c, ci) => (

                  <button type="button"
                    onClick={() => setEditTarget(prev => prev ? {
                      ...prev, choices: prev.choices.map((ch, i) => ({ ...ch, is_correct: i === ci }))
                    } : null)}
                    className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer
                      ${c.is_correct ? "bg-green-500 border-green-500" : "border-muted-foreground"}`} />
                  <Input value={c.text}
                    onChange={e => setEditTarget(prev => prev ? {
                      ...prev, choices: prev.choices.map((ch, i) => i === ci ? { ...ch, text: e.target.value } : ch)
                    } : null)}
                    className="h-8 text-sm flex-1"
                  />

              ))}

          )}

            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel

              {editLoading ? "Saving…" : "Update"}





      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete this question?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteQuestion}
      />

  );
}
```

---

## FILE 7 — CREATE `src/pages/exams/tabs/SeatingTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, Zap, Users } from "lucide-react";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setSeating, setSeatingLoading, updateSeat, removeSeat } from "@/redux/slices/examSlice";
import type { SeatAssignment } from "@/redux/slices/examSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface SeatingTabProps { examId: string; }

export default function SeatingTab({ examId }: SeatingTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { seating, seatingLoading } = useSelector((s: RootState) => s.exams);

  const [autoLoading, setAutoLoading]   = useState(false);
  const [manualOpen, setManualOpen]     = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [editLoading, setEditLoading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [manualForm, setManualForm] = useState({
    student_id: "", room_name: "", seat_number: "", row_number: "1",
  });

  const isAdmin   = user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");
  const isFaculty = user?.role === "faculty";
  const canAssign = isAdmin;

  const fetchSeating = () => {
    dispatch({
      type: examActions.GET_SEATING,
      method: "GET",
      endPoint: API.EXAMS.SEATING(examId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSeatingLoading(v)),
      getResponse: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        dispatch(setSeating(Array.isArray(data) ? data : []));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load seating"),
    });
  };

  useEffect(() => { fetchSeating(); }, [examId]);

  const handleAutoAssign = () => {
    dispatch({
      type: examActions.ASSIGN_SEATING,
      method: "POST",
      endPoint: API.EXAMS.SEATING(examId),
      body: { auto: true },
      auth: true,
      setLoading: (v: boolean) => setAutoLoading(v),
      getResponse: (res: any) => {
        toast.success(res?.message || "Seats auto-assigned.");
        fetchSeating();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Auto-assign failed"),
    });
  };

  const handleManualAssign = () => {
    dispatch({
      type: examActions.ASSIGN_SEATING,
      method: "POST",
      endPoint: API.EXAMS.SEATING(examId),
      body: [{ ...manualForm, row_number: Number(manualForm.row_number) }],
      auth: true,
      setLoading: (v: boolean) => setManualLoading(v),
      getResponse: (res: any) => {
        toast.success("Seat assigned.");
        setManualOpen(false);
        setManualForm({ student_id: "", room_name: "", seat_number: "", row_number: "1" });
        fetchSeating();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Manual assign failed"),
    });
  };

  const handleUpdateSeat = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_SEAT,
      method: "PATCH",
      endPoint: API.EXAMS.SEAT_DETAIL(examId, editTarget.id),
      body: { room_name: editTarget.room_name, seat_number: editTarget.seat_number, row_number: editTarget.row_number },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateSeat(res.data)); toast.success("Seat updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update seat"),
    });
  };

  const handleDeleteSeat = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_SEAT,
      method: "DELETE",
      endPoint: API.EXAMS.SEAT_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeSeat(deleteTarget.id)); toast.success("Seat removed."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to remove seat"),
    });
  };

  return (


        {seating.length} seat(s) assigned
        {canAssign && (



              {autoLoading ? "Assigning…" : "Auto Assign"}

            <Button onClick={() => setManualOpen(true)} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
               Manual Assign


        )}


      {seatingLoading ?  : (

          {seating.length === 0 ? (


              No seats assigned yet.
              {canAssign && " Use Auto Assign or add manually."}

          ) : (


                {["Student", "Room", "Seat", "Row", ""].map(h => (
                  {h}
                ))}


                {seating.map((seat, i) => (


                      {seat.student_name || "—"}
                      {seat.student_id}

                    {seat.room_name}
                    {seat.seat_number}
                    {seat.row_number}

                      {canAssign && (

                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(seat); setEditOpen(true); }}>


                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(seat)}>



                      )}


                ))}


          )}

      )}

      {/* Manual Assign Dialog */}
      <Dialog open={manualOpen} onOpenChange={o => setManualOpen(o)}>

          Manual Seat Assignment

            {[
              { label: "Student UUID", key: "student_id", placeholder: "student-uuid", mono: true },
              { label: "Room Name",    key: "room_name",  placeholder: "Room 101" },
              { label: "Seat Number",  key: "seat_number", placeholder: "A1" },
              { label: "Row Number",   key: "row_number",  placeholder: "1", type: "number" },
            ].map(field => (

                {field.label} *
                <Input
                  type={field.type ?? "text"}
                  value={(manualForm as any)[field.key]}
                  onChange={e => setManualForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className={`h-9 text-sm ${field.mono ? "font-mono" : ""}`}
                />

            ))}


            <Button variant="outline" onClick={() => setManualOpen(false)} disabled={manualLoading}>Cancel

              {manualLoading ? "Assigning…" : "Assign Seat"}





      {/* Edit Seat Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>

          Edit Seat
          {editTarget && (

              {[
                { label: "Room",        key: "room_name" },
                { label: "Seat Number", key: "seat_number" },
                { label: "Row Number",  key: "row_number", type: "number" },
              ].map(field => (

                  {field.label}
                  <Input
                    type={field.type ?? "text"}
                    value={(editTarget as any)[field.key]}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, [field.key]: e.target.value } : null)}
                    className="h-9 text-sm"
                  />

              ))}

          )}

            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel

              {editLoading ? "Saving…" : "Update Seat"}





      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Remove this seat assignment?"
        description="The student will lose their assigned seat."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDeleteSeat}
      />

  );
}
```

---

## FILE 8 — CREATE `src/pages/exams/tabs/MalpracticeTab.tsx`

```tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, ShieldAlert } from "lucide-react";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setMalpractice, setMalpracticeLoading,
  addMalpracticeReport, updateMalpracticeReport, removeMalpracticeReport,
} from "@/redux/slices/examSlice";
import type { MalpracticeReport } from "@/redux/slices/examSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const SEVERITY_BADGE: Record = {
  minor:        "bg-yellow-100 text-yellow-700",
  major:        "bg-red-100 text-red-700",
  disqualified: "bg-red-200 text-red-900",
};

interface MalpracticeTabProps { examId: string; }

export default function MalpracticeTab({ examId }: MalpracticeTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { malpractice, malpracticeLoading } = useSelector((s: RootState) => s.exams);

  const [reportOpen, setReportOpen]         = useState(false);
  const [reportLoading, setReportLoading]   = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState(null);
  const [editLoading, setEditLoading]       = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState(null);

  const [form, setForm] = useState({ student_id: "", description: "", severity: "minor" as "minor" | "major" | "disqualified" });

  const canManage = user && ["super_admin", "branch_manager", "admin", "faculty"].includes(user.role ?? "");

  useEffect(() => {
    dispatch({
      type: examActions.GET_MALPRACTICE,
      method: "GET",
      endPoint: API.EXAMS.MALPRACTICE(examId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setMalpracticeLoading(v)),
      getResponse: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        dispatch(setMalpractice(Array.isArray(data) ? data : []));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load malpractice reports"),
    });
  }, [examId]);

  const handleReport = () => {
    dispatch({
      type: examActions.REPORT_MALPRACTICE,
      method: "POST",
      endPoint: API.EXAMS.MALPRACTICE(examId),
      body: form,
      auth: true,
      setLoading: (v: boolean) => setReportLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addMalpracticeReport(res.data));
          toast.success("Malpractice reported.");
          setReportOpen(false);
          setForm({ student_id: "", description: "", severity: "minor" });
        } else toast.error("Failed to submit report.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to report malpractice"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_MALPRACTICE,
      method: "PATCH",
      endPoint: API.EXAMS.MALPRACTICE_DETAIL(examId, editTarget.id),
      body: { description: editTarget.description, severity: editTarget.severity },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateMalpracticeReport(res.data)); toast.success("Report updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update report"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_MALPRACTICE,
      method: "DELETE",
      endPoint: API.EXAMS.MALPRACTICE_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeMalpracticeReport(deleteTarget.id)); toast.success("Report deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete report"),
    });
  };

  return (


        {malpractice.length} report(s)
        {canManage && (
          <Button onClick={() => setReportOpen(true)} className="h-9 bg-red-600 hover:bg-red-700 text-white text-sm gap-1.5">
             Report Malpractice

        )}


      {malpracticeLoading ?  : (

          {malpractice.length === 0 ? (

              No malpractice reports for this exam.

          ) : malpractice.map((r, i) => (







                    {r.severity}

                      {r.student_name || r.student_id} · {new Date(r.created_at).toLocaleDateString()}


                  {r.description}


              {canManage && (

                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(r); setEditOpen(true); }}>


                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(r)}>



              )}

          ))}

      )}

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={o => setReportOpen(o)}>

          Report Malpractice


              Student UUID *
              <Input value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                placeholder="student-uuid" className="h-9 text-sm font-mono" />


              Severity *
              <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as any }))}>


                  Minor
                  Major
                  Disqualified




              Description *
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Describe the incident..." className="text-sm resize-none" />



            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reportLoading}>Cancel

              {reportLoading ? "Submitting…" : "Submit Report"}





      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>

          Edit Report
          {editTarget && (


                Severity
                <Select value={editTarget.severity} onValueChange={v => setEditTarget(p => p ? { ...p, severity: v as any } : null)}>


                    Minor
                    Major
                    Disqualified




                Description
                <Textarea value={editTarget.description}
                  onChange={e => setEditTarget(p => p ? { ...p, description: e.target.value } : null)}
                  rows={3} className="text-sm resize-none" />


          )}

            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel

              {editLoading ? "Saving…" : "Update"}





      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete this malpractice report?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />

  );
}
```

---

## FILE 9 — CREATE `src/pages/exams/tabs/ResultsTab.tsx`

```tsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import type { AppDispatch } from "@/store";
import type { Exam } from "@/redux/slices/examSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle2, XCircle, Key } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface ResultsTabProps {
  exam: Exam;
}

export default function ResultsTab({ exam }: ResultsTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  const [distributeLoading, setDistributeLoading] = useState(false);
  const [distributeConfirm, setDistributeConfirm] = useState(false);

  const isAdmin   = user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";
  const isParent  = user?.role === "parent";

  const canDistribute = isAdmin || isFaculty;

  const handleDistributeAnswerKey = () => {
    dispatch({
      type: examActions.DISTRIBUTE_ANSWER_KEY,
      method: "POST",
      endPoint: API.EXAMS.DISTRIBUTE_ANSWER_KEY(exam.id),
      auth: true,
      setLoading: (v: boolean) => setDistributeLoading(v),
      getResponse: () => {
        toast.success("Answer key distributed to paper checkers via email.");
        setDistributeConfirm(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to distribute answer key.");
        setDistributeConfirm(false);
      },
    });
  };

  return (


      {/* Exam Summary Card */}

        Exam Overview

          {[
            { label: "Total Marks",   value: exam.total_marks,  color: "text-foreground" },
            { label: "Pass Marks",    value: exam.pass_marks,   color: "text-foreground" },
            { label: "Exam Type",     value: exam.exam_type,    color: "text-blue-600"   },
            { label: "Result Mode",   value: exam.result_release_mode, color: exam.result_release_mode === "instant" ? "text-green-600" : "text-yellow-600" },
          ].map(item => (

              {item.value}
              {item.label}

          ))}


        {exam.instructions && (

            Instructions
            {exam.instructions}

        )}


      {/* Answer Key Distribution — admin/faculty only */}
      {canDistribute && (







                Distribute Answer Key

                  Sends a secure email link to all assigned paper checkers.
                  They can view the answer key without logging in.



            <Button
              onClick={() => setDistributeConfirm(true)}
              disabled={distributeLoading}
              className="h-9 bg-purple-600 hover:bg-purple-700 text-white text-sm gap-1.5 shrink-0"
            >

              {distributeLoading ? "Sending…" : "Distribute"}



      )}

      {/* Student / Parent view — exam-taking info */}
      {(isStudent || isParent) && (



            Exam Information


            📱 This exam is taken on the mobile app. Open the mobile application to start.
            ⏱ Results will be released {exam.result_release_mode} after submission.
            {isParent && 👤 You are viewing this exam as a parent/guardian.}



              {exam.total_marks}
              Total Marks


              {exam.pass_marks}
              Pass Marks



      )}

      <ConfirmDialog
        open={distributeConfirm}
        onOpenChange={o => setDistributeConfirm(o)}
        title="Distribute Answer Key?"
        description="This will send a secure email with the answer key to all assigned paper checkers. This action cannot be undone."
        confirmLabel="Send Now"
        onConfirm={handleDistributeAnswerKey}
      />

  );
}
```

---

## FILE 10 — CREATE `src/pages/exams/ExamsPage.tsx` (REPLACE EXISTING STUB)

```tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { setSelectedExam, setQuestions, setSeating, setMalpractice } from "@/redux/slices/examSlice";
import type { Exam } from "@/redux/slices/examSlice";

// ── Tab Components ────────────────────────────────────────────────────────────
import ExamsListTab    from "./tabs/ExamsListTab";
import QuestionsTab    from "./tabs/QuestionsTab";
import SeatingTab      from "./tabs/SeatingTab";
import MalpracticeTab  from "./tabs/MalpracticeTab";
import ResultsTab      from "./tabs/ResultsTab";

// ─── Role-based tab config ────────────────────────────────────────────────────
const getVisibleTabs = (role: string) => {
  const all = [
    { value: "list",        label: "Exams",       roles: ["super_admin","branch_manager","admin","faculty","student","parent"] },
    { value: "questions",   label: "Questions",   roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "seating",     label: "Seating",     roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "malpractice", label: "Malpractice", roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "results",     label: "Results",     roles: ["super_admin","branch_manager","admin","faculty","student","parent"] },
  ];
  return all.filter(t => t.roles.includes(role));
};

export default function ExamsPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab]         = useState("list");
  const [selectedExam, setLocalExam]      = useState(null);

  const role = user?.role ?? "student";
  const visibleTabs = getVisibleTabs(role);

  useEffect(() => {
    setPageTitle("Exams");
  }, [setPageTitle]);

  const handleSelectExam = (exam: Exam) => {
    setLocalExam(exam);
    dispatch(setSelectedExam(exam));
    // Clear sub-data when switching exam
    dispatch(setQuestions([]));
    dispatch(setSeating([]));
    dispatch(setMalpractice([]));
    // Switch to questions tab for admins/faculty, results for students/parents
    if (["student","parent"].includes(role)) {
      setActiveTab("results");
    } else {
      setActiveTab("questions");
    }
  };

  const handleBackToList = () => {
    setLocalExam(null);
    dispatch(setSelectedExam(null));
    setActiveTab("list");
  };

  // ── Detail view — shown when an exam is selected ──────────────────────────
  const showDetail = !!selectedExam && activeTab !== "list";

  return (




        <Tabs value={activeTab} onValueChange={v => {
          setActiveTab(v);
          // When navigating to list tab, clear selected exam
          if (v === "list") { setLocalExam(null); dispatch(setSelectedExam(null)); }
        }}>


              {visibleTabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.value !== "list" && !selectedExam}
                  className="text-sm disabled:opacity-40"
                >
                  {tab.label}

              ))}


            {/* Selected exam pill */}
            {selectedExam && (



                  {selectedExam.title}

                    {selectedExam.exam_type}



                   Back


            )}


          {/* ── Exams List ──────────────────────────────────────────────── */}




          {/* ── Questions ────────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "questions") && (

              {selectedExam
                ?
                : }

          )}

          {/* ── Seating ──────────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "seating") && (

              {selectedExam
                ?
                : }

          )}

          {/* ── Malpractice ──────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "malpractice") && (

              {selectedExam
                ?
                : }

          )}

          {/* ── Results ──────────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "results") && (

              {selectedExam
                ?
                : }

          )}



  );
}

// ─── Empty state when no exam is selected ─────────────────────────────────────
function EmptySelectPrompt({ message }: { message: string }) {
  return (


      {message}

  );
}
```

---

## CHECKLIST — Do after pasting all files

- [ ] Register `examReducer` in store: `exams: examReducer`
- [ ] Register `watchExamSaga` in root saga: `yield fork(watchExamSaga)`
- [ ] Add `examActions` to `src/redux/actions/index.ts`
- [ ] Add `API.EXAMS` to `src/service/api.ts`
- [ ] Add route in router: `<Route path="/exams" element={<ExamsPage />} />`
- [ ] Add nav item for Exams in your sidebar config

---

## NOTES FOR IDE AI

- **Do NOT install any new packages** — all imports are from existing dependencies
- **Do NOT use direct axios** — all HTTP via `dispatch({ type, method, endPoint, auth: true, ... })`
- **Questions POST body is an ARRAY** — even for a single question: `body: [{ ... }]`
- **Seating auto-assign body** is `{ auto: true }` (object not array) — manual is an array
- **Distribute answer key has no body** — just a POST with no payload
- **Role check pattern**: `["super_admin","branch_manager","admin"].includes(user?.role ?? "")` — always use includes, never equality chains
- **Tab gating**: tabs other than "list" and "results" are `disabled` until an exam is selected — this is enforced via the `disabled` prop on `TabsTrigger`
- **Exam is never created from ExamsPage** — it is always created by the Timetable module. ExamsPage is READ + MANAGE only
- **Student/parent flow**: clicking an exam auto-navigates to Results tab, not Questions
- **MalpracticeTab uses red primary button** (`bg-red-600`) intentionally — this is a high-severity action
- All Tailwind classes only — primary `bg-primary` = `#F7A900` per project theme config
