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
    <Sheet open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Approve Refund</SheetTitle>
          <SheetDescription>
            {txn?.studentName} · {txn && formatCurrency(txn.amount)}
          </SheetDescription>
        </SheetHeader>
        <div>
          <Label>Transaction Ref *</Label>
          <Input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="mt-1"
            placeholder="TXN..."
          />
        </div>
        <SheetFooter>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
