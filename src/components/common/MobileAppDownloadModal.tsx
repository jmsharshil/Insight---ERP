import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Smartphone,
  CheckCircle2,
  Calendar,
  Wallet,
  GraduationCap,
  Bell,
  Sparkles,
} from "lucide-react";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.jmsinsight.app&hl=en_IN";
export const APP_STORE_URL =
  "https://apps.apple.com/search?term=JMS+Insight";

interface MobileAppDownloadModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function MobileAppDownloadModal({
  forceOpen,
  onClose,
}: MobileAppDownloadModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  const isStudentOrParent =
    user?.role === "student" ||
    user?.role === "parents" ||
    user?.role === "parent";

  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
      return;
    }

    if (!isAuthenticated || !isStudentOrParent) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed in this session or for today
    const dismissedSession = sessionStorage.getItem("insight_app_prompt_dismissed");
    const dismissedDate = localStorage.getItem("insight_app_prompt_dismissed_date");
    const today = new Date().toISOString().slice(0, 10);

    if (dismissedSession === "true" || dismissedDate === today) {
      setIsOpen(false);
      return;
    }

    // Delay slightly after login so animations and page load finish cleanly
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isStudentOrParent, forceOpen]);

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("open-mobile-app-modal", handleOpenEvent);
    return () => window.removeEventListener("open-mobile-app-modal", handleOpenEvent);
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("insight_app_prompt_dismissed", "true");
    if (dontShowToday) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem("insight_app_prompt_dismissed_date", today);
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleOpenStore = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isStudentOrParent && forceOpen === undefined) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden border-border bg-card shadow-2xl">
        {/* Top Header Graphic Banner */}
        <div className="relative bg-gradient-to-br from-primary/95 via-primary-dark to-slate-900 text-primary-foreground p-6 pt-7 overflow-hidden">
          {/* Subtle background glow circles */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-accent/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 shadow-lg text-white">
              <Smartphone className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5">
                  <Sparkles className="w-3 h-3 mr-1 inline" /> Mobile App
                </Badge>
                <span className="text-xs text-white/80 font-medium">
                  {user?.role === "parents" ? "Parent Portal" : "Student Portal"}
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
                Download the JMS Insight App
              </DialogTitle>
              <DialogDescription className="text-white/85 text-xs sm:text-sm leading-relaxed">
                Stay updated on the go with real-time notifications, daily schedules, attendance, and fee receipts.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
              <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-medium text-foreground">Live Timetable & Classes</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="font-medium text-foreground">Instant Attendance Tracking</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="font-medium text-foreground">Fees & Digital Receipts</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
              <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-medium text-foreground">Exam Results & Reports</span>
            </div>
          </div>

          {/* App Store Download Action Buttons */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Available on Android & iOS
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Google Play Store Button */}
              <button
                type="button"
                onClick={() => handleOpenStore(PLAY_STORE_URL)}
                className="flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white rounded-xl px-4 py-3 border border-zinc-800 transition-all cursor-pointer shadow-md hover:shadow-lg group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="w-8 h-8 mr-3 shrink-0 transition-transform group-hover:scale-105"
                >
                  <path fill="#34A853" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                  <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256-256L47 0z" />
                  <path fill="#FBBC04" d="M425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
                  <path fill="#EA4335" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                </svg>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] leading-none font-medium uppercase text-zinc-300">
                    GET IT ON
                  </span>
                  <span className="text-[17px] font-semibold leading-tight mt-0.5 tracking-tight">
                    Google Play
                  </span>
                </div>
              </button>

              {/* Apple App Store Button */}
              <button
                type="button"
                onClick={() => handleOpenStore(APP_STORE_URL)}
                className="flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white rounded-xl px-4 py-3 border border-zinc-800 transition-all cursor-pointer shadow-md hover:shadow-lg group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                  className="w-8 h-8 mr-3 shrink-0 fill-white transition-transform group-hover:scale-105"
                >
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] leading-none font-medium text-zinc-300">
                    Download on the
                  </span>
                  <span className="text-[17px] font-semibold leading-tight mt-0.5 tracking-tight">
                    App Store
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span>Don't show again today</span>
            </label>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Continue to Web Portal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
