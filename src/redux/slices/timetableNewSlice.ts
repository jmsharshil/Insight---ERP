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
