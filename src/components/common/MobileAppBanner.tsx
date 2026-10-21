import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAY_STORE_URL, APP_STORE_URL } from "./MobileAppDownloadModal";

interface MobileAppBannerProps {
  onOpenModal?: () => void;
}

export default function MobileAppBanner({ onOpenModal }: MobileAppBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("insight_app_banner_dismissed") === "true";
  });

  const handleDismiss = () => {
    sessionStorage.setItem("insight_app_banner_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-4 sm:p-5 shadow-xs mb-6"
      >
        {/* Decorative corner blur */}
        <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-primary text-primary-foreground shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" /> Mobile App
                </span>
                <h4 className="font-heading font-bold text-sm sm:text-base text-foreground">
                  Get the JMS Insight App on Your Phone
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Access your class timetable, live attendance, fee receipts, and instant school notices directly on Android & iOS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Google Play Quick Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer")}
              className="bg-card hover:bg-muted text-foreground border-border text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
            >
              <svg xmlns="http://www.svg.org/2000/svg" viewBox="0 0 512 512" className="w-3.5 h-3.5">
                <path fill="#34A853" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256-256L47 0z" />
                <path fill="#FBBC04" d="M425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
                <path fill="#EA4335" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
              </svg>
              Google Play
            </Button>

            {/* Apple App Store Quick Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(APP_STORE_URL, "_blank", "noopener,noreferrer")}
              className="bg-card hover:bg-muted text-foreground border-border text-xs h-8 px-3 gap-1.5 font-medium shadow-xs"
            >
              <svg xmlns="http://www.svg.org/2000/svg" viewBox="0 0 384 512" className="w-3.5 h-3.5 fill-current">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              App Store
            </Button>

            <Button
              size="sm"
              onClick={onOpenModal || (() => window.dispatchEvent(new CustomEvent("open-mobile-app-modal")))}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-3 gap-1 font-semibold shadow-xs"
            >
              Details <ArrowRight className="w-3 h-3" />
            </Button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors ml-1"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
