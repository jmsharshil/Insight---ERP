import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
    <Dialog open={!!installment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Reject Installment Plan</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting the installment plan for{" "}
            <span className="font-semibold">
              {installment?.student_name || installment?.student?.full_name || "—"}
            </span>.
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
