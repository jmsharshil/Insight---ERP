import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  branch: string | null;
  linked_students: string[] | null;
  organization: string;
  organization_name: string;
  profile_pic: string | null;
}
interface SettingsState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}
const initialState: SettingsState = {
  profile: null,
  loading: false,
  error: null,
};
const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
      state.error = null;
    },
    setSettingsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSettingsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    updateProfileFields(state, action: PayloadAction<Partial<UserProfile>>) {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
  },
});
export const { setProfile, setSettingsLoading, setSettingsError, updateProfileFields } =
  settingsSlice.actions;
export default settingsSlice.reducer;
