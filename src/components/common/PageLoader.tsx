import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface">
      <motion.div
        initial={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-4"
      >
        <img src={logo} alt="Insight" className="h-16 w-auto" />
        <span className="text-sm text-muted-foreground font-medium tracking-wide">Loading...</span>
      </motion.div>
    </div>
  );
}
