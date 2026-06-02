import type { RootState } from "../index";

export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectPageTitle = (state: RootState) => state.ui.pageTitle;
