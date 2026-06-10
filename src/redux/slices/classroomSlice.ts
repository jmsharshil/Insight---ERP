import { createSlice } from "@reduxjs/toolkit";

export interface ClassRoom {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

interface ClassroomState {
  classrooms: ClassRoom[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ClassroomState = {
  classrooms: [],
  isLoading: false,
  error: null,
};

const classroomSlice = createSlice({
  name: "classRoom",
  initialState,
  reducers: {
    setClassrooms: (state, action) => {
      state.classrooms = action.payload;
    },
    addClassroom: (state, action) => {
      state.classrooms.push(action.payload);
    },
    updateClassroom: (state, action) => {
      state.classrooms = state.classrooms.map((c) =>
        c.id === action.payload.id ? { ...c, ...action.payload } : c
      );
    },
    deleteClassroom: (state, action) => {
      state.classrooms = state.classrooms.filter((c) => c.id !== action.payload);
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setClassrooms, addClassroom, updateClassroom, deleteClassroom, setIsLoading, setError } = classroomSlice.actions;

export default classroomSlice.reducer;