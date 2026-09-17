import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type FeesStructure } from "@/redux/slices/feesSlice";

interface ViewFeeStructureDialogProps {
  open: boolean;
  onClose: () => void;
  structure: FeesStructure | null;
}

const ATTEMPT_LABELS: Record<string, string> = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  june: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
};

export function ViewFeeStructureDialog({
  open,
  onClose,
  structure,
}: ViewFeeStructureDialogProps) {
  if (!structure) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Fee Structure Details</SheetTitle>
          <SheetDescription>
            Detailed information retrieved from the server for this structure.
          </SheetDescription>
        </SheetHeader>
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
            <span className="text-muted-foreground font-medium">Level</span>
            <span className="font-semibold">{structure.level_name || "—"}</span>
          </div>
          {(structure.attempt || structure.year) && (
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Session</span>
              <span className="font-semibold">{[ATTEMPT_LABELS[structure.attempt || ""] || structure.attempt, structure.year].filter(Boolean).join(" ")}</span>
            </div>
          )}
          {(structure.level_name === "CSEET" || structure.level_name === "CS Professional") && (
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
              <span className="text-muted-foreground font-medium">ICSI Reg. Fees</span>
              <span className="font-semibold">{formatCurrency(Number(structure.icsi_registration_fees || 0))}</span>
            </div>
          )}

          {(structure.level_name === "CSEET" || structure.level_name === "CS Executive" || structure.level_name === "CS Professional") && (
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
              <span className="text-muted-foreground font-medium">ICSI Exam Fees {structure.level_name !== "CSEET" && "(Per Module)"}</span>
              <span className="font-semibold">{formatCurrency(Number(structure.icsi_exam_fees || 0))}</span>
            </div>
          )}

          {structure.level_name === "CS Executive" && (
            <>
              <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">ICSI Reg. Fees (Via CSEET)</span>
                <span className="font-semibold">{formatCurrency(Number(structure.icsi_registration_fees_via_cseet || 0))}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">ICSI Reg. Fees (Direct)</span>
                <span className="font-semibold">{formatCurrency(Number(structure.icsi_registration_fees_direct || 0))}</span>
              </div>
            </>
          )}

          {(structure.level_name === "CS Executive" || structure.level_name === "CS Professional") && (
            <>
              <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Institute Fees (Both Modules)</span>
                <span className="font-semibold">{formatCurrency(Number(structure.institute_fees_both_modules || 0))}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Institute Fees (Module 1)</span>
                <span className="font-semibold">{formatCurrency(Number(structure.institute_fees_module_1 || 0))}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Institute Fees (Module 2)</span>
                <span className="font-semibold">{formatCurrency(Number(structure.institute_fees_module_2 || 0))}</span>
              </div>
            </>
          )}

          {!(structure.level_name === "CS Executive" || structure.level_name === "CS Professional") && (
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Institute Fee</span>
              <span className="font-semibold text-primary">
                {formatCurrency(Number(structure.total_amount))}
              </span>
            </div>
          )}
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
        <SheetFooter>
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
