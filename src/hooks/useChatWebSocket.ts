import { useEffect, useRef, useCallback, useState } from "react";

// ─── WebSocket Event Types ────────────────────────────────────────────────────

/** Events the CLIENT sends to the server */
export interface WSSendMessageEvent {
  type: "send_message";
  content: string;
  file_url?: string;
  file_name?: string;
  file_size?: number | null;
  target_user_ids?: string[];
  reply_to_message_id?: string;
}
export interface WSTypingStartEvent {
  type: "typing_start";
}
export interface WSTypingStopEvent {
  type: "typing_stop";
}
export interface WSMarkReadEvent {
  type: "mark_read";
  message_id: string;
}
export interface WSMarkAllReadEvent {
  type: "mark_all_read";
}
export interface WSEditMessageEvent {
  type: "edit_message";
  message_id: string;
  content: string;
}
export interface WSDeleteMessageEvent {
  type: "delete_message";
  message_id: string;
}

type WSClientEvent =
  | WSSendMessageEvent
  | WSTypingStartEvent
  | WSTypingStopEvent
  | WSMarkReadEvent
  | WSMarkAllReadEvent
  | WSEditMessageEvent
  | WSDeleteMessageEvent;

/** Events the SERVER sends to the client */
export interface WSNewMessagePayload {
  id: string;
  room_id: string;
  sender: { id: string; full_name: string; avatar_url: string };
  targets?: { id: string; full_name: string; role?: string }[] | null;
  content: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export interface WSNewMessageEvent {
  type: "new_message";
  message: WSNewMessagePayload;
}
export interface WSTypingEvent {
  type: "typing";
  user_id: string;
  full_name: string;
  is_typing: boolean;
}
export interface WSDeliveredReceiptEvent {
  type: "delivered_receipt";
  message_id: string;
  user_id: string;
  delivered_at: string;
}
export interface WSReadReceiptEvent {
  type: "read_receipt";
  message_id: string;
  user_id: string;
  read_at: string;
  unread_count?: number;
}
export interface WSUnreadUpdateEvent {
  type: "unread_update";
  unread_count: number;
  room_id: string;
  user_id: string;
}
export interface WSAllMessagesReadEvent {
  type: "all_messages_read";
  room_id: string;
}
export interface WSMessageUpdatedEvent {
  type: "message_updated";
  message_id: string;
  content: string;
}
export interface WSMessageDeletedEvent {
  type: "message_deleted";
  message_id: string;
}

type WSServerEvent =
  | WSNewMessageEvent
  | WSTypingEvent
  | WSDeliveredReceiptEvent
  | WSReadReceiptEvent
  | WSUnreadUpdateEvent
  | WSAllMessagesReadEvent
  | WSMessageUpdatedEvent
  | WSMessageDeletedEvent;

// ─── Hook Config ──────────────────────────────────────────────────────────────

export interface ChatWSHandlers {
  onNewMessage?: (data: WSNewMessageEvent) => void;
  onTyping?: (data: WSTypingEvent) => void;
  onDeliveredReceipt?: (data: WSDeliveredReceiptEvent) => void;
  onReadReceipt?: (data: WSReadReceiptEvent) => void;
  onUnreadUpdate?: (data: WSUnreadUpdateEvent) => void;
  onAllMessagesRead?: (data: WSAllMessagesReadEvent) => void;
  onMessageUpdated?: (data: WSMessageUpdatedEvent) => void;
  onMessageDeleted?: (data: WSMessageDeletedEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface ReconnectState {
  attempt: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECONNECT_BASE_DELAY = 1000;     // 1 second
const RECONNECT_MAX_DELAY = 30000;     // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 20;
const HEARTBEAT_INTERVAL = 4000;      // 4 seconds (prevent DevTunnels idle timeout)

// ─── Helper: get auth token ──────────────────────────────────────────────────

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("Insight_Login_Data");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.access || null;
  } catch {
    return null;
  }
}

// ─── Helper: build WS URL ────────────────────────────────────────────────────

function buildWSUrl(roomId: string, token: string): string {
  const baseUrl = (import.meta.env.VITE_APP_BASE_URL as string || "").trim();
  // Convert http(s) → ws(s), or use as-is if already ws
  const wsBase = baseUrl
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://")
    .replace(/\/$/, ""); // strip trailing slash

  const url = `${wsBase}/ws/chat/${roomId}/?token=${token}`;

  // console.log("[WS] Connecting to:", url.replace(/token=.*$/, "token=***"));
  
  return url;
}

// ─── The Hook ─────────────────────────────────────────────────────────────────

export function useChatWebSocket(
  roomId: string | null | undefined,
  handlers: ChatWSHandlers
) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Refs to keep mutable state across renders without re-triggering effects
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  const reconnectRef = useRef<ReconnectState>({ attempt: 0, timeoutId: null });
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentionalCloseRef = useRef(false);
  const roomIdRef = useRef(roomId);

  // Always keep handlers ref current
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Always keep roomId ref current
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // ── Heartbeat ────────────────────────────────────────────────────────────

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // ── Message dispatcher ───────────────────────────────────────────────────

