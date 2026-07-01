import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  branch: string | null;
  organization?: string;
  organization_name?: string;
  created_at: string;
  profile_pic: string | null;
  salary_retention_percentage?: number | string;
  employee_id?: string;
  qualification?: string;
  specialization?: string;
  subject_expertise?: string;
  level?: string;
  employment_type?: string;
  joining_date?: string;
  hourly_rate?: number | string;
  session_hours?: number | string;
  salary?: number | string;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
  work_start_time?: string;
  work_end_time?: string;
  per_paper_rate?: number | string;
}

interface UsersState {
  users: UserRecord[];
  loading: boolean;
  error: string | null;
  selectedUser: UserRecord | null;
  selectedUserLoading: boolean;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  selectedUser: null,
  selectedUserLoading: false,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<UserRecord[]>) {
      state.users = action.payload;
      state.error = null;
    },
    setUsersLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setUsersError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSelectedUser(state, action: PayloadAction<UserRecord | null>) {
      state.selectedUser = action.payload;
    },
    setSelectedUserLoading(state, action: PayloadAction<boolean>) {
      state.selectedUserLoading = action.payload;
    },
    updateUserInList(state, action: PayloadAction<Partial<UserRecord> & { id: string }>) {
      const idx = state.users.findIndex((u) => u.id === action.payload.id);
      if (idx !== -1) {
        state.users[idx] = { ...state.users[idx], ...action.payload };
      }
      if (state.selectedUser?.id === action.payload.id) {
        state.selectedUser = { ...state.selectedUser, ...action.payload };
      }
    },
  },
});

export const { 
  setUsers, 
  setUsersLoading, 
  setUsersError,
  setSelectedUser,
  setSelectedUserLoading,
  updateUserInList
} = usersSlice.actions;
export default usersSlice.reducer;
