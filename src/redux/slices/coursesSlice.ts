import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SubjectRecord {
  id: string;
  course: string;
  course_name: string;
  name: string;
  code: string;
  total_hours: number;
  is_active: boolean;
}

export interface CourseRecord {
  id: string | number;
  name: string;
  code?: string;
  course_type?: string;
  description?: string;
  duration_months?: number;
  duration?: string;
  fee_amount?: string;
  credits?: number;
  department?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  organization?: string;
  subjects?: SubjectRecord[];
  [key: string]: unknown;
}

interface CoursesState {
  courses: CourseRecord[];
  loading: boolean;
  error: string | null;
  selectedCourse: CourseRecord | null;
  selectedCourseLoading: boolean;
}

const initialState: CoursesState = {
  courses: [],
  loading: false,
  error: null,
  selectedCourse: null,
  selectedCourseLoading: false,
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setCourses(state, action: PayloadAction<CourseRecord[]>) {
      state.courses = action.payload;
      state.error = null;
    },
    setCoursesLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setCoursesError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    setSelectedCourse(state, action: PayloadAction<CourseRecord | null>) {
      state.selectedCourse = action.payload;
    },
    setSelectedCourseLoading(state, action: PayloadAction<boolean>) {
      state.selectedCourseLoading = action.payload;
    },
    removeCourseFromList(state, action: PayloadAction<string | number>) {
      state.courses = state.courses.filter((c) => c.id !== action.payload);
    },
    addCourseToList(state, action: PayloadAction<CourseRecord>) {
      state.courses = [action.payload, ...state.courses];
    },
    updateCourseInList(state, action: PayloadAction<Partial<CourseRecord> & { id: string | number }>) {
      const idx = state.courses.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.courses[idx] = { ...state.courses[idx], ...action.payload } as CourseRecord;
      }
      if (state.selectedCourse?.id === action.payload.id) {
        state.selectedCourse = { ...state.selectedCourse, ...action.payload } as CourseRecord;
      }
    },
    addSubjectToCourse(state, action: PayloadAction<SubjectRecord>) {
      if (state.selectedCourse && state.selectedCourse.id === action.payload.course) {
        state.selectedCourse.subjects = [
          ...(state.selectedCourse.subjects || []),
          action.payload,
        ];
      }
      const courseIdx = state.courses.findIndex((c) => c.id === action.payload.course);
      if (courseIdx !== -1) {
        const course = state.courses[courseIdx];
        course.subjects = [...(course.subjects || []), action.payload];
      }
    },
    updateSubjectInCourse(state, action: PayloadAction<SubjectRecord>) {
      if (state.selectedCourse && state.selectedCourse.id === action.payload.course) {
        state.selectedCourse.subjects = (state.selectedCourse.subjects || []).map((s) =>
          s.id === action.payload.id ? action.payload : s,
        );
      }
      const courseIdx = state.courses.findIndex((c) => c.id === action.payload.course);
      if (courseIdx !== -1) {
        const course = state.courses[courseIdx];
        course.subjects = (course.subjects || []).map((s) =>
          s.id === action.payload.id ? action.payload : s,
        );
      }
    },
    removeSubjectFromCourse(state, action: PayloadAction<{ courseId: string | number; subjectId: string }>) {
      if (state.selectedCourse && state.selectedCourse.id === action.payload.courseId) {
        state.selectedCourse.subjects = (state.selectedCourse.subjects || []).filter(
          (s) => s.id !== action.payload.subjectId,
        );
      }
      const courseIdx = state.courses.findIndex((c) => c.id === action.payload.courseId);
      if (courseIdx !== -1) {
        const course = state.courses[courseIdx];
        course.subjects = (course.subjects || []).filter((s) => s.id !== action.payload.subjectId);
      }
    },
  },
});

export const {
  setCourses,
  setCoursesLoading,
  setCoursesError,
  setSelectedCourse,
  setSelectedCourseLoading,
  removeCourseFromList,
  addCourseToList,
  updateCourseInList,
  addSubjectToCourse,
  updateSubjectInCourse,
  removeSubjectFromCourse,
} = coursesSlice.actions;
export default coursesSlice.reducer;
