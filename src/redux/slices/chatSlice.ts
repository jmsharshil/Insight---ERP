import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatChannel, CHAT_CHANNELS } from "@/constants/dummy/chat";

interface ChatState {
  rooms: ChatChannel[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  rooms: [],
  loading: false,
  error: null,
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<ChatChannel[]>) => {
      state.rooms = action.payload;
      state.error = null;
    },
    setRoomsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRoomsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    updateRoomUnreadCount: (state, action: PayloadAction<{ roomId: string; count: number }>) => {
      const room = state.rooms.find(r => r.id === action.payload.roomId);
      if (room) {
        room.unreadCount = action.payload.count;
      }
    },
  },
});

export const { setRooms, setRoomsLoading, setRoomsError, updateRoomUnreadCount } = chatSlice.actions;

export default chatSlice.reducer;
