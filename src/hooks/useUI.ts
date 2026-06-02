import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  toggleMobileSidebar, closeMobileSidebar, toggleSidebarCollapse, setPageTitle,
} from "@/store/slices/uiSlice";
import {
  selectSidebarOpen, selectSidebarCollapsed, selectPageTitle,
} from "@/store/selectors/uiSelectors";

export const useUI = () => {
  const dispatch = useAppDispatch();
  return {
    sidebarOpen: useAppSelector(selectSidebarOpen),
    sidebarCollapsed: useAppSelector(selectSidebarCollapsed),
    pageTitle: useAppSelector(selectPageTitle),
    toggleMobileSidebar: () => dispatch(toggleMobileSidebar()),
    closeMobileSidebar: () => dispatch(closeMobileSidebar()),
    toggleSidebarCollapse: () => dispatch(toggleSidebarCollapse()),
    setPageTitle: (title: string) => dispatch(setPageTitle(title)),
  };
};
