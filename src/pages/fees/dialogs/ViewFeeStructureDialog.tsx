import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type FeesStructure } from "@/redux/slices/feesSlice";

interface ViewFeeStructureDialogProps {
  open: boolean;
  onClose: () => void;
  structure: FeesStructure | null;
}

export function ViewFeeStructureDialog({
  open,
  onClose,
  structure,
}: ViewFeeStructureDialogProps) {
  if (!structure) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Fee Structure Details</DialogTitle>
          <DialogDescription>
            Detailed information retrieved from the server for this structure.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-3 border-y border-border my-2 text-sm">
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Status</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold border",
                structure.is_active
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-muted text-muted-foreground border-muted-foreground/20",
              )}
            >
              {structure.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex justify-between items-start pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium shrink-0">Name</span>
            <span className="font-semibold text-right max-w-[280px] break-words">
              {structure.name}
            </span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Course</span>
            <span className="font-semibold">{structure.course_name}</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Batch</span>
            <span className="font-semibold">{structure.batch_name}</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Total Amount</span>
            <span className="font-semibold text-primary">
              {formatCurrency(Number(structure.total_amount))}
            </span>
          </div>
          {structure.description && (
            <div className="pt-1.5">
              <span className="text-muted-foreground font-medium block mb-1">Description</span>
              <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border leading-relaxed">
                {structure.description}
              </p>
            </div>
          )}
          {structure.created_at && (
            <div className="flex justify-between items-center pt-1.5 text-xs text-muted-foreground">
              <span>Created At</span>
              <span>{formatDate(structure.created_at)}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
