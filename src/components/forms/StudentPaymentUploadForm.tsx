import React, { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useToast } from "@/hooks/useToast";
import { admissionActions } from "@/redux/actions";
import { API } from "@/service/api";
import { AppDispatch } from "@/store";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Upload, X, CreditCard, Banknote, Loader2, FileImage } from "lucide-react";

import { THEME } from "@/config/theme";

/* ─── Theme constants ──────────── */
const T = {
  ...THEME.colors,
  headingFont: THEME.fontFamily.heading,
  bodyFont: THEME.fontFamily.body,
};

function FileUploadField({
  label,
  icon: Icon,
  file,
  onFileChange,
  required = false,
}: {
  label: string;
  icon: React.ElementType;
  file: File | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium" style={{ color: T.text }}>
        {label} {required && <span style={{ color: T.error }}>*</span>}
      </Label>
      <div
        className="relative rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30"
        style={{ borderColor: file ? T.success : T.border }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileChange(e.target.files[0]);
            }
          }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-700 truncate max-w-xs">
              {file.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="w-3 h-3 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary-dark">Click to upload</span> or drag and
              drop
            </div>
            <p className="text-xs text-muted-foreground/70">JPG, PNG or PDF (max. 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentPaymentUploadForm() {
  const [searchParams] = useSearchParams();
  const admissionId = searchParams.get("id");
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [transactionId, setTransactionId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  // Validation
  const isFormValid = () => {
    return transactionId.trim() !== "" && paymentAmount.trim() !== "" && paymentScreenshot !== null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionId) {
      toast.error("Invalid link. Admission ID is missing.");
      return;
    }
    if (!isFormValid()) {
      toast.error("Please fill in all required fields and upload the screenshot.");
      return;
    }

    const formData = new FormData();
    formData.append("transaction_id", transactionId);
    formData.append("payment_amount", paymentAmount);
    if (paymentNote.trim()) formData.append("payment_note", paymentNote);
    if (paymentScreenshot) formData.append("payment_screenshot", paymentScreenshot);

    dispatch({
      type: admissionActions.UPLOAD_PAYMENT,
      method: "POST",
      endPoint: API.ADMISSIONS.PAYMENT_UPLOAD(admissionId),
      body: formData,
      auth: false, // Assuming external access, or maybe it needs auth?
      setLoading: (val: boolean) => setLoading(val),
      getResponse: (res: any) => {
        setSubmitted(true);
      },
      getError: (err: any) => {
        toast.error(
          err?.response?.data?.message || err?.message || "Failed to upload payment details",
        );
      },
    });
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen grid place-items-center p-4 sm:p-8"
        style={{ background: T.surface, fontFamily: T.bodyFont }}
      >
        <div
          className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border text-center p-8 sm:p-12"
          style={{ borderColor: T.border }}
        >
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: T.headingFont, color: T.black }}
          >
            Payment Uploaded Successfully!
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Thank you! Your payment details have been submitted. Our team will verify the
            transaction and process your admission shortly. We will be in touch with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex justify-center"
      style={{ background: T.surface, fontFamily: T.bodyFont }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="Insight Institute" className="h-16 mx-auto mb-6 drop-shadow-sm" />
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-2"
            style={{ fontFamily: T.headingFont, color: T.black }}
          >
            Payment Verification
          </h1>
          <p className="text-muted-foreground">
            Please upload your payment screenshot to proceed with the admission.
          </p>
        </div>

        {!admissionId ? (
          <div
            className="bg-white rounded-2xl p-8 border text-center text-red-500 shadow-sm"
            style={{ borderColor: T.border }}
          >
            <X className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold text-lg">Invalid Payment Link</p>
            <p className="text-sm mt-1">
              Please ensure you clicked the exact link provided in your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className="bg-white rounded-2xl border shadow-sm overflow-hidden"
              style={{ borderColor: T.border }}
            >
              <div className="px-6 py-4 flex items-center gap-2" style={{ background: T.grayDark }}>
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h2
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: T.headingFont }}
                >
                  Payment Details
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <FileUploadField
                  label="Payment Screenshot"
                  icon={FileImage}
                  file={paymentScreenshot}
                  onFileChange={setPaymentScreenshot}
                  required
                />

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: T.text }}>
                    Transaction ID <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    placeholder="e.g. UTR / Ref No / UPI ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="bg-muted/10 h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: T.text }}>
                    Payment Amount <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="bg-muted/10 h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: T.text }}>
                    Payment Note{" "}
                    <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    placeholder="Any additional details..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="bg-muted/10 h-11"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full h-14 text-base font-semibold shadow-lg rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.textInverse,
                opacity: loading || !isFormValid() ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Details...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" /> Submit Payment Verification
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
