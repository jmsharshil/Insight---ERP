import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Exam {
  id: string;
  title: string;
  exam_type: "mcq" | "subjective";
  exam_mode: "online" | "offline";
  total_marks: number;
  pass_marks: number;
  instructions: string | null;
  result_release_mode: "instant" | "manual";
  session_type?: string;
  session_date?: string | null;
  status_display?: string;
  subject_name?: string | null;
  batch_name?: string | null;
  faculty_name?: string | null;
  selected_papers?: any[];
  created_at?: string;
  [key: string]: any;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "subjective" | "paragraph_mcq" | "true_false";
  paragraph_text?: string;
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
  student_id?: string;
  student_name?: string;
  session_id?: string;
  event_type?: string;
  event_type_display?: string;
  action_taken?: string;
  action_taken_display?: string;
  occurred_at?: string;
  // Old fields for backward compatibility/fallback
  student?: string;
  reported_by?: string;
  reported_by_name?: string;
  description?: string;
  severity?: string;
  severity_display?: string;
  reported_at?: string;
  created_at?: string;
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
    setExams(s, a: PayloadAction<{ data: Exam[]; count: number }>) {
      s.exams = a.payload.data;
      s.examsCount = a.payload.count;
      s.error = null;
    },
    setExamsLoading(s, a: PayloadAction<boolean>) {
      s.examsLoading = a.payload;
    },

    setSelectedExam(s, a: PayloadAction<Exam | null>) {
      s.selectedExam = a.payload;
      s.error = null;
    },
    setSelectedExamLoading(s, a: PayloadAction<boolean>) {
      s.selectedExamLoading = a.payload;
    },
    updateExamInList(s, a: PayloadAction<Exam>) {
      const i = s.exams.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.exams[i] = a.payload;
      if (s.selectedExam?.id === a.payload.id) s.selectedExam = a.payload;
    },
    removeExam(s, a: PayloadAction<string>) {
      s.exams = s.exams.filter((x) => x.id !== a.payload);
      s.examsCount -= 1;
      if (s.selectedExam?.id === a.payload) s.selectedExam = null;
    },

    setQuestions(s, a: PayloadAction<Question[]>) {
      s.questions = a.payload;
      s.error = null;
    },
    setQuestionsLoading(s, a: PayloadAction<boolean>) {
      s.questionsLoading = a.payload;
    },
    updateQuestion(s, a: PayloadAction<Question>) {
      const i = s.questions.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.questions[i] = a.payload;
    },
    removeQuestion(s, a: PayloadAction<string>) {
      s.questions = s.questions.filter((x) => x.id !== a.payload);
    },

    setSeating(s, a: PayloadAction<SeatAssignment[]>) {
      s.seating = a.payload;
      s.error = null;
    },
    setSeatingLoading(s, a: PayloadAction<boolean>) {
      s.seatingLoading = a.payload;
    },
    updateSeat(s, a: PayloadAction<SeatAssignment>) {
      const i = s.seating.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.seating[i] = a.payload;
    },
    removeSeat(s, a: PayloadAction<string>) {
      s.seating = s.seating.filter((x) => x.id !== a.payload);
    },

    setMalpractice(s, a: PayloadAction<MalpracticeReport[]>) {
      s.malpractice = a.payload;
      s.error = null;
    },
    setMalpracticeLoading(s, a: PayloadAction<boolean>) {
      s.malpracticeLoading = a.payload;
    },
    addMalpracticeReport(s, a: PayloadAction<MalpracticeReport>) {
      s.malpractice.unshift(a.payload);
    },
    updateMalpracticeReport(s, a: PayloadAction<MalpracticeReport>) {
      const i = s.malpractice.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.malpractice[i] = a.payload;
    },
    removeMalpracticeReport(s, a: PayloadAction<string>) {
      s.malpractice = s.malpractice.filter((x) => x.id !== a.payload);
    },

    setExamError(s, a: PayloadAction<string>) {
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
