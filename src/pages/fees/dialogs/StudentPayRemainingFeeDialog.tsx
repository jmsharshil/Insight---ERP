import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Building2,
  Banknote,
  FileText,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Upload,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { feesActions } from "@/redux/actions";
import { API } from "@/service/api";

type PaymentMethodType = "online" | "cheque" | "cash" | "finance";

interface StudentPayRemainingFeeDialogProps {
  open: boolean;
  onClose: () => void;
  amountDue: number;
  remainingFeeOptions?: any;
  financeNotice?: any;
  bankAccounts?: any[];
  onSuccess: () => void;
}

export function StudentPayRemainingFeeDialog({
  open,
  onClose,
  amountDue,
  remainingFeeOptions,
  financeNotice,
  bankAccounts = [],
  onSuccess,
}: StudentPayRemainingFeeDialogProps) {
  const dispatch = useDispatch<any>();
  const toast = useToast();

  const [method, setMethod] = useState<PaymentMethodType>("online");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset form when dialog opens/closes
  const handleDialogClose = () => {
    if (loading) return;
    setGeneratedLink(null);
    setTransactionRef("");
    setPaymentNote("");
    setProofFile(null);
    setMethod("online");
    onClose();
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Payment link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (method === "online") {
      // Case 1: Online Full Payment via Razorpay
      setLoading(true);
      dispatch({
        type: feesActions.PAY_MY_FEES,
        method: "POST",
        endPoint: API.FEES.MY_FEES,
        body: {
          payment_type: "full_payment",
          payment_choice: "online",
        },
        auth: true,
        setLoading: (l: boolean) => setLoading(l),
        getResponse: (res: any) => {
          setLoading(false);
          const link =
            res?.data?.payment_link_url ||
            res?.payment_link_url ||
            res?.data?.short_url ||
            res?.short_url;
          if (link) {
            setGeneratedLink(link);
            window.open(link, "_blank");
            toast.success("Razorpay payment link opened in a new tab!");
          } else {
            toast.success(res?.message || "Online payment initiated.");
            onSuccess();
            handleDialogClose();
          }
        },
        getError: (err: any) => {
          setLoading(false);
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to initiate online payment";
          toast.error(msg);
        },
      });
      return;
    }

    if (method === "finance") {
      // Case 3: Finance Selection (No Immediate Payment)
      setLoading(true);
      dispatch({
        type: feesActions.PAY_MY_FEES,
        method: "POST",
        endPoint: API.FEES.MY_FEES,
        body: {
          payment_type: "finance",
        },
        auth: true,
        setLoading: (l: boolean) => setLoading(l),
        getResponse: (res: any) => {
          setLoading(false);
          toast.success(
            res?.message ||
              "Finance option registered! Our admissions finance desk will assist you with loan/EMI procedures."
          );
          onSuccess();
          handleDialogClose();
        },
        getError: (err: any) => {
          setLoading(false);
          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to select finance option";
          toast.error(msg);
        },
      });
      return;
    }

    // Case 2: Cheque / Cash Full Payment (multipart/form-data)
    if (!transactionRef.trim()) {
      toast.error(
        method === "cheque"
          ? "Please enter the cheque number"
          : "Please enter the cash transaction / receipt reference"
      );
      return;
    }

    if (method === "cheque" && !proofFile) {
      toast.error("Please upload a photo or document proof of the cheque.");
      return;
    }

    const formData = new FormData();
    formData.append("payment_type", "full_payment");
    formData.append("payment_choice", method);
    formData.append("transaction_ref", transactionRef.trim());
    if (proofFile) {
      formData.append("payment_proof", proofFile);
    }
    if (paymentNote.trim()) {
      formData.append("payment_note", paymentNote.trim());
    }

    setLoading(true);
    dispatch({
      type: feesActions.PAY_MY_FEES,
      method: "POST",
      endPoint: API.FEES.MY_FEES,
      body: formData,
      auth: true,
      setLoading: (l: boolean) => setLoading(l),
      getResponse: (res: any) => {
        setLoading(false);
        toast.success(
          res?.message ||
            `Remaining fee payment proof for ${method === "cheque" ? "Cheque" : "Cash"} submitted successfully!`
        );
        onSuccess();
        handleDialogClose();
      },
      getError: (err: any) => {
        setLoading(false);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to submit payment proof";
        toast.error(msg);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleDialogClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-heading text-lg">
              Pay Remaining Balance
            </DialogTitle>
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-primary/30 text-primary font-semibold">
              Due: {formatCurrency(amountDue)}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Complete your fee payment or opt for loan/EMI financing under the 15-day policy.
          </DialogDescription>
        </DialogHeader>

        {/* Generated Razorpay Link Card */}
        {generatedLink ? (
          <div className="space-y-4 py-3">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Payment Link Generated Successfully!</span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Click below to complete your payment on Razorpay. Once processed, our system automatically verifies the payment, marks your fees as fully paid, and delivers your official receipt.
              </p>
              <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg p-2 font-mono text-xs text-slate-700 break-all">
                <span className="truncate flex-1">{generatedLink}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-7 px-2 shrink-0 text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => window.open(generatedLink, "_blank")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Open Razorpay Checkout
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onSuccess();
                    handleDialogClose();
                  }}
                  className="text-xs"
                >
                  I Have Completed Payment
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* 15-Day Policy Banner in Modal */}
            {financeNotice && !financeNotice.is_moved_to_finance && financeNotice.days_left !== undefined && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-snug">
                  <div className="font-semibold text-amber-950 flex items-center gap-2">
                    <span>15-Day Policy Window Active</span>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] h-4 px-1.5 font-mono">
                      {financeNotice.days_left} day(s) left
                    </Badge>
                  </div>
                  <p className="text-[11px] text-amber-900/80">
                    Deadline: <strong>{financeNotice.deadline_date_display || formatDate(financeNotice.deadline_date)}</strong>. Pay before the deadline or select Finance Assistance below.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Method Selector Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Select Payment Mode / Route
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Online Razorpay */}
                <button
                  type="button"
                  onClick={() => setMethod("online")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    method === "online"
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <CreditCard className={`w-4 h-4 ${method === "online" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-foreground">Online</div>
                    <div className="text-[10px] text-muted-foreground">Razorpay / UPI / Card</div>
                  </div>
                </button>

                {/* 2. Cheque */}
                <button
                  type="button"
                  onClick={() => setMethod("cheque")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    method === "cheque"
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${method === "cheque" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-foreground">Cheque</div>
                    <div className="text-[10px] text-muted-foreground">Upload Proof</div>
                  </div>
                </button>

                {/* 3. Cash */}
                <button
                  type="button"
                  onClick={() => setMethod("cash")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    method === "cash"
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <Banknote className={`w-4 h-4 ${method === "cash" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-foreground">Cash</div>
                    <div className="text-[10px] text-muted-foreground">Branch Desk Ref</div>
                  </div>
                </button>

                {/* 4. Finance */}
                <button
                  type="button"
                  onClick={() => setMethod("finance")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    method === "finance"
                      ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600 shadow-xs"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <FileText className={`w-4 h-4 ${method === "finance" ? "text-purple-600" : "text-muted-foreground"}`} />
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-foreground">Finance</div>
                    <div className="text-[10px] text-purple-700 font-medium">Loan / EMI Route</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Content Based on Selected Method */}
            {method === "online" && (
              <div className="rounded-xl bg-blue-50/70 border border-blue-200/70 p-4 space-y-2 text-xs text-blue-950">
                <div className="flex items-center gap-2 font-semibold">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Instant Online Payment (Razorpay)</span>
                </div>
                <p className="text-blue-900/80 leading-relaxed text-[11px]">
                  You will be securely redirected to Razorpay to pay <strong>{formatCurrency(amountDue)}</strong> via UPI, NetBanking, Credit/Debit Card. No manual verification required.
                </p>
                <div className="pt-1 flex items-center justify-between text-xs font-medium">
                  <span className="text-blue-900">Amount Payable Now:</span>
                  <span className="font-mono text-base font-bold text-blue-950">{formatCurrency(amountDue)}</span>
                </div>
              </div>
            )}

            {method === "finance" && (
              <div className="rounded-xl bg-purple-50/80 border border-purple-200/80 p-4 space-y-3 text-xs text-purple-950">
                <div className="flex items-center gap-2 font-semibold text-purple-900">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Education Loan & EMI Financing Assistance</span>
                </div>
                <p className="text-purple-900/80 leading-relaxed text-[11px]">
                  <strong>No immediate payment is required today.</strong> Selecting this route registers your preference with our accounts team, and our student loan desk will guide you through documentation (PAN, Aadhaar, Bank Statement) and zero/low-cost EMI options.
                </p>
                <div className="p-2.5 bg-white/80 border border-purple-200/60 rounded-lg space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium text-purple-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Admission & Access Uninterrupted</span>
                  </div>
                  <p className="text-muted-foreground text-[10px]">
                    Your course admission status remains active while your loan application is processed.
                  </p>
                </div>
              </div>
            )}

            {(method === "cheque" || method === "cash") && (
              <div className="space-y-3 pt-1">
                {/* Bank Account Info for Offline Deposits */}
                {bankAccounts.length > 0 && (
                  <div className="p-3 bg-muted/30 border rounded-xl text-xs space-y-1.5">
                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      Institute Bank Account Details:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span>Bank: </span>
                        <strong className="text-foreground">{bankAccounts[0].bank_name}</strong>
                      </div>
                      <div>
                        <span>A/C No: </span>
                        <strong className="text-foreground font-mono">{bankAccounts[0].account_number}</strong>
                      </div>
                      <div>
                        <span>IFSC: </span>
                        <strong className="text-foreground font-mono">{bankAccounts[0].ifsc_code}</strong>
                      </div>
                      <div>
                        <span>Branch: </span>
                        <span className="text-foreground">{bankAccounts[0].branch_name || "Main Branch"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Ref */}
                <div className="space-y-1.5">
                  <Label htmlFor="tx-ref" className="text-xs font-medium">
                    {method === "cheque" ? "Cheque Number *" : "Cash Receipt Reference *"}
                  </Label>
                  <Input
                    id="tx-ref"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder={method === "cheque" ? "e.g. CHQ-897512" : "e.g. REC-2026-0042"}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>

                {/* Payment Proof Upload */}
                <div className="space-y-1.5">
                  <Label htmlFor="proof-file" className="text-xs font-medium">
                    Upload {method === "cheque" ? "Cheque Photo / Scan *" : "Deposit Slip / Receipt (Optional)"}
                  </Label>
                  <div className="border border-dashed border-input rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                    <input
                      id="proof-file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setProofFile(file);
                      }}
                      className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {proofFile && (
                      <span className="text-[11px] text-emerald-600 font-medium mt-1 truncate max-w-full">
                        Selected: {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Note */}
                <div className="space-y-1.5">
                  <Label htmlFor="pay-note" className="text-xs font-medium">
                    Remarks / Branch Deposited At (Optional)
                  </Label>
                  <Input
                    id="pay-note"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Deposited at Central Branch reception desk"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDialogClose}
                disabled={loading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className={`text-xs gap-1.5 ${
                  method === "finance"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {loading ? (
                  "Processing..."
                ) : method === "online" ? (
                  <>
                    <span>Generate Razorpay Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : method === "finance" ? (
                  <>
                    <span>Confirm Finance Assistance</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Submit Payment Proof</span>
                    <Upload className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StudentPayRemainingFeeDialog;
