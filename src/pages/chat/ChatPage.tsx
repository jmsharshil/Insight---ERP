import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, MessageSquare, Check, CheckCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { CHAT_MESSAGES, type ChatMessage } from "@/constants/dummy/chat";
import { ChatAction } from "@/redux/actions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setRooms, setRoomsLoading, setRoomsError } from "@/redux/slices/chatSlice";
import { useUI } from "@/hooks/useUI";
import CreateChatModal from "./CreateChatModal";

export default function ChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { rooms, loading } = useAppSelector((state) => state.chat);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const { setPageTitle } = useUI();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize active room once rooms are loaded
  useEffect(() => {
    if (rooms && rooms.length > 0 && !activeId) {
      setActiveId(rooms[0].id);
    }
  }, [rooms, activeId]);

  const channels = rooms.filter((c) =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase()),
  );
  const active = rooms.find((c) => c.id === activeId);
  const msgs = activeId ? (messages[activeId] || []) : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeId, msgs.length]);

  useEffect(() => {
    setPageTitle("Messages");
  }, [setPageTitle]);

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
          let name = room.name;
          if (!name && room.room_type === "direct") {
            const otherParticipant = room.participants?.find((p: any) => p.id !== user?.id);
            name = otherParticipant ? otherParticipant.full_name : "Direct Message";
          }
          return {
            id: room.id,
            type: room.room_type || "direct",
            name: name || "Conversation",
            participants: room.participants?.map((p: any) => p.full_name) || [],
            unreadCount: room.unread_count || 0,
            batch: room.batch,
            lastMessage: room.last_message ? {
              id: room.last_message.id,
              channelId: room.id,
              senderId: room.last_message.sender,
              senderName: room.last_message.sender_name,
              content: room.last_message.content,
              type: room.last_message.type || "text",
              timestamp: room.last_message.created_at,
              readBy: [],
              status: "read"
            } : undefined
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

  useEffect(() => {
    if (activeId) {
      dispatch({
        type: "GET_CHAT_MESSAGES",
        method: "GET",
        endPoint: `/api/v1/chat/rooms/${activeId}/messages/`,
        auth: true,
        getResponse: (res: any) => {
          const fetchedMessages = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.results) ? res.data.results : [];
          const mappedMsgs = fetchedMessages.map((m: any) => ({
            id: m.id,
            channelId: activeId,
            senderId: m.sender || m.sender_id,
            senderName: m.sender_name || (m.sender === user?.id ? "You" : "Unknown"),
            content: m.content,
            type: "text",
            timestamp: m.created_at || m.timestamp || new Date().toISOString(),
            readBy: [],
            status: "read",
          })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          setMessages(prev => ({ ...prev, [activeId]: mappedMsgs }));
        },
        getError: (err: any) => {
          console.error("Failed to fetch messages", err);
        }
      });
    }
  }, [activeId, dispatch, user?.id]);

  const send = () => {
    if (!draft.trim() || !activeId) return;
    const content = draft.trim();
    setDraft("");
    
    const tempId = `${activeId}-NEW-${Date.now()}`;
    const m: ChatMessage = {
      id: tempId,
      channelId: activeId,
      senderId: user?.id || "u010",
      senderName: user?.name || "You",
      content: content,
      type: "text",
      timestamp: new Date().toISOString(),
      readBy: [user?.id || "u010"],
      status: "sent",
    };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), m] }));

    dispatch({
      type: "SEND_CHAT_MESSAGE",
      method: "POST",
      endPoint: `/api/v1/chat/rooms/${activeId}/messages/`,
      auth: true,
      body: { content },
      getResponse: (res: any) => {
        const realMsg = res?.data || res;
        setMessages(prev => {
           const channelMsgs = prev[activeId] || [];
           return {
             ...prev,
             [activeId]: channelMsgs.map(msg => msg.id === tempId ? {
                ...msg, 
                id: realMsg.id || tempId, 
                status: "read",
                timestamp: realMsg.created_at || realMsg.timestamp || msg.timestamp 
             } : msg)
           };
        });
      },
      getError: (err: any) => {
        toast.error("Failed to send message");
        setMessages(prev => ({
           ...prev,
           [activeId]: (prev[activeId] || []).filter(msg => msg.id !== tempId)
        }));
      }
    });
  };

  const isFaculty = user?.role === "faculty";
  const isStudentOrParent = user?.role === "student" || user?.role === "parent";

  return (
    <div>
      <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[85vh]">
        {/* List */}
        <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <Input placeholder="Search conversations" value={search} onChange={e => setSearch(e.target.value)} />
            <Button size="sm" className="w-full"
              disabled={isFaculty}
              title={isFaculty ? "Faculty can only participate in group channels" : isStudentOrParent ? "Only admins available" : ""}
              onClick={() => setIsModalOpen(true)}>
              + New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {channels.length === 0 ? <EmptyState icon={MessageSquare} title="No conversations" /> : channels.map((c) => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-3 border-b border-border hover:bg-muted/30 transition-colors ${activeId === c.id ? "bg-primary-light/40" : ""}`}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9"><AvatarFallback className="bg-navy text-white text-xs">{(c.name || "DM")[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate text-sm">{c.name || `Direct: ${c.participants?.join(", ") || ""}`}</span>
                      {c.unreadCount > 0 && (
                        <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                          <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5">{c.unreadCount}</Badge>
                        </motion.span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage?.content}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          {active ? (
            <>
              <div className="p-3 border-b border-border flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-navy text-white text-xs">{(active.name || "D")[0]}</AvatarFallback></Avatar>
                <div>
                  <div className="font-heading font-semibold text-sm">{active.name || "Direct Message"}</div>
                  <div className="text-xs text-success">● Online</div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface/50">
                <AnimatePresence initial={false}>
                  {msgs.map((m) => {
                    const own = m.senderId === user?.id;
                    return (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${own ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${own ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                          {!own && <div className="text-[10px] font-semibold mb-0.5 opacity-70">{m.senderName}</div>}
                          <div>{m.content}</div>
                          <div className="text-[10px] mt-1 opacity-70 flex items-center gap-1 justify-end">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {own && (m.status === "read" ? <CheckCheck className="w-3 h-3 text-blue-300" /> : m.status === "delivered" ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="p-3 border-t border-border flex gap-2 items-end">
                <Button variant="ghost" size="icon" onClick={() => toast.info("File attached. Max 10MB.")} aria-label="Attach file">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Textarea value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message..." rows={1} className="resize-none min-h-9" />
                <Button onClick={send} disabled={!draft.trim()} aria-label="Send">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <EmptyState icon={MessageSquare} title="No active chat" description="Select a conversation to start messaging." />
            </div>
          )}
        </div>
      </div>
      <CreateChatModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={(room) => {
          // Re-fetch rooms to update the list
          fetchRooms();
          if (room && room.id) {
            setActiveId(room.id);
          }
        }}
      />
    </div>
  );
}
