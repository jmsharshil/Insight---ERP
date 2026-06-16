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
import { useToast } from "@/hooks/useToast";

interface BankAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  account: any | null;
  loading: boolean;
}

export function BankAccountDialog({
  open,
  onClose,
  onSubmit,
  account,
  loading,
}: BankAccountDialogProps) {
  const toast = useToast();
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchName, setBranchName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setBankName(account?.bank_name || "");
      setAccountName(account?.name || "");
      setAccountNumber(account?.account_number || "");
      setBranchName(account?.branch_name || "");
      setIfscCode(account?.ifsc_code || "");
      setIsActive(account ? account.is_active !== false : true);
    }
  }, [open, account]);

  const handleSave = () => {
    if (!bankName || !accountName || !accountNumber) {
      toast.error("Please fill in Bank Name, Account Name, and Account Number.");
      return;
    }
    onSubmit({
      bank_name: bankName,
      name: accountName,
      account_number: accountNumber,
      branch_name: branchName || undefined,
      ifsc_code: ifscCode || undefined,
      is_active: isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {account ? "Edit Bank Account" : "Add Bank Account"}
          </DialogTitle>
          <DialogDescription>
            {account
              ? "Update the configuration details for this bank account."
              : "Register a new valid bank account to map student fee payments."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5 text-sm">
            <Label htmlFor="bank-name">Bank Name *</Label>
            <Input
              id="bank-name"
              placeholder="e.g. State Bank of India"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-sm">
            <Label htmlFor="account-name">Account Name / Holder Name *</Label>
            <Input
              id="account-name"
              placeholder="e.g. INSIGHT TECH EDUCATION AC"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-sm">
            <Label htmlFor="account-number">Account Number *</Label>
            <Input
              id="account-number"
              placeholder="e.g. 50100234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-sm">
            <Label htmlFor="ifsc-code">IFSC Code</Label>
            <Input
              id="ifsc-code"
              placeholder="e.g. IFSC1234"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2 text-sm">
            <input
              id="account-active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <Label htmlFor="account-active" className="cursor-pointer">
              Active and accepting payments
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !bankName || !accountName || !accountNumber}
            className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
          >
            {loading ? "Saving..." : "Save Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
