import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatChannel, CHAT_CHANNELS } from "@/constants/dummy/chat";

interface ChatState {
  rooms: ChatChannel[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  rooms: CHAT_CHANNELS,
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
  },
});

export const { setRooms, setRoomsLoading, setRoomsError } = chatSlice.actions;

export default chatSlice.reducer;
