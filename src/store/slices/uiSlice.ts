import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  pageTitle: string;
  notificationPrefs: Record<string, boolean>;
}

const initialState: UIState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  pageTitle: "Dashboard",
  notificationPrefs: {},
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleMobileSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    closeMobileSidebar(state) { state.sidebarOpen = false; },
    toggleSidebarCollapse(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setPageTitle(state, action: PayloadAction<string>) { state.pageTitle = action.payload; },
    toggleNotificationPref(state, action: PayloadAction<string>) {
      const k = action.payload;
      state.notificationPrefs[k] = !(state.notificationPrefs[k] ?? true);
    },
  },
});

export const {
  toggleMobileSidebar, closeMobileSidebar, toggleSidebarCollapse, setPageTitle, toggleNotificationPref,
} = uiSlice.actions;
export default uiSlice.reducer;
