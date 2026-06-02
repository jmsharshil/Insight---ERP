export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "file" | "image";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: string;
  readBy: string[];
  status: "sent" | "delivered" | "read";
}

export interface ChatChannel {
  id: string;
  type: "direct" | "group";
  name?: string;
  participants: string[];
  batch?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

const SAMPLE_TEXTS = [
  "Hey, when is the next class?",
  "Don't forget the assignment due tomorrow.",
  "Sure, I'll send the notes shortly.",
  "Test results have been published.",
  "Let me check and get back.",
  "Great session today, thanks!",
  "Please review the attached PDF.",
  "Meeting at 5 PM in the staff room.",
  "Got it. Thanks for the update.",
  "Can we reschedule to next week?",
  "Yes that works for me.",
  "I'll be 5 minutes late.",
  "All sorted, please proceed.",
  "Looking into it now.",
  "Acknowledged 👍",
];

function makeMessages(channelId: string, participants: string[], count: number): ChatMessage[] {
  return Array.from({ length: count }).map((_, i) => {
    const sender = participants[i % participants.length];
    return {
      id: `${channelId}-MSG-${i + 1}`,
      channelId,
      senderId: sender,
      senderName: sender === "u010" ? "Dhruv Shah" : sender === "u012" ? "Dr. Meera Nair" : sender === "u002" ? "Priya Sharma" : "Rahul Patel",
      content: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
      type: "text",
      timestamp: new Date(Date.now() - (count - i) * 600000).toISOString(),
      readBy: participants,
      status: "read",
    };
  });
}

export const CHAT_CHANNELS: ChatChannel[] = [
  { id: "CH-001", type: "direct", participants: ["u010", "u012"], unreadCount: 2 },
  { id: "CH-002", type: "direct", participants: ["u010", "u002"], unreadCount: 0 },
  { id: "CH-003", type: "direct", participants: ["u012", "u003"], unreadCount: 1 },
  { id: "CH-004", type: "group", name: "JEE-A1 Batch", participants: ["u010", "u012", "u003", "u002"], batch: "JEE-A1", unreadCount: 5 },
  { id: "CH-005", type: "group", name: "Faculty Room", participants: ["u012", "u002", "u003"], unreadCount: 0 },
];

export const CHAT_MESSAGES: Record<string, ChatMessage[]> = Object.fromEntries(
  CHAT_CHANNELS.map((c) => [c.id, makeMessages(c.id, c.participants, 16)]),
);

CHAT_CHANNELS.forEach((c) => {
  const msgs = CHAT_MESSAGES[c.id];
  c.lastMessage = msgs[msgs.length - 1];
});
