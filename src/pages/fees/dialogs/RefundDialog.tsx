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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { type FeeTransaction } from "@/constants/dummy/fees";

interface RefundDialogProps {
  txn: FeeTransaction | null;
  onClose: () => void;
  onApprove: (r: string) => void;
}

export function RefundDialog({
  txn,
  onClose,
  onApprove,
}: RefundDialogProps) {
  const [ref, setRef] = useState("");

  useEffect(() => {
    setRef("");
  }, [txn?.id]);

  return (
    <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Approve Refund</DialogTitle>
          <DialogDescription>
            {txn?.studentName} · {txn && formatCurrency(txn.amount)}
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Transaction Ref *</Label>
          <Input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="mt-1"
            placeholder="TXN..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!ref.trim()}
            onClick={() => onApprove(ref)}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Process Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
