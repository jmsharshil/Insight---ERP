import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { API } from "@/service/api";
import { APILead } from "@/types/crm";

interface TransferRequestDialogProps {
  lead: APILead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TransferRequestDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: TransferRequestDialogProps) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!lead) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for the transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loginDataRaw = localStorage.getItem("Insight_Login_Data");
      const token = loginDataRaw ? JSON.parse(loginDataRaw)?.access : "";
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";
      const res = await fetch(`${baseUrl}${API.LEADS.TRANSFER_REQUESTS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit transfer request");
      }

      toast.success("Transfer request submitted successfully.");
      setReason("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Lead Transfer</DialogTitle>
          <DialogDescription>
            Submit a request to transfer {lead?.first_name} {lead?.surname} to a counsellor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason for Transfer</Label>
            <Textarea
              id="reason"
              placeholder="E.g., This lead has specific CS Professional questions..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
