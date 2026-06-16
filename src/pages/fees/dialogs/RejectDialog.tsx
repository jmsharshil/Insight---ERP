import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type FeeTransaction } from "@/constants/dummy/fees";

interface RejectDialogProps {
  txn: FeeTransaction | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function RejectDialog({
  txn,
  onClose,
  onSubmit,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    setReason("");
  }, [txn?.id]);

  return (
    <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Reject Payment</DialogTitle>
          <DialogDescription>
            {txn?.studentName} · {txn && formatCurrency(txn.amount)}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Reason for rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => onSubmit(reason)}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
