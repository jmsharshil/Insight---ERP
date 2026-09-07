import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  priority: "high" | "normal";
  notificationType: string;
  actionUrl?: string;
  data?: any;
}

interface NotificationsState {
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<AppNotification[]>) {
      state.notifications = action.payload;
    },
    setNotificationsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setNotificationsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    markAllAsRead(state) {
      state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
    },
    markAsRead(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.map(n => n.id === action.payload ? { ...n, isRead: true } : n);
    }
  },
});

export const { setNotifications, setNotificationsLoading, setNotificationsError, markAllAsRead, markAsRead } = notificationsSlice.actions;

export default notificationsSlice.reducer;