  const handleMessage = useCallback((event: MessageEvent) => {
    let data: WSServerEvent;
    try {
      data = JSON.parse(event.data);
    } catch {
      console.warn("[WS] Received non-JSON message:", event.data);
      return;
    }

    const h = handlersRef.current;

    switch (data.type) {
      case "new_message":
        h.onNewMessage?.(data);
        break;
      case "typing":
        h.onTyping?.(data);
        break;
      case "delivered_receipt":
        h.onDeliveredReceipt?.(data);
        break;
      case "read_receipt":
        h.onReadReceipt?.(data);
        break;
      case "unread_update":
        h.onUnreadUpdate?.(data);
        break;
      case "all_messages_read":
        h.onAllMessagesRead?.(data);
        break;
      case "message_updated":
        h.onMessageUpdated?.(data);
        break;
      case "message_deleted":
        h.onMessageDeleted?.(data);
        break;
      default:
        // pong, or unknown events — silently ignore
        break;
    }
  }, []);

  // ── Connect / Reconnect ──────────────────────────────────────────────────

  const connect = useCallback((targetRoomId: string) => {
    // Clean up any existing connection
    if (wsRef.current) {
      intentionalCloseRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    const token = getAccessToken();
    if (!token) {
      console.error("[WS] No auth token available. Cannot connect.");
      return;
    }

    const url = buildWSUrl(targetRoomId, token);
    intentionalCloseRef.current = false;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Guard: only update state if this WS is still the active one
      if (wsRef.current !== ws) return;
      console.log(`[WS] Connected to room ${targetRoomId}`);
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectRef.current.attempt = 0;
      handlersRef.current.onConnectionChange?.(true);
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      // Guard: ignore messages from stale sockets
      if (wsRef.current !== ws) return;
      handleMessage(event);
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };

    ws.onclose = (event) => {
      console.log(`[WS] Disconnected (code: ${event.code}, reason: ${event.reason})`);

      // Guard: only update state if this WS is still the active one.
      // Without this, a stale socket's onclose can override the new connection's state.
      if (wsRef.current !== ws) {
        console.log("[WS] Ignoring onclose from stale socket");
        return;
      }

      setIsConnected(false);
      handlersRef.current.onConnectionChange?.(false);
      stopHeartbeat();

      // Only auto-reconnect if closure was NOT intentional and we're still on the same room
      if (!intentionalCloseRef.current && roomIdRef.current === targetRoomId) {
        scheduleReconnect(targetRoomId);
      }
    };
  }, [handleMessage, startHeartbeat, stopHeartbeat]);

  const scheduleReconnect = useCallback((targetRoomId: string) => {
    const state = reconnectRef.current;

    if (state.attempt >= MAX_RECONNECT_ATTEMPTS) {
      console.error("[WS] Max reconnect attempts reached. Giving up.");
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);

    // Exponential backoff with jitter
    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, state.attempt) + Math.random() * 500,
      RECONNECT_MAX_DELAY
    );

    console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${state.attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    state.timeoutId = setTimeout(() => {
      state.attempt += 1;
      // Only reconnect if we're still on the same room
      if (roomIdRef.current === targetRoomId) {
        connect(targetRoomId);
      }
    }, delay);
  }, [connect]);

  // ── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;

    if (reconnectRef.current.timeoutId) {
      clearTimeout(reconnectRef.current.timeoutId);
      reconnectRef.current.timeoutId = null;
    }
    reconnectRef.current.attempt = 0;

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsReconnecting(false);
  }, [stopHeartbeat]);

  // ── Send helper ──────────────────────────────────────────────────────────

  const send = useCallback((event: WSClientEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    } else {
      console.warn("[WS] Cannot send — socket not open. Event:", event.type);
    }
  }, []);

  // ── Typed send methods ───────────────────────────────────────────────────

  const sendMessage = useCallback((content: string, fileData?: { file_url: string, file_name: string, file_size: number | null }, targetUserIds?: string[], reply_to_message_id?: string) => {
    send({ type: "send_message", content, ...(fileData || {}), ...(targetUserIds && targetUserIds.length > 0 ? { target_user_ids: targetUserIds } : {}), ...(reply_to_message_id ? { reply_to_message_id } : {}) });
  }, [send]);

  const startTyping = useCallback(() => {
    send({ type: "typing_start" });
  }, [send]);

  const stopTyping = useCallback(() => {
    send({ type: "typing_stop" });
  }, [send]);

  const markRead = useCallback((messageId: string) => {
    send({ type: "mark_read", message_id: messageId });
  }, [send]);

  const markAllRead = useCallback(() => {
    send({ type: "mark_all_read" });
  }, [send]);

  const editMessage = useCallback((messageId: string, content: string) => {
    send({ type: "edit_message", message_id: messageId, content });
  }, [send]);

  const deleteMessage = useCallback((messageId: string) => {
    send({ type: "delete_message", message_id: messageId });
  }, [send]);

  // ── Lifecycle: connect/disconnect when roomId changes ────────────────────

  useEffect(() => {
    if (roomId) {
      connect(roomId);
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Return API ───────────────────────────────────────────────────────────

  return {
    isConnected,
    isReconnecting,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    markAllRead,
    editMessage,
    deleteMessage,
    disconnect,
  };
}
