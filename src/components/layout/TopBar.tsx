import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  MessageSquare,
  Menu,
  Building2,
  LogOut,
  User,
  Settings,
  Search,
  MessageSquareMore,
  BellRing,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

        <h2 className="font-heading font-semibold text-lg text-text-primary truncate">
          {pageTitle}
        </h2>

        <div className="ml-auto flex items-center gap-3">
          {/* Messages */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="
      relative
      rounded-full
      bg-gradient-to-br
      from-blue-500/10
      to-cyan-500/10
      hover:from-blue-500/20
      hover:to-cyan-500/20
      border border-blue-500/20
      transition-all duration-300
      hover:shadow-lg hover:shadow-blue-500/20
    "
            aria-label="Messages"
          >
            <motion.div
              animate={{
                y: [0, -2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <MessageSquareMore className="w-5 h-5 text-blue-500" />
            </motion.div>

            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/notifications")}
            className="
      relative
      rounded-full
      bg-gradient-to-br
      from-amber-500/10
      to-orange-500/10
      hover:from-amber-500/20
      hover:to-orange-500/20
      border border-amber-500/20
      transition-all duration-300
      hover:shadow-lg hover:shadow-amber-500/20
    "
            aria-label="Notifications"
          >
            {/* Pulse Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border border-amber-400"
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />

            {/* Bell Swing */}
            <motion.div
              animate={{
                rotate: [0, -12, 12, -8, 8, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatDelay: 4,
              }}
              style={{ originY: 0 }}
            >
              <BellRing className="w-5 h-5 text-amber-500" />
            </motion.div>

            <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl" />
          </Button>

          {/* Profile */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative rounded-full"
                >
                  <Avatar className="relative h-10 w-10 border-2 border-background">
                    <AvatarImage
                      src={
                        user.profile_pic
                          ? user.profile_pic.startsWith("http")
                            ? user.profile_pic
                            : import.meta.env.VITE_APP_BASE_URL + user.profile_pic
                          : undefined
                      }
                      alt={user.name}
                      className="object-cover"
                    />

                    <AvatarFallback className="bg-sidebar text-white text-xs font-bold">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Online Dot */}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                </motion.button>
              </DropdownMenuTrigger>

              {/* Existing Dropdown Content */}
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
