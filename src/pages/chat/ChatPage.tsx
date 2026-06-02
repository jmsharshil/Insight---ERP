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
import { CHAT_CHANNELS, CHAT_MESSAGES, type ChatMessage } from "@/constants/dummy/chat";

export default function ChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeId, setActiveId] = useState(CHAT_CHANNELS[0].id);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(CHAT_MESSAGES);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const channels = CHAT_CHANNELS.filter((c) =>
    !search || (c.name || "").toLowerCase().includes(search.toLowerCase()),
  );
  const active = CHAT_CHANNELS.find((c) => c.id === activeId)!;
  const msgs = messages[activeId] || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeId, msgs.length]);

  const send = () => {
    if (!draft.trim()) return;
    const m: ChatMessage = {
      id: `${activeId}-NEW-${Date.now()}`,
      channelId: activeId,
      senderId: user?.id || "u010",
      senderName: user?.name || "You",
      content: draft,
      type: "text",
      timestamp: new Date().toISOString(),
      readBy: [user?.id || "u010"],
      status: "sent",
    };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), m] }));
    setDraft("");
  };

  const isFaculty = user?.role === "faculty";
  const isStudentOrParent = user?.role === "student" || user?.role === "parent";

  return (
    <div>
      <PageHeader title="Messages" />
      <div className="grid md:grid-cols-[280px_1fr_240px] gap-4 h-[calc(100vh-220px)]">
        {/* List */}
        <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <Input placeholder="Search conversations" value={search} onChange={e => setSearch(e.target.value)} />
            <Button size="sm" className="w-full"
              disabled={isFaculty}
              title={isFaculty ? "Faculty can only participate in group channels" : isStudentOrParent ? "Only admins available" : ""}
              onClick={() => toast.info("New chat dialog")}>
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
                      <span className="font-medium truncate text-sm">{c.name || `Direct: ${c.participants.join(", ")}`}</span>
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
        </div>

        {/* Info */}
        <div className="rounded-xl border border-border bg-card p-4 hidden md:block overflow-y-auto">
          <h3 className="font-heading font-semibold mb-2">Channel Info</h3>
          <div className="text-sm text-muted-foreground mb-3">
            {active.type === "group" ? `Group · ${active.participants.length} members` : "Direct conversation"}
          </div>
          {active.batch && <Badge className="mb-3" variant="outline">Batch: {active.batch}</Badge>}
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Members</h4>
          <div className="space-y-1.5">
            {active.participants.map((p) => (
              <div key={p} className="flex items-center gap-2 text-sm">
                <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{p.slice(-2)}</AvatarFallback></Avatar>
                <span>{p}</span>
              </div>
            ))}
          </div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-4 mb-2">Shared Files</h4>
          <p className="text-xs text-muted-foreground">No files shared yet.</p>
        </div>
      </div>
    </div>
  );
}
