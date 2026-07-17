import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "up" | "down" | "neutral" | "warning";
  index?: number;
}

export default function StatCard({ title, value, icon: Icon, trend, trendType = "neutral", index = 0 }: StatCardProps) {
  const TrendIcon = trendType === "up" ? TrendingUp : trendType === "down" ? TrendingDown : Minus;
  const trendColor =
    trendType === "up" ? "text-success"
    : trendType === "down" ? "text-destructive"
    : trendType === "warning" ? "text-warning"
    : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="mt-2 text-2xl font-heading font-bold text-text-primary truncate">{value}</p>
          {trend && (
            <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", trendColor)}>
              <TrendIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{trend}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-lg bg-primary-light p-2.5">
          <Icon className="w-5 h-5 text-primary-dark" />
        </div>
      </div>
    </motion.div>
  );
}
