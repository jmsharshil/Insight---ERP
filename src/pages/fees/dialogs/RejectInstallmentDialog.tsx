import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface RejectInstallmentDialogProps {
  installment: any | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function RejectInstallmentDialog({
  installment,
  onClose,
  onSubmit,
}: RejectInstallmentDialogProps) {
  const [reason, setReason] = useState("");
  
  useEffect(() => {
    if (installment) {
      setReason("");
    }
  }, [installment?.id]);

  return (
    <Sheet open={!!installment} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Reject Installment Plan</SheetTitle>
          <SheetDescription>
            Provide a reason for rejecting the installment plan for{" "}
            <span className="font-semibold">
              {installment?.student_name || installment?.student?.full_name || "—"}
            </span>.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 my-2 text-sm">
          <Label htmlFor="rejection-reason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rejection Reason *
          </Label>
          <Textarea
            id="rejection-reason"
            placeholder="Type rejection reason here..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => onSubmit(reason)}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            Reject Plan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
