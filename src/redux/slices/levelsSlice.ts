import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LevelRecord {
  id: string;
  name: string;
  order: number;
  description?: string;
  course?: string;
  course_type?: string;
  course_type_display?: string;
  duration_months?: number;
  fee_amount?: number | string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

interface LevelsState {
  levels: LevelRecord[];
  loading: boolean;
  error: string | null;
  subjectQuestions: any[];
  subjectQuestionsLoading: boolean;
}

const initialState: LevelsState = {
  levels: [],
  loading: false,
  error: null,
  subjectQuestions: [],
  subjectQuestionsLoading: false,
};

const levelsSlice = createSlice({
  name: "levels",
  initialState,
  reducers: {
    setLevels(state, action: PayloadAction<LevelRecord[]>) {
      state.levels = action.payload;
      state.error = null;
    },
    setLevelsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setLevelsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    addLevelToList(state, action: PayloadAction<LevelRecord>) {
      state.levels = [...state.levels, action.payload].sort((a, b) => a.order - b.order);
    },
    updateLevelInList(state, action: PayloadAction<LevelRecord>) {
      state.levels = state.levels
        .map((l) => (l.id === action.payload.id ? action.payload : l))
        .sort((a, b) => a.order - b.order);
    },
    removeLevelFromList(state, action: PayloadAction<string>) {
      state.levels = state.levels.filter((l) => l.id !== action.payload);
    },
    setSubjectQuestions(state, action: PayloadAction<any[]>) {
      state.subjectQuestions = action.payload;
    },
    setSubjectQuestionsLoading(state, action: PayloadAction<boolean>) {
      state.subjectQuestionsLoading = action.payload;
    },
  },
});

export const {
  setLevels,
  setLevelsLoading,
  setLevelsError,
  addLevelToList,
  updateLevelInList,
  removeLevelFromList,
  setSubjectQuestions,
  setSubjectQuestionsLoading,
} = levelsSlice.actions;

export default levelsSlice.reducer;
