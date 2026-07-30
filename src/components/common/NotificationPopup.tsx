import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { axiosRequest } from "@/service/axiosRequest";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  route: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export function NotificationPopup() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const raw = localStorage.getItem("Insight_Login_Data");
        const token = raw ? JSON.parse(raw)?.access : "";
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

        const res = await axiosRequest({
          method: "GET",
          url: `${baseUrl}/api/auth/notifications/popup/`,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && res.data?.total_unread > 0) {
          setNotifications(res.data.data);
          setTotalUnread(res.data.total_unread);
          setOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch notification popup", err);
      }
    };
    
    // Slight delay to allow dashboard to mount smoothly before popping up
    const timer = setTimeout(fetchNotifications, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      try {
        const raw = localStorage.getItem("Insight_Login_Data");
        const token = raw ? JSON.parse(raw)?.access : "";
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

        await axiosRequest({
          method: "POST",
          url: `${baseUrl}/api/auth/notifications/popup/`,
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'general': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const handleNotificationClick = (route: string) => {
    if (route) {
      navigate(route);
      handleClose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col shadow-xl gap-0 rounded-xl">
        <VisuallyHidden>
          <DialogTitle>Unread Notifications</DialogTitle>
        </VisuallyHidden>

        <div className="bg-muted/40 p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-full">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Notifications</h2>
            <Badge variant="secondary" className="px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center text-[10px]">
              {totalUnread > 99 ? '99+' : totalUnread} new
            </Badge>
          </div>
        </div>

        <div className="flex-1 max-h-[60vh] overflow-y-auto bg-background p-2 space-y-1 custom-scrollbar">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif.route)}
                className={`flex gap-3 p-3 rounded-lg transition-colors ${notif.route ? 'cursor-pointer hover:bg-muted/60' : 'hover:bg-muted/40'}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getIcon(notif.notification_type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-medium text-sm text-foreground">{notif.title}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                      {format(new Date(notif.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-normal break-words">
                    {notif.body}
                  </p>
                  {notif.data?.is_targeted && (
                    <Badge variant="outline" className="mt-2 text-[9px] uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 px-1.5 py-0">
                      Targeted
                    </Badge>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="p-3 border-t border-border bg-muted/20 shrink-0">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)} className="w-full text-xs font-medium">
            Mark all as read
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
