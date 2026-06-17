import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
    <Sheet open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Reject Payment</SheetTitle>
          <SheetDescription>
            {txn?.studentName} · {txn && formatCurrency(txn.amount)}
          </SheetDescription>
        </SheetHeader>
        <Textarea
          placeholder="Reason for rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <SheetFooter>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
