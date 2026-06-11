import { useMemo, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { notificationActions } from "@/redux/actions";
import { setNotifications, setNotificationsLoading, markAllAsRead, markAsRead, AppNotification } from "@/redux/slices/notificationsSlice";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";

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
  const { notifications, loading } = useSelector((state: RootState) => state.notifications);
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();

  const fetchNotifications = useCallback(() => {
    dispatch({
      type: notificationActions.GET_NOTIFICATIONS,
      method: "GET",
      endPoint: `/api/auth/notifications/`,
      auth: true,
      setLoading: (val: boolean) => dispatch(setNotificationsLoading(val)),
      getResponse: (res: any) => {
        const apiData = res?.data || [];
        const mapped: AppNotification[] = apiData.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          timestamp: n.created_at,
          isRead: n.is_read,
          priority: n.data?.priority || "normal",
          actionUrl: n.data?.url || undefined,
          data: n.data
        }));
        dispatch(setNotifications(mapped));
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to load notifications";
        toast.error(msg);
      }
    });
  }, [dispatch, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = useMemo(() => notifications.filter(n =>
    filter === "all" ? true : filter === "unread" ? !n.isRead : n.priority === "high",
  ), [notifications, filter]);

  const groups = groupByDay(filtered);

  const handleMarkAll = useCallback(() => {
    dispatch({
      type: notificationActions.MARK_NOTIFICATIONS_READ,
      method: "PATCH",
      endPoint: `/api/auth/notifications/`,
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          dispatch(markAllAsRead());
          // Optional: You can silence the toast here since it's automatic, 
          // but we'll keep it as requested to show the message.
          toast.success(res.message || "All notifications marked as read.");
        } else {
          toast.error("Failed to mark notifications as read.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to mark as read";
        toast.error(msg);
      }
    });
  }, [dispatch, toast]);

  // Automatically mark all as read after 3 seconds of viewing
  useEffect(() => {
    if (!loading && notifications.some(n => !n.isRead)) {
      const timer = setTimeout(() => {
        handleMarkAll();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, notifications, handleMarkAll]);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <PageHeader title="Notifications" subtitle={loading ? "Loading..." : `${notifications.filter(n => !n.isRead).length} unread`}
        actions={
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleMarkAll} disabled={!notifications.some(n => !n.isRead)}>
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Mark all read
            </Button>
          </div>
        }
      />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-sm">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10">
          <EmptyState icon={BellOff} title="You're all caught up! 🎉" description="No notifications to show." />
        </div>
      ) : (
        <div className="space-y-6">
          {["Today", "Yesterday", "Earlier"].map((day) => groups[day] && groups[day].length > 0 && (
            <div key={day}>
              <h3 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3 px-1">{day}</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {groups[day].map((n, i) => (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      className={`w-full text-left rounded-lg border bg-card p-4 flex items-start gap-4 relative overflow-hidden group
                        ${!n.isRead ? "border-l-4 border-l-primary bg-primary/5 shadow-sm" : "border-border shadow-sm"}
                        ${n.priority === "high" ? "border-l-4 border-l-warning bg-warning/5" : ""}`}>
                      
                      <div className={`flex-shrink-0 rounded-full p-2.5 mt-0.5
                        ${n.priority === "high" ? "bg-warning/15 text-warning" : !n.isRead ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`font-semibold text-sm truncate ${!n.isRead ? "text-foreground" : "text-foreground/80"}`}>{n.title}</span>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2 whitespace-nowrap">{relative(n.timestamp)}</span>
                        </div>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${!n.isRead ? "text-muted-foreground" : "text-muted-foreground/80"}`}>{n.body}</p>
                        
                        {(n.actionUrl || n.priority === "high") && (
                          <div className="flex items-center gap-2 mt-3">
                            {n.actionUrl && (
                              <a href={n.actionUrl} className="inline-flex items-center">
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                                  View Details
                                </Badge>
                              </a>
                            )}
                            {n.priority === "high" && <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-warning text-warning">Important</Badge>}
                          </div>
                        )}
                      </div>

                      {!n.isRead && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </motion.div>
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
