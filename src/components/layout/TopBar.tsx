import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MessageSquare, Menu, Building2, LogOut, User, Settings, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/useToast";
import RoleBadge from "@/components/common/RoleBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import GlobalSearch from "@/components/common/GlobalSearch";
import { NOTIFICATIONS } from "@/constants/dummy/notifications";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { pageTitle, toggleMobileSidebar } = useUI();
  const navigate = useNavigate();
  const toast = useToast();
  const unread = NOTIFICATIONS.filter((n) => !n.isRead).length;
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("Signed out successfully");
    navigate("/login");
  };

  return (
    <>
      <GlobalSearch />
      <header className="h-16 bg-card border-b border-border flex items-center px-4 md:px-6 sticky top-0 z-30">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden mr-3 rounded-md p-2 hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="font-heading font-semibold text-lg text-text-primary truncate">{pageTitle}</h2>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              const evt = new KeyboardEvent("keydown", { key: "k", metaKey: true });
              window.dispatchEvent(evt);
            }}
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70 text-sm text-muted-foreground"
            aria-label="Global search"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="ml-2 text-[10px] bg-card border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </button>

          {user?.role === "super_admin" && (
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light text-primary-dark text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" /> All Branches
            </div>
          )}

          <Button variant="ghost" size="icon" className="relative" aria-label="Messages" onClick={() => navigate("/chat")}>
            <MessageSquare className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground border-0">
              2
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <motion.span animate={unread > 0 ? { rotate: [0, -8, 8, -6, 6, 0] } : {}} transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6 }}>
                  <Bell className="w-5 h-5" />
                </motion.span>
                {unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-destructive text-white border-0">
                    {unread}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Recent Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NOTIFICATIONS.slice(0, 5).map((n) => (
                <DropdownMenuItem key={n.id} onClick={() => n.actionUrl && navigate(n.actionUrl)} className="flex-col items-start gap-0.5">
                  <span className="font-medium text-sm">{n.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{n.body}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/notifications")} className="justify-center text-primary-dark font-medium">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary/30">
                    <AvatarImage
                      src={
                        user.profile_pic
                          ? (user.profile_pic.startsWith("http") ? user.profile_pic : import.meta.env.VITE_APP_BASE_URL + user.profile_pic)
                          : undefined
                      }
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-sidebar text-white text-xs font-bold">
                      {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                    <RoleBadge role={user.role} className="mt-1 self-start" />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}><User className="w-4 h-4 mr-2" /> My Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
        title="Sign out"
        description="Are you sure you want to sign out? You'll need to log in again to access your account."
        variant="danger"
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
      />
    </>
  );
}
