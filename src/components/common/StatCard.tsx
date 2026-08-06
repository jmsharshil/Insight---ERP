import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import HoverValue from "./HoverValue";

interface StatCardProps {
  title: React.ReactNode;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: "up" | "down" | "neutral" | "warning";
  index?: number;
  link?: string;
  onClick?: () => void;
  iconClassName?: string;
  iconBgClassName?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendType = "neutral", index = 0, link, onClick, iconClassName, iconBgClassName }: StatCardProps) {
  const TrendIcon = trendType === "up" ? TrendingUp : trendType === "down" ? TrendingDown : Minus;
  const trendColor =
    trendType === "up" ? "text-success"
    : trendType === "down" ? "text-destructive"
    : trendType === "warning" ? "text-warning"
    : "text-muted-foreground";

  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
        <p className="mt-2 text-2xl font-heading font-bold text-text-primary truncate">
          <HoverValue value={value} />
        </p>
        {trend && (
          <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", trendColor)}>
            <TrendIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{trend}</span>
          </div>
        )}
      </div>
      <div className={cn("shrink-0 rounded-lg p-2.5", iconBgClassName || "bg-primary-light")}>
        <Icon className={cn("w-5 h-5", iconClassName || "text-primary-dark")} />
      </div>
    </div>
  );


  const isClickable = Boolean(link || onClick);

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        "rounded-xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col",
        isClickable && "cursor-pointer group"
      )}
    >
      <div className="flex-1">{content}</div>
      {isClickable && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-60 group-hover:opacity-100 transition-opacity">
          <span>View details</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </motion.div>
  );

  if (link) {
    return (
      <Link to={link} className="no-underline h-full">
        {card}
      </Link>
    );
  }

  return card;
}
