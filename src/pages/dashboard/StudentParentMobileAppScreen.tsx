import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Smartphone,
  Calendar,
  CheckCircle2,
  Wallet,
  GraduationCap,
  LogOut,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.jmsinsight.app&hl=en_IN";
export const APP_STORE_URL =
  "https://apps.apple.com/us/app/insight-institute/id6780808050";

const QR_CODE_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" +
  encodeURIComponent(PLAY_STORE_URL);

export default function StudentParentMobileAppScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const isParent = user?.role === "parents" || user?.role === "parent";
  const roleLabel = isParent ? "Parent Portal" : "Student Portal";

  const handleLogout = () => {
    logout();
    toast.info("Signed out successfully");
    navigate("/login");
  };

  const handleOpenStore = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background ambient gradient glow effects */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[450px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ─── Top Header Navigation Bar ───────────────────────────────── */}
      <header className="relative z-20 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="JMS Insight Logo" className="h-9 w-auto object-contain" />
          <div className="hidden sm:block h-6 w-px bg-white/15" />
          <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
            JMS Insight Institute
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-white truncate max-w-[180px]">
              {user?.name || "Welcome"}
            </span>
            <span className="text-[11px] text-slate-400">
              {roleLabel} {(user as any)?.phone_number ? `• ${(user as any).phone_number}` : ""}
            </span>
          </div>

          <Badge className="bg-primary/20 text-primary-light border-primary/30 text-xs px-2.5 py-1 font-semibold capitalize">
            {isParent ? "Parent" : "Student"}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogoutDialog(true)}
            className="border-white/15 bg-white/5 hover:bg-white/10 text-white hover:text-white text-xs h-8 px-3 gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* ─── Main Screen Content ─────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="max-w-4xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden"
          >
            {/* Inner accent ring */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/15 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="text-center max-w-2xl mx-auto space-y-4">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-light text-xs font-semibold tracking-wide uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mobile-First Portal Experience</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tight leading-tight">
                Please Download the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-blue-400 to-indigo-300">JMS Insight</span> Mobile App
              </h1>

              {/* Explanatory Subtitle */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Welcome to Insight! For students and parents, all services—including <strong className="text-white font-semibold">live attendance tracking</strong>, <strong className="text-white font-semibold">lecture timetables</strong>, <strong className="text-white font-semibold">fee receipts</strong>, and <strong className="text-white font-semibold">exam results</strong>—are exclusively accessible via our official mobile application.
              </p>
            </div>

            {/* ─── App Store Download Buttons ───────────────────────── */}
            <div className="mt-8 sm:mt-10 max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Google Play Button */}
                <button
                  type="button"
                  onClick={() => handleOpenStore(PLAY_STORE_URL)}
                  className="flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white rounded-2xl px-5 py-3.5 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-xl hover:shadow-2xl group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-9 h-9 mr-3.5 shrink-0 transition-transform group-hover:scale-105"
                  >
                    <path fill="#34A853" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                    <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256-256L47 0z" />
                    <path fill="#FBBC04" d="M425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
                    <path fill="#EA4335" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                  </svg>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] leading-none font-medium uppercase text-zinc-400">
                      GET IT ON
                    </span>
                    <span className="text-[19px] font-bold leading-tight mt-0.5 tracking-tight text-white">
                      Google Play
                    </span>
                  </div>
                </button>

                {/* Apple App Store Button */}
                <button
                  type="button"
                  onClick={() => handleOpenStore(APP_STORE_URL)}
                  className="flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white rounded-2xl px-5 py-3.5 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-xl hover:shadow-2xl group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                    className="w-9 h-9 mr-3.5 shrink-0 fill-white transition-transform group-hover:scale-105"
                  >
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] leading-none font-medium text-zinc-400">
                      Download on the
                    </span>
                    <span className="text-[19px] font-bold leading-tight mt-0.5 tracking-tight text-white">
                      App Store
                    </span>
                  </div>
                </button>
              </div>

              {/* QR Code toggle action */}
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowQrCode((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5"
                >
                  <QrCode className="w-3.5 h-3.5 text-primary-light" />
                  <span>{showQrCode ? "Hide QR Code" : "Scan QR Code on Phone"}</span>
                </button>
              </div>

              {/* Collapsible QR Code Scanner */}
              {showQrCode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center space-y-2"
                >
                  <div className="bg-white p-2.5 rounded-xl shadow-lg">
                    <img
                      src={QR_CODE_URL}
                      alt="JMS Insight App Play Store QR Code"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Open your smartphone camera and scan to open Google Play Store.
                  </p>
                </motion.div>
              )}
            </div>

            {/* ─── Key Features Grid ───────────────────────────────── */}
            <div className="mt-10 pt-8 border-t border-white/10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-5">
                Features Available in Your Mobile App
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white">Daily Timetable</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Live batch lectures, room numbers & faculty details.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white">Attendance Alerts</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Real-time punch records and attendance percentage.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white">Fees & Receipts</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Payment history, remaining dues, and downloadable invoices.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white">Results & Rank</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Subject marks, test series percentiles & exam reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Help & Security Note ────────────────────────────── */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sign in on mobile using the same login credentials provided during admission.</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowLogoutDialog(true)}
                  className="text-primary-light hover:text-white p-0 h-auto text-xs"
                >
                  Switch Account / Sign Out
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="relative z-20 py-4 px-6 text-center text-xs text-slate-500 border-t border-white/5">
        &copy; {new Date().getFullYear()} JMS Insight Institute · Official Student & Parent Mobile App Portal
      </footer>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Sign Out"
        description="Are you sure you want to sign out from your account?"
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        onConfirm={handleLogout}
        variant="danger"
      />
    </div>
  );
}
