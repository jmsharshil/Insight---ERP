import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { NOTIFICATIONS, type AppNotification } from "@/constants/dummy/notifications";

function relative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function groupByDay(notifs: AppNotification[]) {
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  return notifs.reduce((acc, n) => {
    const d = new Date(n.timestamp).toDateString();
    const key = d === today ? "Today" : d === yest ? "Yesterday" : "Earlier";
    (acc[key] = acc[key] || []).push(n);
    return acc;
  }, {} as Record<string, AppNotification[]>);
}

export default function NotificationsPage() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");
  const navigate = useNavigate();
  const toast = useToast();

  const filtered = useMemo(() => items.filter(n =>
    filter === "all" ? true : filter === "unread" ? !n.isRead : n.priority === "high",
  ), [items, filter]);

  const groups = groupByDay(filtered);

  const markAll = () => {
    setItems(rows => rows.map(r => ({ ...r, isRead: true })));
    toast.success("All notifications marked as read.");
  };
  const onClick = (n: AppNotification) => {
    setItems(rows => rows.map(r => r.id === n.id ? { ...r, isRead: true } : r));
    if (n.actionUrl) navigate(n.actionUrl);
  };

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${items.filter(n => !n.isRead).length} unread`}
        actions={
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={markAll}><CheckCheck className="w-4 h-4 mr-1.5" />Mark all read</Button>
          </div>
        }
      />
      {filtered.length === 0 ? (
        <EmptyState icon={BellOff} title="You're all caught up! 🎉" description="No notifications to show." />
      ) : (
        <div className="space-y-6">
          {["Today", "Yesterday", "Earlier"].map((day) => groups[day] && (
            <div key={day}>
              <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-2">{day}</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {groups[day].map((n, i) => (
                    <motion.button key={n.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => onClick(n)}
                      className={`w-full text-left rounded-xl border bg-card p-4 hover:shadow-md transition-shadow flex items-start gap-3
                        ${!n.isRead ? "border-l-4 border-l-primary bg-primary-light/30" : "border-border"}
                        ${n.priority === "high" ? "ring-1 ring-warning/40" : ""}`}>
                      <div className={`rounded-full p-2 ${n.priority === "high" ? "bg-warning/20" : "bg-primary-light"}`}>
                        <Bell className={`w-4 h-4 ${n.priority === "high" ? "text-warning" : "text-primary-dark"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{n.title}</span>
                          <span className="text-xs text-muted-foreground">{relative(n.timestamp)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {n.actionUrl && <Badge variant="outline" className="text-xs">View →</Badge>}
                          {n.priority === "high" && <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">High</Badge>}
                        </div>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-2" />}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
