import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn("rounded-xl bg-card border border-border p-5", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="font-heading font-semibold text-base text-text-primary">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}
