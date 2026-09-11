import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, Pin, PinOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { ROLES } from "@/constants/roles";
import { NAV_ITEMS } from "@/constants/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import RoleBadge from "@/components/common/RoleBadge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AvatarImage } from "@radix-ui/react-avatar";

/* ─── constants ──────────────────────────────────── */
const EXPANDED_W = 260;
const COLLAPSED_W = 70;

/* ─── tooltip style (reused) ─────────────────────── */
const tooltipClass =
  "bg-gray-dark text-white border border-white/10 shadow-xl shadow-black/30 text-xs font-medium px-3 py-1.5 rounded-lg";

/* ─── component ──────────────────────────────────── */
export default function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebarCollapse, closeMobileSidebar } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // pinned = user clicked the pin button (uses Redux state)
  const pinned = !mobile && !sidebarCollapsed;

  // Keyboard shortcut to toggle sidebar (Ctrl+B / Cmd+B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebarCollapse]);

  /* ── auto-hover collapse (only when NOT pinned, desktop only) ── */
  const [hovered, setHovered] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (mobile || pinned) return;
    clearTimers();
    enterTimer.current = setTimeout(() => setHovered(true), 80);
  }, [mobile, pinned, clearTimers]);

  const handleMouseLeave = useCallback(() => {
    if (mobile || pinned) return;
    clearTimers();
    leaveTimer.current = setTimeout(() => setHovered(false), 250);
  }, [mobile, pinned, clearTimers]);

  // expanded when: mobile, pinned open, or hovered
  const expanded = mobile || pinned || hovered;
  const role = user ? ROLES[user.role as keyof typeof ROLES] : null;
  let rawModules = user?.accessible_modules || role?.modules || [];
  if (typeof rawModules === "string") {
    try {
      rawModules = JSON.parse(rawModules);
    } catch {
      rawModules = (rawModules as string).split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(rawModules)) rawModules = [];
  
  let modules = rawModules.filter((m) => m !== "support" && m !== "dashboard");
  
  // Force dashboard at the top, support at the bottom
  modules = ["dashboard", ...modules, "support"];

  const items = modules.map((m)  => ({ id: m, ...NAV_ITEMS[m as import('@/types/role.types').ModuleId] })).filter((item) => item?.label);

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
      className={cn(
        "relative flex flex-col h-full overflow-hidden select-none",
        "bg-sidebar",
        "text-white",
        "transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
      )}
    >
      <TooltipProvider delayDuration={100}>
        {/* ── ambient glow ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* ═══════ LOGO + PIN ═══════ */}
        <div className="relative z-10 flex items-center justify-between p-1 gap-3">
          <div className="flex items-center min-w-0 overflow-hidden">
            {/* collapsed: shield-only icon crop */}
            <div
              className={cn(
                "flex-shrink-0 rounded-xl bg-white shadow-lg shadow-black/20 overflow-hidden flex items-center justify-center transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                expanded ? "w-0 h-0 p-0 opacity-0" : "w-11 h-11 p-1.5 opacity-100",
              )}
            >
              {/* crop to show only the shield (left ~30% of the image) */}
              <div className="w-full h-full overflow-hidden">
                <img
                  src={logo}
                  alt="Insight"
                  className="h-full w-auto max-w-none object-cover object-left"
                />
              </div>
            </div>

            {/* expanded: full horizontal logo */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                expanded ? "opacity-100 " : "opacity-0 max-w-0",
              )}
            >
              <img
                src={logo}
                alt="Insight Institute of Professional Studies"
                className="rounded-sm"
              />
            </div>
          </div>

          {/* pin / unpin button (desktop only) */}
          {!mobile && expanded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebarCollapse}
                  className={cn(
                    "flex-shrink-0 rounded-lg p-1.5 transition-all duration-200",
                    pinned
                      ? "bg-primary/15 text-primary hover:bg-primary/25"
                      : "text-white/40 hover:text-white/70 hover:bg-white/10",
                  )}
                  aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
                >
                  {pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className={tooltipClass}>
                {pinned ? "Unpin sidebar" : "Pin sidebar open"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── gradient divider ── */}
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* ═══════ NAVIGATION ═══════ */}
        <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 scrollbar-hidden">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Tooltip key={item.id} open={expanded ? false : undefined}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    onClick={mobile ? closeMobileSidebar : undefined}
                    className="block"
                  >
                    <div
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
                        isActive
                          ? "bg-primary text-black"
                          : "text-white/55 hover:bg-[rgba(247,169,0,0.12)] hover:text-white/90",
                      )}
                    >
                      {/* active glow bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary " />
                      )}

                      {/* icon */}
                      <div className="relative flex-shrink-0">
                        <item.icon
                          className={cn(
                            "w-5 h-5 transition-colors duration-150",
                            isActive ? "text-black" : "text-gray-light group-hover:text-white/80",
                          )}
                        />
                        {isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary " />
                        )}
                      </div>

                      {/* label */}
                      <span
                        className={cn(
                          "whitespace-nowrap overflow-hidden transition-all duration-200",
                          expanded ? "opacity-100 max-w-[180px]" : "opacity-0 max-w-0",
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className={tooltipClass}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* ── gradient divider ── */}
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* ═══════ USER FOOTER ═══════ */}
        {user && (
          <div className="relative z-10 p-3">
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl p-2 transition-colors duration-200",
                expanded ? "hover:bg-white/[0.06]" : "justify-center",
              )}
            >
              {/* avatar */}
              <Tooltip open={expanded ? false : undefined}>
                <TooltipTrigger asChild>
                  <div className="relative flex-shrink-0 group cursor-default">
                    <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-primary via-primary/50 to-primary/20 opacity-60 group-hover:opacity-100 transition-opacity duration-300 blur-[1px]" />
                    <Avatar className="relative h-9 w-9 border-2 border-black/20">
                      {/* <AvatarFallback className="bg-gradient-to-br from-primary to-[#d4900a] text-navy text-xs font-bold">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback> */}
                      <AvatarImage src={user.profile_pic || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-[#d4900a] text-sidebar text-xs font-bold">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {/* online dot */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#2e3032] shadow-[0_0_6px_1px_rgba(52,211,153,0.5)]" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className={tooltipClass}>
                  {user.name}
                </TooltipContent>
              </Tooltip>

              {/* user info */}
              <div
                className={cn(
                  "flex-1 min-w-0 transition-all duration-200",
                  expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
                )}
              >
                <p className="text-sm font-semibold truncate leading-tight">{user.name}</p>
                <RoleBadge role={user.role} className="mt-1 !text-[10px] !px-2 !py-0" />
              </div>

              {/* logout */}
              {expanded && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className={tooltipClass}>
                    Sign out
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </TooltipProvider>

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={() => {
          logout();
          navigate("/login");
        }}
        title="Sign out"
        description="Are you sure you want to sign out? You'll need to log in again to access your account."
        variant="danger"
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
      />
    </aside>
  );
}
