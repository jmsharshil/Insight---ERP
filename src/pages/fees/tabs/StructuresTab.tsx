import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { type FeesStructure } from "@/redux/slices/feesSlice";

interface StructuresTabProps {
  feeStructure: FeesStructure[];
  viewLoadingId?: string | null;
  handleCardClick?: (id: string) => void;
  isAccountant: boolean;
  isAdmin: boolean;
  setEditingStructure: (fs: FeesStructure) => void;
  setDeleteOpen: (fs: FeesStructure) => void;
}

export default function StructuresTab({
  feeStructure,
  viewLoadingId,
  handleCardClick,
  isAccountant,
  isAdmin,
  setEditingStructure,
  setDeleteOpen,
}: StructuresTabProps) {
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
            handleCardClick && "cursor-pointer"
          )}
        >
          {viewLoadingId === fs.id && (
            <div className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center backdrop-blur-[1px] z-10">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          )}
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-heading font-semibold text-lg text-card-foreground leading-snug">
                {fs.name}
              </h3>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                {fs.academic_year || "2024-25"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">
              {fs.description || "No description provided."}
            </p>

            <div className="space-y-2 border-t pt-3.5 mb-4">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Tuition Fee</span>
                <span className="font-mono text-card-foreground">
                  {formatCurrency(Number(fs.tuition_fee))}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Registration Fee</span>
                <span className="font-mono text-card-foreground">
                  {formatCurrency(Number(fs.registration_fee))}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Exam Fee</span>
                <span className="font-mono text-card-foreground">
                  {formatCurrency(Number(fs.exam_fee))}
                </span>
              </div>
              {Number(fs.other_fee) > 0 && (
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Other Charges</span>
                  <span className="font-mono text-card-foreground">
                    {formatCurrency(Number(fs.other_fee))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold border-t border-dashed pt-2.5 mt-2">
                <span className="text-card-foreground">Total Fee</span>
                <span className="font-mono text-primary text-sm">
                  {formatCurrency(
                    Number(fs.tuition_fee) +
                      Number(fs.registration_fee) +
                      Number(fs.exam_fee) +
                      Number(fs.other_fee)
                  )}
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
