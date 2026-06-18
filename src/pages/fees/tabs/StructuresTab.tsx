import { motion } from "framer-motion";
import { Pencil, Trash2, BookOpen, GraduationCap, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type FeesStructure } from "@/redux/slices/feesSlice";
import { StructuresSkeleton } from "@/components/common/Skeletons";

interface StructuresTabProps {
  feeStructure: FeesStructure[];
  loading?: boolean;
  viewLoadingId?: string | null;
  handleCardClick?: (id: string) => void;
  isAccountant: boolean;
  isAdmin: boolean;
  setEditingStructure: (fs: FeesStructure) => void;
  setDeleteOpen: (fs: FeesStructure) => void;
}

export default function StructuresTab({
  feeStructure,
  loading,
  viewLoadingId,
  handleCardClick,
  isAccountant,
  isAdmin,
  setEditingStructure,
  setDeleteOpen,
}: StructuresTabProps) {
  if (loading) {
    return <StructuresSkeleton />;
  }

  if (feeStructure?.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
        No fee structures created yet. Click &quot;Create Fee Structure&quot; to begin.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {feeStructure.map((fs: any) => (
        <motion.div
          key={fs.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleCardClick?.(fs.id)}
          className={cn(
            "relative bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between",
            handleCardClick && "cursor-pointer",
          )}
        >
          {viewLoadingId === fs.id && (
            <div className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center backdrop-blur-[1px] z-10">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          )}
          <div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-heading font-semibold text-lg text-card-foreground leading-snug pr-2">
                {fs.name}
              </h3>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap",
                  fs.is_active !== false
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-muted text-muted-foreground border-muted-foreground/20"
                )}
              >
                {fs.is_active !== false ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-2.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">Course:</span>
                <span className="text-card-foreground font-semibold truncate">
                  {fs.course_name || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">Level:</span>
                <span className="text-card-foreground font-semibold truncate">
                  {fs.level_name || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">Created:</span>
                <span className="text-card-foreground">
                  {formatDate(fs.created_at)}
                </span>
              </div>
            </div>

            <div className="border-t pt-3.5 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-card-foreground">Total Fee</span>
                <span className="font-mono text-primary text-lg font-bold">
                  {formatCurrency(Number(fs.total_amount))}
                </span>
              </div>
            </div>
          </div>

          {(isAccountant || isAdmin) && (
            <div className="flex gap-2.5 border-t pt-3.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingStructure(fs);
                }}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteOpen(fs);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
