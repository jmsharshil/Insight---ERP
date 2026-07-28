import { useEffect } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import StatCard from "@/components/common/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { greeting } from "@/lib/utils";

export interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "up" | "down" | "neutral" | "warning";
  link?: string;
}

interface DashboardLayoutProps {
  pageTitle: string;
  stats: StatItem[];
  children?: React.ReactNode;
}

export default function DashboardLayout({ pageTitle, stats, children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const { setPageTitle } = useUI();

  useEffect(() => {
    setPageTitle(pageTitle);
  }, [pageTitle, setPageTitle]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-text-primary tracking-tight">
          {greeting()}, {user?.name.split(" ")[0]} 👋
        </h1>
        {/* <p className="text-sm text-muted-foreground mt-1">
          Here's what's happening today at <span className="font-medium text-text-primary">{user?.branch_name}</span>.
        </p> */}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {children}
    </div>
  );
}
