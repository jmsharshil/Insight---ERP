import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUI } from "@/hooks/useUI";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function AppShell() {
  const location = useLocation();
  const { sidebarOpen, closeMobileSidebar } = useUI();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden md:flex sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <Sheet open={sidebarOpen} onOpenChange={(o) => !o && closeMobileSidebar()}>
        <SheetContent side="left" className="p-0 w-[260px] bg-navy border-0">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
