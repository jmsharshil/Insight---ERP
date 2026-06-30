import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, MessageSquare, Check, CheckCheck,
  Pencil, Trash2, X, Info, FileText, Download, Image as ImageIcon, Loader2, Lock
} from "lucide-react";
import axios from "axios";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { type ChatMessage } from "@/constants/dummy/chat";
import { ChatAction } from "@/redux/actions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setRooms, setRoomsLoading, setRoomsError, updateRoomUnreadCount } from "@/redux/slices/chatSlice";
import { useUI } from "@/hooks/useUI";
import CreateChatModal from "./CreateChatModal";
import RoomDetails from "./RoomDetails";
import { ChatSkeleton } from "@/components/common/Skeletons";
import {
  useChatWebSocket,
  type WSNewMessageEvent,
  type WSTypingEvent,
  type WSDeliveredReceiptEvent,
  type WSReadReceiptEvent,
  type WSMessageUpdatedEvent,
  type WSMessageDeletedEvent,
  type WSUnreadUpdateEvent,
  type WSAllMessagesReadEvent,
} from "@/hooks/useChatWebSocket";

// ─── Typing indicator state ──────────────────────────────────────────────────

interface TypingUser {
  userId: string;
  fullName: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

// ─── Context menu state ──────────────────────────────────────────────────────

interface ContextMenuState {
  messageId: string;
  x: number;
  y: number;
}

// ─── Targeted message participant type ───────────────────────────────────────

interface RoomParticipant {
  id: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
}

// ─── Typing debounce constants ───────────────────────────────────────────────

const TYPING_SEND_INTERVAL = 3000;  // Min ms between typing_start events
const TYPING_STOP_DELAY = 3000;     // ms of inactivity before sending typing_stop
const TYPING_DISPLAY_TIMEOUT = 4000; // ms to show remote typing indicator

export default function ChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { rooms, loading } = useAppSelector((state) => state.chat);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const { setPageTitle } = useUI();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── WebSocket-specific state ──────────────────────────────────────────────
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Typing debounce refs
  const lastTypingSentRef = useRef<number>(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingActiveRef = useRef(false);

  // Temp message tracking for dedup
  const pendingTempIdsRef = useRef<Set<string>>(new Set());

  // ── Targeted message state ──────────────────────────────────────────────
  const [targetUsers, setTargetUsers] = useState<RoomParticipant[]>([]);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [roomParticipants, setRoomParticipants] = useState<RoomParticipant[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // NOTE: No auto-select — user must click a room to connect WebSocket

  const channels = rooms.filter((c) =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase()),
  );
  const active = rooms.find((c) => c.id === activeId);
  const msgs = activeId ? (messages[activeId] || []) : [];

  // ── Reset details view and targeted state when switching chats ─────────────
  useEffect(() => {
    setShowDetails(false);
    setTargetUsers([]);
    setShowMentionPopover(false);
    setMentionQuery("");
  }, [activeId]);

  // ── Fetch faculty participants for group rooms (for @mention) ──────────────
  useEffect(() => {
    if (!activeId || active?.type !== "group") {
      setRoomParticipants([]);
      return;
    }
    dispatch({
      type: ChatAction.GET_CHAT_ROOM_DETAILS,
      method: "GET",
      endPoint: `/api/v1/chat/rooms/${activeId}/`,
      auth: true,
      getResponse: (res: any) => {
        const details = res?.data || res;
        const participants = (details?.participants || [])
          .filter((p: any) => p.id !== user?.id)
          .filter((p: any) =>
            p.role !== "student" && p.role !== "parent" && p.role !== "parents"
          )
          .map((p: any) => ({
            id: p.id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            role: p.role,
          }));
        setRoomParticipants(participants);
      },
      getError: () => { /* silent — mention just won't show faculty */ },
    });
  }, [activeId, active?.type, dispatch, user?.id]);

  const prevRoomRef = useRef({ id: activeId, length: msgs.length });

  // ── Auto-scroll on new messages ───────────────────────────────────────────
  useLayoutEffect(() => {
    const isRoomSwitch = prevRoomRef.current.id !== activeId;
    const isInitialLoad = isRoomSwitch || Math.abs(msgs.length - prevRoomRef.current.length) > 5;
    
    scrollRef.current?.scrollTo({ 
      top: scrollRef.current.scrollHeight, 
      behavior: isInitialLoad ? "auto" : "smooth" 
    });
    
    prevRoomRef.current = { id: activeId, length: msgs.length };
  }, [activeId, msgs.length]);

  useEffect(() => {
    setPageTitle("Messages");
  }, [setPageTitle]);

  // ── Close context menu on click outside ───────────────────────────────────
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu]);

  // ── WebSocket Event Handlers ──────────────────────────────────────────────

  const handleNewMessage = useCallback((data: WSNewMessageEvent) => {
    const msg = data.message;
    const roomId = msg.room_id;

    const newMsg: ChatMessage = {
      id: msg.id,
      channelId: roomId,
      senderId: msg.sender.id,
      senderName: msg.sender.full_name,
      senderAvatar: msg.sender.avatar_url || undefined,
      content: msg.content,
      type: msg.file_url ? "file" : "text",
      fileUrl: msg.file_url || undefined,
      fileName: msg.file_name || undefined,
      fileSize: msg.file_size || undefined,
      timestamp: msg.created_at,
      readBy: [],
      status: msg.delivered_at ? "delivered" : "sent",
      targets: msg.targets || undefined,
    };

    setMessages(prev => {
      const existing = prev[roomId] || [];

      // If the sender is the current user, check for temp message to replace (dedup)
      if (msg.sender.id === user?.id) {
        // Find a temp message with matching content that's still pending
        const tempIdx = existing.findIndex(m =>
          pendingTempIdsRef.current.has(m.id) && m.content === msg.content
        );
        if (tempIdx !== -1) {
          const tempId = existing[tempIdx].id;
          pendingTempIdsRef.current.delete(tempId);
          const updated = [...existing];
          updated[tempIdx] = newMsg;
          return { ...prev, [roomId]: updated };
        }
      }

      // Check if message already exists (by server ID) — prevents dupes on reconnect
      if (existing.some(m => m.id === msg.id)) {
        return prev;
      }

      return { ...prev, [roomId]: [...existing, newMsg] };
    });
  }, [user?.id]);

  const handleTyping = useCallback((data: WSTypingEvent) => {
    // Don't show own typing indicator
    if (data.user_id === user?.id) return;

    setTypingUsers(prev => {
      const next = new Map(prev);
      if (data.is_typing) {
        // Clear existing timeout for this user
        const existing = next.get(data.user_id);
        if (existing) clearTimeout(existing.timeoutId);

        // Auto-clear typing after timeout (in case typing_stop is missed)
        const timeoutId = setTimeout(() => {
          setTypingUsers(p => {
            const n = new Map(p);
            n.delete(data.user_id);
            return n;
          });
        }, TYPING_DISPLAY_TIMEOUT);

        next.set(data.user_id, {
          userId: data.user_id,
          fullName: data.full_name,
          timeoutId,
        });
      } else {
        const existing = next.get(data.user_id);
        if (existing) clearTimeout(existing.timeoutId);
        next.delete(data.user_id);
      }
      return next;
    });
  }, [user?.id]);

  const handleDeliveredReceipt = useCallback((data: WSDeliveredReceiptEvent) => {
    setMessages(prev => {
      const updated: Record<string, ChatMessage[]> = {};
      for (const [roomId, roomMsgs] of Object.entries(prev)) {
        updated[roomId] = roomMsgs.map(m =>
          m.id === data.message_id && m.status === "sent"
            ? { ...m, status: "delivered" as const }
            : m
        );
      }
      return { ...prev, ...updated };
    });
  }, []);

  const handleReadReceipt = useCallback((data: WSReadReceiptEvent) => {
    setMessages(prev => {
      const updated: Record<string, ChatMessage[]> = {};
      for (const [roomId, roomMsgs] of Object.entries(prev)) {
        updated[roomId] = roomMsgs.map(m =>
          m.id === data.message_id
            ? { ...m, status: "read" as const, readBy: [...(m.readBy || []), data.user_id] }
            : m
        );
      }
      return { ...prev, ...updated };
    });
    
    // Instantly update badge count if provided by backend
    if (data.unread_count !== undefined) {
      // Find room id from messages if needed, or rely on unread_update event
      // Actually backend also broadcasts `unread_update`, we'll rely on that.
      // But we can dispatch here if room_id was in payload, it's not. 
    }
  }, []);

  const handleUnreadUpdate = useCallback((data: WSUnreadUpdateEvent) => {
    dispatch(updateRoomUnreadCount({ roomId: data.room_id, count: data.unread_count }));
  }, [dispatch]);

  const handleAllMessagesRead = useCallback((data: WSAllMessagesReadEvent) => {
    setMessages(prev => {
      if (!prev[data.room_id]) return prev;
      
      const updatedRoomMsgs = prev[data.room_id].map(m => 
        // Only mark messages sent TO the current user as read 
        // (the other person reading their own msgs doesn't make sense)
        m.senderId !== user?.id && m.status !== "read"
          ? { ...m, status: "read" as const, readBy: [...(m.readBy || []), user?.id || ""] }
          : m
      );
      
      return { ...prev, [data.room_id]: updatedRoomMsgs };
    });
  }, [user?.id]);

  const handleMessageUpdated = useCallback((data: WSMessageUpdatedEvent) => {
    setMessages(prev => {
      const updated: Record<string, ChatMessage[]> = {};
      for (const [roomId, roomMsgs] of Object.entries(prev)) {
        updated[roomId] = roomMsgs.map(m =>
          m.id === data.message_id
            ? { ...m, content: data.content, isEdited: true }
            : m
        );
      }
      return { ...prev, ...updated };
    });
  }, []);

  const handleMessageDeleted = useCallback((data: WSMessageDeletedEvent) => {
    setMessages(prev => {
      const updated: Record<string, ChatMessage[]> = {};
      for (const [roomId, roomMsgs] of Object.entries(prev)) {
        updated[roomId] = roomMsgs.map(m =>
          m.id === data.message_id
            ? { ...m, content: "This message was deleted", isDeleted: true }
            : m
        );
      }
      return { ...prev, ...updated };
    });
  }, []);

  // ── Memoized handlers object for stable reference ─────────────────────────
  const wsHandlers = useMemo(() => ({
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onDeliveredReceipt: handleDeliveredReceipt,
    onReadReceipt: handleReadReceipt,
    onUnreadUpdate: handleUnreadUpdate,
    onAllMessagesRead: handleAllMessagesRead,
    onMessageUpdated: handleMessageUpdated,
    onMessageDeleted: handleMessageDeleted,
  }), [handleNewMessage, handleTyping, handleDeliveredReceipt, handleReadReceipt, handleUnreadUpdate, handleAllMessagesRead, handleMessageUpdated, handleMessageDeleted]);

  // ── Connect WebSocket ─────────────────────────────────────────────────────
  const {
    isConnected,
    isReconnecting,
    sendMessage: wsSendMessage,
    startTyping: wsStartTyping,
    stopTyping: wsStopTyping,
    markRead: wsMarkRead,
    markAllRead: wsMarkAllRead,
    editMessage: wsEditMessage,
    deleteMessage: wsDeleteMessage,
  } = useChatWebSocket(activeId || null, wsHandlers);

  // ── Fetch rooms via REST ──────────────────────────────────────────────────

  const fetchRooms = () => {
    dispatch({
      type: ChatAction.GET_CHAT_ROOMS,
      method: "GET",
      endPoint: "/api/v1/chat/rooms/",
      auth: true,
      setLoading: (val: boolean) => dispatch(setRoomsLoading(val)),
      getResponse: (res: any) => {
        const rawRooms = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.rooms) ? res.data.rooms : [];
        const mappedRooms = rawRooms.map((room: any) => {
          // Determine display name
          const displayName = room.name || (room.room_type === "direct" ? "Direct Message" : "Group Chat");

          // Map tick_status to our status type
          const mapTickStatus = (tick: string | undefined): "sent" | "delivered" | "read" => {
            if (tick === "read") return "read";
            if (tick === "delivered") return "delivered";
            return "sent";
          };

          return {
            id: room.id,
            type: room.room_type || "direct",
            name: displayName,
            avatarUrl: room.avatar_url || undefined,
            participants: [],
            unreadCount: room.unread_count || 0,
            roomTypeDisplay: room.room_type_display || undefined,
            lastMessage: room.last_message ? {
              id: room.last_message.id || room.id,
              channelId: room.id,
              senderId: "",
              senderName: room.last_message.sender_name || "",
              content: room.last_message.content || "",
              type: "text" as const,
              timestamp: room.last_message.created_at || "",
              readBy: [],
              status: mapTickStatus(room.last_message.tick_status),
            } : undefined,
          };
        });
        dispatch(setRooms(mappedRooms));
      },
      getError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to load chat rooms";
        dispatch(setRoomsError(errorMsg));
      }
    });
  };

  useEffect(() => {
    fetchRooms();
  }, [dispatch, user?.id]);

  // ── Fetch messages via REST (initial load for a room) ─────────────────────

  useEffect(() => {
    if (activeId) {
      setIsLoadingMessages(true);
      dispatch({
        type: "GET_CHAT_MESSAGES",
        method: "GET",
        endPoint: `/api/v1/chat/rooms/${activeId}/messages/`,
        auth: true,
        getResponse: (res: any) => {
          // Handle { results: [...] } wrapper or direct array
          const fetchedMessages = Array.isArray(res?.results) ? res.results
            : Array.isArray(res?.data?.results) ? res.data.results
            : Array.isArray(res?.data) ? res.data
            : Array.isArray(res) ? res : [];

          // Map tick_status to our status type
          const mapTickStatus = (tick: string | undefined): "sent" | "delivered" | "read" => {
            if (tick === "read") return "read";
            if (tick === "delivered") return "delivered";
            return "sent";
          };

          const mappedMsgs = fetchedMessages.map((m: any) => ({
            id: m.id,
            channelId: activeId,
            senderId: m.sender?.id || m.sender || m.sender_id,
            senderName: m.sender?.full_name || m.sender_name || "Unknown",
            senderAvatar: m.sender?.avatar_url || undefined,
            content: m.content || "",
            type: m.file_url ? "file" : "text",
            fileUrl: m.file_url || undefined,
            fileName: m.file_name || undefined,
            fileSize: m.file_size || undefined,
            timestamp: m.created_at || new Date().toISOString(),
            readBy: (m.read_receipts || []).map((r: any) => r.user_id),
            status: mapTickStatus(m.tick_status),
            isEdited: m.updated_at && m.updated_at !== m.created_at ? true : false,
            isDeleted: m.is_deleted || false,
            targets: m.targets || undefined,
          })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          setMessages(prev => ({ ...prev, [activeId]: mappedMsgs }));
          setIsLoadingMessages(false);
        },
        getError: (err: any) => {
          console.error("Failed to fetch messages", err);
          setIsLoadingMessages(false);
        }
      });
    }
  }, [activeId, dispatch, user?.id]);

  // ── Mark messages as read when viewing a room ─────────────────────────────

  useEffect(() => {
    if (!activeId || !isConnected || !msgs.length) return;

    // Find the last message not sent by the current user that hasn't been read
    const lastUnreadFromOthers = [...msgs]
      .reverse()
      .find(m => m.senderId !== user?.id && m.status !== "read");

    if (lastUnreadFromOthers) {
      wsMarkRead(lastUnreadFromOthers.id);
    }
  }, [activeId, isConnected, msgs, user?.id, wsMarkRead]);

  // ── Send message ──────────────────────────────────────────────────────────

  const send = async () => {
    if ((!draft.trim() && !selectedFile) || !activeId || isUploading) return;
    const content = draft.trim();

    // Reset typing state
    if (isTypingActiveRef.current) {
      wsStopTyping();
      isTypingActiveRef.current = false;
    }
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    if (selectedFile) {
      if (!isConnected) {
        toast.error("Cannot send message, chat is disconnected.");
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const raw = localStorage.getItem("Insight_Login_Data");
        const token = raw ? JSON.parse(raw)?.access : "";
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
        
        const res = await axios.post(`${baseUrl}/api/v1/chat/upload/`, formData, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        
        const data = res.data;

        // Create optimistic temp message for the file so sender sees it immediately
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const fileMsg: ChatMessage = {
          id: tempId,
          channelId: activeId,
          senderId: user?.id || "",
          senderName: user?.name || "You",
          content: content,
          type: "file",
          fileUrl: data.file_url,
          fileName: data.file_name,
          fileSize: data.file_size,
          timestamp: new Date().toISOString(),
          readBy: [user?.id || ""],
          status: "sent",
          targets: targetUsers.length > 0 ? targetUsers.map(u => ({ id: u.id, full_name: u.full_name, role: u.role })) : undefined,
        };

        pendingTempIdsRef.current.add(tempId);
        setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), fileMsg] }));

        // Send via WebSocket
        wsSendMessage(content, {
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size
        }, targetUsers.map(u => u.id));

        // Clean up temp tracking after timeout
        setTimeout(() => {
          pendingTempIdsRef.current.delete(tempId);
        }, 8000);
        
        setDraft("");
        setTargetUsers([]);
        setSelectedFile(null);
      } catch (err: any) {
        console.error("Upload error", err);
        toast.error(err?.response?.data?.message || "Failed to upload file");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (!isConnected) {
      toast.error("Cannot send message, chat is disconnected.");
      return;
    }

    setDraft("");

    // Create optimistic temp message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const m: ChatMessage = {
      id: tempId,
      channelId: activeId,
      senderId: user?.id || "",
      senderName: user?.name || "You",
      content: content,
      type: "text",
      timestamp: new Date().toISOString(),
      readBy: [user?.id || ""],
      status: "sent",
      targets: targetUsers.length > 0 ? targetUsers.map(u => ({ id: u.id, full_name: u.full_name, role: u.role })) : undefined,
    };

    pendingTempIdsRef.current.add(tempId);
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), m] }));

    // Send via WebSocket for real-time delivery
    wsSendMessage(content, undefined, targetUsers.map(u => u.id));
    setTargetUsers([]);

    // Fallback: if WS doesn't echo back in 8 seconds, remove from pending
    setTimeout(() => {
      pendingTempIdsRef.current.delete(tempId);
    }, 8000);
  };

  // ── Typing indicator logic ────────────────────────────────────────────────

  const handleDraftChange = (value: string) => {
    setDraft(value);

    // ── @mention detection (group rooms only) ────────────────────────────
    if (active?.type === "group" && roomParticipants.length > 0) {
      const cursorPos = textareaRef.current?.selectionStart || value.length;
      const textBeforeCursor = value.slice(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
        // Only trigger if @ is at start or preceded by whitespace
        if (atIndex === 0 || charBeforeAt === " " || charBeforeAt === "\n") {
          const query = textBeforeCursor.slice(atIndex + 1);
          // Don't trigger if there's a space in the query (user moved past the mention)
          if (!query.includes(" ")) {
            setMentionQuery(query);
            setMentionCursorPos(atIndex);
            setShowMentionPopover(true);
          } else {
            setShowMentionPopover(false);
          }
        } else {
          setShowMentionPopover(false);
        }
      } else {
        setShowMentionPopover(false);
      }
    } else {
      setShowMentionPopover(false);
    }

    // ── Typing indicator logic (unchanged) ───────────────────────────────
    if (!isConnected || !activeId) return;

    if (value.trim()) {
      const now = Date.now();

      // Debounce: only send typing_start every TYPING_SEND_INTERVAL ms
      if (now - lastTypingSentRef.current > TYPING_SEND_INTERVAL) {
        wsStartTyping();
        lastTypingSentRef.current = now;
        isTypingActiveRef.current = true;
      }

      // Reset the stop timer
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
      typingStopTimerRef.current = setTimeout(() => {
        if (isTypingActiveRef.current) {
          wsStopTyping();
          isTypingActiveRef.current = false;
        }
      }, TYPING_STOP_DELAY);
    } else {
      // Input is empty — stop typing immediately
      if (isTypingActiveRef.current) {
        wsStopTyping();
        isTypingActiveRef.current = false;
      }
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
    }
  };

  // Clean up typing timers on unmount
  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
    };
  }, []);

  // Clear typing users when switching rooms
  useEffect(() => {
    setTypingUsers(new Map());
  }, [activeId]);

  // ── @mention selection handler ────────────────────────────────────────────

  const handleSelectMention = useCallback((participant: RoomParticipant) => {
    // Remove the @query text from the draft
    const beforeAt = draft.slice(0, mentionCursorPos);
    const afterQuery = draft.slice(mentionCursorPos + 1 + mentionQuery.length);
    setDraft(`${beforeAt}${afterQuery}`.trimStart());

    setTargetUsers(prev => {
      if (prev.some(u => u.id === participant.id)) return prev;
      return [...prev, participant];
    });
    
    setShowMentionPopover(false);
    setMentionQuery("");

    // Re-focus the textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [draft, mentionCursorPos, mentionQuery]);

  // ── Filtered faculty list for @mention popover ────────────────────────────

  const filteredMentionUsers = useMemo(() => {
    if (!mentionQuery) return roomParticipants;
    const q = mentionQuery.toLowerCase();
    return roomParticipants.filter(p =>
      p.full_name.toLowerCase().includes(q)
    );
  }, [roomParticipants, mentionQuery]);

  // ── Edit message handlers ─────────────────────────────────────────────────

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessage(msg.id);
    setEditContent(msg.content);
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editContent.trim()) return;
    wsEditMessage(editingMessage, editContent.trim());
    setEditingMessage(null);
    setEditContent("");
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  // ── Delete message handler ────────────────────────────────────────────────

  const handleDelete = (messageId: string) => {
    wsDeleteMessage(messageId);
    setContextMenu(null);
  };

  // ── Context menu handler ──────────────────────────────────────────────────

  const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    // Only show for own messages that aren't deleted
    if (msg.senderId !== user?.id || msg.isDeleted) return;
    e.preventDefault();
    setContextMenu({ messageId: msg.id, x: e.clientX, y: e.clientY });
  };

  // ── Typing indicator text ─────────────────────────────────────────────────

  const typingText = useMemo(() => {
    const users = Array.from(typingUsers.values());
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].fullName} is typing`;
    if (users.length === 2) return `${users[0].fullName} and ${users[1].fullName} are typing`;
    return `${users[0].fullName} and ${users.length - 1} others are typing`;
  }, [typingUsers]);



  const isFaculty = user?.role === "faculty";
  const isStudentOrParent = user?.role === "student" || user?.role === "parent" || user?.role === "parents";

  return (
    <div>
      <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[85vh]">
        {/* ── Room List ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <Input placeholder="Search conversations" value={search} onChange={e => setSearch(e.target.value)} />
            <Button size="sm" className="w-full"
              disabled={isStudentOrParent}
              title={isStudentOrParent ? "Only admins available" : ""}
              onClick={() => setIsModalOpen(true)}>
              + New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hidden ">
            {channels.length === 0 ? <EmptyState icon={MessageSquare} title="No conversations" /> : channels.map((c) => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-3 border-b border-border hover:bg-muted/30 transition-colors ${activeId === c.id ? "bg-primary-light/40" : ""}`}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9">
                    {c.avatarUrl ? (
                      <AvatarImage src={c.avatarUrl} alt={c.name || "Chat"} />
                    ) : null}
                    <AvatarFallback className="bg-navy text-white text-xs">{(c.name || "DM")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate text-sm">{c.name || "Direct Message"}</span>
                      {c.unreadCount > 0 && (
                        <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                          <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5">{c.unreadCount}</Badge>
                        </motion.span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {c.lastMessage ? (
                        <>
                          <span className="font-medium">{c.lastMessage.senderName ? `${c.lastMessage.senderName}: ` : ""}</span>
                          <span className="truncate">{c.lastMessage.content}</span>
                        </>
                      ) : (
                        <span className="italic">No messages yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat Thread ───────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          {active ? (
            showDetails ? (
              <RoomDetails roomId={active.id} onBack={() => setShowDetails(false)} />
            ) : (
              <>
                {/* ── Header ─────────────────────────────────────────────── */}
              <div className="p-3 border-b border-border flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {active.avatarUrl ? (
                    <AvatarImage src={active.avatarUrl} alt={active.name || "Chat"} />
                  ) : null}
                  <AvatarFallback className="bg-navy text-white text-xs">{(active.name || "D")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-heading font-semibold text-sm">{active.name || "Direct Message"}</div>
                  {typingText ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-primary flex items-center gap-1"
                    >
                      <span>{typingText}</span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      >
                        ...
                      </motion.span>
                    </motion.div>
                  ) : (
                    <div className="text-xs text-muted-foreground">{active.type === "group" ? "Group" : "Direct Message"}</div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setShowDetails(true)} aria-label="Room details">
                  <Info className="w-5 h-5" />
                </Button>
              </div>

              {/* ── Messages ───────────────────────────────────────────── */}
              {isLoadingMessages ? (
                <div className="flex-1 overflow-y-auto bg-[#efeae2] dark:bg-[#0b141a] scrollbar-hidden flex flex-col justify-end">
                  <ChatSkeleton />
                </div>
              ) : (
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-[#efeae2] dark:bg-[#0b141a] scrollbar-hidden">
                  <AnimatePresence key={activeId} initial={false}>
                  {msgs.map((m, idx) => {
                    const own = m.senderId === user?.id;
                    const isEditing = editingMessage === m.id;
                    const isFirstInGroup = idx === 0 || msgs[idx - 1].senderId !== m.senderId;
                    const isLastInGroup = idx === msgs.length - 1 || msgs[idx + 1].senderId !== m.senderId;
                    const isPrivateMsg = !!m.targets && m.targets.length > 0;

                    return (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${own ? "justify-end" : "justify-start"} ${isLastInGroup ? "mb-3" : "mb-0.5"}`}
                        onContextMenu={(e) => handleContextMenu(e, m)}
                      >
                        {!own && (
                          <div className="w-7 flex-shrink-0 flex items-end">
                            {isLastInGroup && (
                              <Avatar className="w-7 h-7 shadow-sm">
                                {m.senderAvatar ? <AvatarImage src={m.senderAvatar} /> : null}
                                <AvatarFallback className="bg-primary/20 text-xs">
                                  {m.senderName[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                        <div className={`max-w-[75%] px-3 py-1.5 text-sm relative group shadow-sm break-words ${
                          m.isDeleted
                            ? "bg-muted/50 border border-border italic text-muted-foreground rounded-2xl"
                            : isPrivateMsg
                              ? own
                                ? `bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 border-l-2 border-amber-400 dark:border-amber-600 rounded-2xl ${isFirstInGroup ? 'rounded-tr-sm' : ''}`
                                : `bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 border-l-2 border-amber-400 dark:border-amber-600 rounded-2xl ${isFirstInGroup ? 'rounded-tl-sm' : ''}`
                              : own
                                ? `bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl ${isFirstInGroup ? 'rounded-tr-sm' : ''}`
                                : `bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl ${isFirstInGroup ? 'rounded-tl-sm' : ''}`
                        }`}>
                          {/* Private message badge */}
                          {isPrivateMsg && !m.isDeleted && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>
                                {own ? `Private to ${m.targets!.map(t => t.full_name).join(", ")}` : `Private from ${m.senderName}`}
                              </span>
                            </div>
                          )}
                          {!own && !m.isDeleted && isFirstInGroup && !isPrivateMsg && (
                            <div className="text-[11px] font-bold mb-0.5 text-primary opacity-80">{m.senderName}</div>
                          )}
                          {!own && !m.isDeleted && isFirstInGroup && isPrivateMsg && (
                            <div className="text-[11px] font-bold mb-0.5 text-amber-700 dark:text-amber-300 opacity-80">{m.senderName}</div>
                          )}

                          {/* Edit mode */}
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                                rows={2}
                                className="resize-none text-sm bg-background/50 text-foreground min-h-0"
                                autoFocus
                              />
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}
                                  className="h-6 px-2 text-[11px]">
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveEdit}
                                  className="h-6 px-2 text-[11px]"
                                  disabled={!editContent.trim()}>
                                  <Check className="w-3 h-3 mr-1" /> Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {m.isDeleted ? (
                                <div>🚫 This message was deleted</div>
                              ) : (
                                <div className="space-y-2">
                                  {m.fileUrl && (
                                    m.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                      <a href={m.fileUrl} target="_blank" rel="noreferrer" className="block w-full max-w-[240px] rounded-md overflow-hidden border border-border mt-1 relative group cursor-pointer">
                                        <img src={m.fileUrl} alt={m.fileName} className="w-full h-auto object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Download className="w-6 h-6 text-white" />
                                        </div>
                                      </a>
                                    ) : (
                                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${own ? 'border-primary-foreground/20 bg-primary-foreground/10' : 'border-border bg-background/50'}`}>
                                        <div className={`p-2 rounded-md ${own ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{m.fileName || 'Attachment'}</p>
                                          {m.fileSize && (
                                            <p className="text-xs opacity-70">{(m.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                          )}
                                        </div>
                                        <a href={m.fileUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-black/10 rounded-full transition-colors" title="Download">
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </div>
                                    )
                                  )}
                                  {m.content && <div>{m.content}</div>}
                                </div>
                              )}
                              <div className="text-[10px] mt-1.5 opacity-70 flex items-center gap-1 justify-end">
                                {/* {m.isEdited && !m.isDeleted && (
                                  <span className="italic mr-1">edited</span>
                                )} */}
                                <span className="opacity-80">
                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {own && !m.isDeleted && (
                                  m.status === "read"
                                    ? <CheckCheck className="w-[14px] h-[14px] text-blue-500" />
                                    : m.status === "delivered"
                                      ? <CheckCheck className="w-[14px] h-[14px] opacity-70" />
                                      : <Check className="w-[14px] h-[14px] opacity-70" />
                                )}
                              </div>
                            </>
                          )}

                          {/* Hover action buttons for own messages */}
                          {own && !m.isDeleted && !isEditing && !m.id.startsWith("temp-") && (
                            <div className="absolute -top-3 right-1 hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-sm px-1 py-0.5">
                              <button
                                onClick={() => handleStartEdit(m)}
                                className="p-1 rounded hover:bg-muted/60 transition-colors"
                                title="Edit message"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="p-1 rounded hover:bg-destructive/10 transition-colors"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* ── Typing indicator below messages ──────────────────── */}
                <AnimatePresence>
                  {typingText && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex justify-start"
                    >
                      <div className="bg-card border border-border rounded-2xl px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex gap-0.5">
                            <motion.span
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                              className="w-1.5 h-1.5 bg-muted-foreground rounded-full inline-block"
                            />
                            <motion.span
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                              className="w-1.5 h-1.5 bg-muted-foreground rounded-full inline-block"
                            />
                            <motion.span
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                              className="w-1.5 h-1.5 bg-muted-foreground rounded-full inline-block"
                            />
                          </div>
                          <span className="text-xs">{typingText}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              )}

              {/* ── Input area ─────────────────────────────────────────── */}
              <div className="p-3 border-t border-border flex flex-col gap-2">
                {/* Target user chips */}
                {targetUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {targetUsers.map(tu => (
                        <motion.div
                          key={tu.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-amber-800 dark:text-amber-200">
                            <strong>{tu.full_name}</strong>
                          </span>
                          <button
                            onClick={() => setTargetUsers(prev => prev.filter(u => u.id !== tu.id))}
                            className="ml-1 p-0.5 rounded-full hover:bg-amber-200/50 dark:hover:bg-amber-800/50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {selectedFile && (
                  <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-background rounded-md shadow-sm border border-border">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                        <span className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => setSelectedFile(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <div className="relative flex items-end gap-2">
                  {/* @Mention popover */}
                  <AnimatePresence>
                    {showMentionPopover && filteredMentionUsers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute bottom-full left-0 mb-2 w-64 max-h-80 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg z-50 scrollbar-hidden"
                      >
                        <div className="p-1.5 ">
                          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Send privately to
                          </div>
                          {filteredMentionUsers.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleSelectMention(p)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors text-left"
                            >
                              <Avatar className="w-6 h-6">
                                {p.avatar_url ? <AvatarImage src={p.avatar_url} /> : null}
                                <AvatarFallback className="text-[10px] bg-primary/20">
                                  {p.full_name[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{p.full_name}</div>
                                {p.role && (
                                  <div className="text-[10px] text-muted-foreground capitalize">{p.role.replace("_", " ")}</div>
                                )}
                              </div>
                              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} aria-label="Attach file" className={selectedFile ? "text-primary bg-primary/10" : ""}>
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Textarea ref={textareaRef} value={draft} onChange={e => handleDraftChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                      if (e.key === "Escape" && showMentionPopover) { setShowMentionPopover(false); }
                    }}
                    placeholder={targetUsers.length > 0 ? `Private message to ${targetUsers.length} selected...` : selectedFile ? "Add a caption..." : active?.type === "group" ? "Type a message... (@ to mention faculty private msg)" : "Type a message..."} 
                    rows={1} className="resize-none min-h-10 py-2.5 bg-surface" />
                  <Button onClick={send} disabled={(!draft.trim() && !selectedFile) || isUploading} aria-label="Send" className="h-10 px-4">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg">Welcome to Messages</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Select a conversation from the left or create a new one to start chatting.
                </p>
                <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)} className="mt-2">
                  + New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Context Menu ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2"
              onClick={() => {
                const msg = msgs.find(m => m.id === contextMenu.messageId);
                if (msg) handleStartEdit(msg);
              }}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
              onClick={() => handleDelete(contextMenu.messageId)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateChatModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={(room) => {
          fetchRooms();
          if (room && room.id) {
            setActiveId(room.id);
          }
        }}
      />
    </div>
  );
}