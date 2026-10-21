import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useToast } from "@/hooks/useToast";
import { useDropdown } from "@/hooks/useDropdown";
import { admissionActions } from "@/redux/actions";
import { API } from "@/service/api";
import { AppDispatch } from "@/store";
import { axiosRequest } from "@/service/axiosRequest";
import { type FeesStructure } from "@/redux/slices/feesSlice";
import { formatCurrency } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  GraduationCap,
  MapPin,
  Loader2,
  Mail,
  User,
  Phone,
  ClipboardList,
  Calendar,
  School,
  Award,
  Megaphone,
  ShieldCheck,
  FileImage,
  Upload,
  X,
  Camera,
  CreditCard,
  Baby,
  PenTool,
  FileCheck,
  BadgeCheck,
  AlertCircle,
  Info,
  ExternalLink,
  FileEdit,
  Search,
  Receipt,
  History,
  Printer,
  Link2,
  ArrowUpRight,
  Clock,
  Sparkles,
  ArrowLeft,
  PlusCircle,
} from "lucide-react";

import { THEME } from "@/config/theme";

/* ─── Theme constants (matches LeadsInquiryForm) ──────────── */
const T = {
  ...THEME.colors,
  headingFont: THEME.fontFamily.heading,
  bodyFont: THEME.fontFamily.body,
};

/* ─── Reusable section card ────────────────────────────────── */
function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-md"
      style={{
        border: `1px solid ${T.border}`,
        background: T.card,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-2.5"
        style={{ background: T.grayDark }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(247,169,0,0.15)" }}
        >
          <Icon className="w-4 h-4" style={{ color: T.primary }} />
        </div>
        <h2
          className="text-base sm:text-lg font-semibold text-white"
          style={{ fontFamily: T.headingFont }}
        >
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

/* ─── Sub-section header ───────────────────────────────────── */
function SubSection({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center"
        style={{ background: `${T.primary}18` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: T.primaryDark }} />
      </div>
      <h3
        className="font-semibold text-sm sm:text-base"
        style={{ color: T.text, fontFamily: T.headingFont }}
      >
        {title}
      </h3>
    </div>
  );
}

/* ─── File upload field ────────────────────────────────────── */
function FileUploadField({
  label,
  icon: Icon,
  file,
  onFileChange,
  existingUrl,
  required = false,
  accept = "image/*,.pdf,application/pdf",
}: {
  label: string;
  icon: React.ElementType;
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingUrl?: string | null;
  required?: boolean;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
        {label} {required && <span style={{ color: T.error }}>*</span>}
      </Label>
      <div
        className="relative rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30"
        style={{ borderColor: file ? T.success : existingUrl ? T.primary : T.border }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          required={required}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            onFileChange(f);
          }}
        />
        {file ? (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${T.success}15` }}
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: T.success }} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: T.text }}>
                {file.name}
              </p>
              <p className="text-xs" style={{ color: T.textMuted }}>
                {(file.size / 1024).toFixed(1)} KB (New file)
              </p>
            </div>
            <button
              type="button"
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="w-4 h-4" style={{ color: T.error }} />
            </button>
          </div>
        ) : existingUrl ? (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${T.primary}15` }}
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: T.primaryDark }} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-emerald-600">
                Uploaded Document on File
              </p>
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-[200px]"
              >
                <ExternalLink className="w-3 h-3" /> View Document
              </a>
            </div>
            <span className="text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-1 rounded-md">
              Click to replace
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: `${T.primary}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: T.primaryDark }} />
            </div>
            <p className="text-xs font-medium" style={{ color: T.textMuted }}>
              Click to upload
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function StudentAdmissionForm() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const admissionId = searchParams.get("id") || searchParams.get("admission_id") || "";

  const [savedAdmissionId, setSavedAdmissionId] = useState<string | null>(admissionId || null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 4: Payment proof & transaction state
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [existingPaymentScreenshot, setExistingPaymentScreenshot] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentSubmittedAt, setPaymentSubmittedAt] = useState<string>("");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentProofSubmitting, setPaymentProofSubmitting] = useState<boolean>(false);
  const [paymentProofSuccess, setPaymentProofSuccess] = useState<boolean>(false);
  const [razorpayPaymentLink, setRazorpayPaymentLink] = useState<string | null>(null);
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);
  const [admissionStatusDisplay, setAdmissionStatusDisplay] = useState<string | null>(null);
  const [totalFeesAmount, setTotalFeesAmount] = useState<string | number | null>(null);
  const [remainingFeesAmount, setRemainingFeesAmount] = useState<string | number | null>(null);
  const [tokenTermsNote, setTokenTermsNote] = useState<string | null>(null);

  // Admission Entry & Resume Modal state
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(!admissionId);
  const [entryMode, setEntryMode] = useState<"select" | "resume">("select");
  const [inputAdmissionId, setInputAdmissionId] = useState(admissionId || "");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingDocs, setExistingDocs] = useState<Record<string, string | null>>({});

  // Fetch locations dropdown
  const {
    options: locations,
    loading: locationsLoading,
    fetchOptions: fetchLocations,
  } = useDropdown("locations", false);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  /* ─── Fetch Admission by Admission ID ────────────────────── */
  const loadAdmissionById = (idToLoad: string, showToast = true) => {
    const trimmedId = idToLoad.trim();
    if (!trimmedId) {
      toast.error("Please enter a valid Admission ID.");
      return;
    }

    setLoadingExisting(true);
    dispatch({
      type: admissionActions.GET_ADMISSION_DETAIL,
      method: "GET",
      endPoint: API.ADMISSIONS.GET(trimmedId),
      auth: false,
      setLoading: (val: boolean) => setLoadingExisting(val),
      getResponse: (res: any) => {
        const data = res?.data?.data || res?.data || res;
        if (!data || (!data.id && !data.first_name && !data.email)) {
          toast.error(`No admission record found for Admission ID #${trimmedId}`);
          return;
        }

        const validId = String(data.id || trimmedId);
        setSavedAdmissionId(validId);
        setInputAdmissionId(validId);
        setSearchParams({ id: validId });

        // Populate form data
        setFormData((prev) => ({
          ...prev,
          form_type: data.form_type || prev.form_type,
          course: data.course || prev.course,
          group_module: data.group_module || prev.group_module,
          batch_attempt: data.batch_attempt || prev.batch_attempt,
          attempt_year: data.attempt_year ? String(data.attempt_year) : prev.attempt_year,
          payment_type: data.payment_type || prev.payment_type,
          payment_mode: data.payment_choice || data.payment_mode || prev.payment_mode || "online",
          cheque_no: data.cheque_no || "",
          icsi_fees_payment: data.icsi_fees_payment || prev.icsi_fees_payment,
          fee_structure: data.fee_structure
            ? typeof data.fee_structure === "object"
              ? String(data.fee_structure.id || "")
              : String(data.fee_structure)
            : prev.fee_structure,
          first_name: data.first_name || "",
          surname: data.surname || "",
          father_name: data.father_name || "",
          mother_name: data.mother_name || "",
          street: data.street || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          country: data.country || "India",
          dob: data.dob ? data.dob.split("T")[0] : "",
          category: data.category ? data.category.toLowerCase() : "gen",
          phone_student: data.phone_student || "",
          phone_father: data.phone_father || "",
          email: data.email || "",
          email_parent: data.email_parent || "",
          qualification: data.qualification || prev.qualification,
          tenth_medium: data.tenth_medium || prev.tenth_medium,
          tenth_school: data.tenth_school || "",
          tenth_percentage: data.tenth_percentage != null ? String(data.tenth_percentage) : "",
          tenth_percentile: data.tenth_percentile != null ? String(data.tenth_percentile) : "",
          twelfth_medium: data.twelfth_medium || prev.twelfth_medium,
          twelfth_school: data.twelfth_school || "",
          tenth_coaching: data.tenth_coaching || "",
          twelfth_coaching: data.twelfth_coaching || "",
          twelfth_percentage: data.twelfth_percentage != null ? String(data.twelfth_percentage) : "",
          twelfth_percentile: data.twelfth_percentile != null ? String(data.twelfth_percentile) : "",
          reference: data.reference || prev.reference,
          reference_name: data.reference_name || "",
          inquiry_date: data.inquiry_date ? data.inquiry_date.split("T")[0] : prev.inquiry_date,
          location: data.location || (data.branch?.name || ""),
          consent: data.consent !== undefined ? Boolean(data.consent) : true,
        }));

        // Populate existing documents if available
        setExistingDocs({
          doc_signature: data.doc_signature || null,
          doc_photo: data.doc_photo || null,
          doc_id_card: data.doc_id_card || null,
          doc_pan_card: data.doc_pan_card || null,
          doc_dob_certificate: data.doc_dob_certificate || null,
          doc_twelfth_receipt: data.doc_twelfth_receipt || null,
          doc_twelfth_marksheet: data.doc_twelfth_marksheet || null,
          doc_category_cert: data.doc_category_cert || null,
        });

        // Populate existing payment proof details if available
        if (data.transaction_id) setTransactionId(data.transaction_id);
        if (data.payment_note) setPaymentNote(data.payment_note);
        if (data.payment_amount != null) setPaymentAmount(String(data.payment_amount));
        if (data.payment_submitted_at) setPaymentSubmittedAt(data.payment_submitted_at);
        if (data.payment_screenshot) {
          setExistingPaymentScreenshot(data.payment_screenshot);
          setPaymentProofSuccess(true);
        }
        if (Array.isArray(data.payment_history)) {
          setPaymentHistory(data.payment_history);
        }
        if (data.razorpay_payment_link) {
          setRazorpayPaymentLink(data.razorpay_payment_link);
        }
        if (data.total_fees != null) setTotalFeesAmount(data.total_fees);
        if (data.remaining_fees != null) setRemainingFeesAmount(data.remaining_fees);
        if (data.status) setAdmissionStatus(data.status);
        if (data.status_display) setAdmissionStatusDisplay(data.status_display);
        if (data.token_payment_terms_note) setTokenTermsNote(data.token_payment_terms_note);

        if (data.status === "submitted" || data.status === "confirmed" || data.payment_screenshot || data.transaction_id) {
          setIsSubmitted(true);
          setCurrentStep(4);
        }

        setIsChoiceModalOpen(false);
        setEntryMode("select");

        if (showToast) {
          toast.success(`Admission ID #${validId} loaded successfully!`);
        }
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          `Failed to find Admission ID #${trimmedId}. Please check the Admission ID.`;
        toast.error(msg);
      },
    });
  };

  // If admission ID is in URL on mount, auto-load it
  useEffect(() => {
    if (admissionId) {
      loadAdmissionById(admissionId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Start Fresh New Admission Form ───────────────────────── */
  const handleStartNewAdmission = () => {
    setFormData({
      form_type: "admission",
      course: "cseet",
      group_module: "full",
      batch_attempt: "june",
      attempt_year: new Date().getFullYear().toString(),
      payment_type: "full_payment",
      payment_mode: "online",
      cheque_no: "",
      icsi_fees_payment: "pay_yourself",
      fee_structure: "",
      first_name: "",
      surname: "",
      father_name: "",
      mother_name: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      dob: "",
      category: "gen",
      phone_student: "",
      phone_father: "",
      email: "",
      email_parent: "",
      qualification: "appearing_12",
      tenth_medium: "gseb",
      tenth_school: "",
      tenth_percentage: "",
      tenth_percentile: "",
      twelfth_medium: "gseb",
      twelfth_school: "",
      tenth_coaching: "",
      twelfth_coaching: "",
      twelfth_percentage: "",
      twelfth_percentile: "",
      reference: "google",
      reference_name: "",
      inquiry_date: new Date().toISOString().split("T")[0],
      location: "",
      consent: true,
    });
    setSavedAdmissionId(null);
    setInputAdmissionId("");
    setSearchParams({});
    setCurrentStep(1);
    setIsSubmitted(false);
    setExistingDocs({});
    setDocSignature(null);
    setDocPhoto(null);
    setDocIdCard(null);
    setDocPanCard(null);
    setDocDobCertificate(null);
    setDoc12thReceipt(null);
    setDoc12thMarkSheet(null);
    setDocCategoryCertificate(null);
    setPaymentScreenshot(null);
    setExistingPaymentScreenshot(null);
    setTransactionId("");
    setPaymentNote("");
    setPaymentAmount("");
    setPaymentSubmittedAt("");
    setPaymentHistory([]);
    setPaymentProofSuccess(false);
    setRazorpayPaymentLink(null);
    setAdmissionStatus(null);
    setAdmissionStatusDisplay(null);
    setTotalFeesAmount(null);
    setRemainingFeesAmount(null);
    setTokenTermsNote(null);
    setIsChoiceModalOpen(false);
    setEntryMode("select");
    toast.info("Starting fresh New Admission Form");
  };

  /* ─── Document state ──────────────────────────────────────── */
  const [docSignature, setDocSignature] = useState<File | null>(null);
  const [docPhoto, setDocPhoto] = useState<File | null>(null);
  const [docIdCard, setDocIdCard] = useState<File | null>(null);
  const [docPanCard, setDocPanCard] = useState<File | null>(null);
  const [docDobCertificate, setDocDobCertificate] = useState<File | null>(null);
  const [doc12thReceipt, setDoc12thReceipt] = useState<File | null>(null);
  const [doc12thMarkSheet, setDoc12thMarkSheet] = useState<File | null>(null);
  const [docCategoryCertificate, setDocCategoryCertificate] = useState<File | null>(null);

  /* ─── Form state ──────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    form_type: "admission",
    course: "cseet",
    group_module: "module_1",
    batch_attempt: "june",
    attempt_year: new Date().getFullYear().toString(),
    payment_type: "full_payment",
    payment_mode: "online",
    cheque_no: "",
    icsi_fees_payment: "pay_yourself",
    fee_structure: "",
    first_name: "",
    surname: "",
    father_name: "",
    mother_name: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    dob: "",
    category: "gen",
    phone_student: "",
    phone_father: "",
    email: "",
    email_parent: "",
    qualification: "appearing_12",
    tenth_medium: "gseb",
    tenth_school: "",
    tenth_percentage: "",
    tenth_percentile: "",
    twelfth_medium: "gseb",
    twelfth_school: "",
    tenth_coaching: "",
    twelfth_coaching: "",
    twelfth_percentage: "",
    twelfth_percentile: "",
    reference: "google",
    reference_name: "",
    inquiry_date: new Date().toISOString().split("T")[0],
    location: "",
    consent: true,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "payment_type" && value === "token" && !prev.payment_mode) {
        updated.payment_mode = "online";
      }
      if (field === "course") {
        if (value === "cseet") {
          updated.group_module = "full";
          if (!["june", "oct", "feb"].includes(prev.batch_attempt)) {
            updated.batch_attempt = "june";
          }
        } else if (value === "cs_executive" || value === "cs_professional") {
          updated.group_module = "module_1";
          if (!["june", "dec"].includes(prev.batch_attempt)) {
            updated.batch_attempt = "june";
          }
        }
      }
      return updated;
    });
  };

  useEffect(() => {
    setFormData((prev) => {
      if (prev.course === "cseet") {
        return prev.group_module === "full" ? prev : { ...prev, group_module: "full" };
      }
      if (prev.group_module === "full") {
        return { ...prev, group_module: "module_1" };
      }
      return prev;
    });
  }, [formData.course]);

  /* ─── Auto-set Course based on Qualification ───────────────── */
  useEffect(() => {
    setFormData((prev) => {
      const q = prev.qualification;
      let newCourse = prev.course;
      if (q === "appearing_12" || q === "pass_12") {
        newCourse = "cseet";
      } else if (q === "cseet_pass" || q === "graduate" || q === "post_graduate") {
        newCourse = "cs_executive";
      } else if (q === "cs_executive_pass") {
        newCourse = "cs_professional";
      }
      return newCourse !== prev.course ? { ...prev, course: newCourse } : prev;
    });
  }, [formData.qualification]);

  const getAvailableYears = (course: string, attempt: string, groupModule: string) => {
    const current = new Date();
    const currentYear = current.getFullYear();
    const currentMonth = current.getMonth();
    
    let firstValidYear = currentYear;

    if (course === "cseet") {
      if (attempt === "june") {
        if (currentMonth > 0) firstValidYear = currentYear + 1;
      } else if (attempt === "oct") {
        if (currentMonth > 4) firstValidYear = currentYear + 1;
      } else if (attempt === "feb") {
        if (currentMonth > 9) firstValidYear = currentYear + 2;
        else firstValidYear = currentYear + 1;
      }
    } else {
      if (attempt === "june") {
        if (groupModule === "both" || groupModule === "full" || groupModule === "all") {
          if (currentMonth > 10) firstValidYear = currentYear + 2;
          else firstValidYear = currentYear + 1;
        } else {
          if (currentMonth > 0) firstValidYear = currentYear + 1;
        }
      } else if (attempt === "dec") {
        if (groupModule === "both" || groupModule === "full" || groupModule === "all") {
          if (currentMonth > 4) firstValidYear = currentYear + 1;
        } else {
          if (currentMonth > 6) firstValidYear = currentYear + 1;
        }
      }
    }

    return [firstValidYear, firstValidYear + 1, firstValidYear + 2, firstValidYear + 3].map(String);
  };

  const availableYears = getAvailableYears(formData.course, formData.batch_attempt, formData.group_module);

  // Keep attempt_year valid
  useEffect(() => {
    if (!availableYears.includes(formData.attempt_year)) {
      handleChange("attempt_year", availableYears[0]);
    }
  }, [availableYears, formData.attempt_year]);

  /* ─── Fee Structure Helper Calculations ───────────────────────── */
  const getInstituteFee = (fee: FeesStructure | null, course: string, groupModule: string): number => {
    if (!fee) return 0;

    if (course === "cseet") {
      return Number(fee.total_amount || fee.institute_fees_all_modules || 0);
    }

    if (groupModule === "both" || groupModule === "all") {
      return Number(
        fee.institute_fees_all_modules ||
        fee.institute_fees_both_modules ||
        fee.total_amount ||
        0
      );
    }

    if (groupModule === "module_1") {
      const m1 = Number(fee.institute_fees_module_1 || 0);
      if (m1 > 0) return m1;
      if (
        fee.group_module === "module_1" ||
        (fee.name && /module\s*1|module_1/i.test(fee.name))
      ) {
        return Number(fee.total_amount || fee.institute_fees_all_modules || 0);
      }
      return Number(fee.total_amount || 0);
    }

    if (groupModule === "module_2") {
      const m2 = Number(fee.institute_fees_module_2 || 0);
      if (m2 > 0) return m2;
      if (
        fee.group_module === "module_2" ||
        (fee.name && /module\s*2|module_2/i.test(fee.name))
      ) {
        return Number(fee.total_amount || fee.institute_fees_all_modules || 0);
      }
      return Number(fee.total_amount || 0);
    }

    if (groupModule === "module_3") {
      const m3 = Number(fee.institute_fees_module_3 || 0);
      if (m3 > 0) return m3;
      if (
        fee.group_module === "module_3" ||
        (fee.name && /module\s*3|module_3/i.test(fee.name))
      ) {
        return Number(fee.total_amount || fee.institute_fees_all_modules || 0);
      }
      return Number(fee.total_amount || 0);
    }

    if (groupModule === "module_4") {
      const m4 = Number(fee.institute_fees_module_4 || 0);
      if (m4 > 0) return m4;
      if (
        fee.group_module === "module_4" ||
        (fee.name && /module\s*4|module_4/i.test(fee.name))
      ) {
        return Number(fee.total_amount || fee.institute_fees_all_modules || 0);
      }
      return Number(fee.total_amount || 0);
    }

    if (groupModule === "module_5") {
      const m5 = Number(fee.institute_fees_module_5 || 0);
      if (m5 > 0) return m5;
      if (
        fee.group_module === "module_5" ||
        (fee.name && /module\s*5|module_5/i.test(fee.name))
      ) {
        return Number(fee.total_amount || fee.institute_fees_all_modules || 0);
      }
      return Number(fee.total_amount || 0);
    }

    return Number(fee.total_amount || 0);
  };

  const getIcsiRegFees = (
    fee: FeesStructure | null,
    qualification: string,
    course: string,
    candidates: FeesStructure[] = []
  ): number => {
    if (!fee) return 0;
    if (course === "cseet" || course === "cs_professional") {
      const val = Number(fee.icsi_registration_fees || 0);
      if (val > 0) return val;
      const fallback = candidates.find((c) => Number(c.icsi_registration_fees || 0) > 0);
      return Number(fallback?.icsi_registration_fees || 0);
    }
    if (course === "cs_executive") {
      if (qualification === "cseet_pass") {
        const val = Number(fee.icsi_registration_fees_via_cseet || 0);
        if (val > 0) return val;
        const fallback = candidates.find((c) => Number(c.icsi_registration_fees_via_cseet || 0) > 0);
        return Number(fallback?.icsi_registration_fees_via_cseet || 0);
      }
      if (["graduate", "post_graduate"].includes(qualification)) {
        const val = Number(fee.icsi_registration_fees_direct || 0);
        if (val > 0) return val;
        const fallback = candidates.find((c) => Number(c.icsi_registration_fees_direct || 0) > 0);
        return Number(fallback?.icsi_registration_fees_direct || 0);
      }
    }
    return 0;
  };

  const getIcsiExamFees = (
    fee: FeesStructure | null,
    candidates: FeesStructure[] = []
  ): number => {
    if (!fee) return 0;
    const val = Number(fee.icsi_exam_fees || 0);
    if (val > 0) return val;
    const fallback = candidates.find((c) => Number(c.icsi_exam_fees || 0) > 0);
    return Number(fallback?.icsi_exam_fees || 0);
  };

  const [feeStructuresList, setFeeStructuresList] = useState<FeesStructure[]>([]);
  const [feeCandidates, setFeeCandidates] = useState<FeesStructure[]>([]);
  const [matchedFee, setMatchedFee] = useState<FeesStructure | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);

  /* ─── Fetch Fee Structures ───────────────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    const fetchFees = async () => {
      try {
        setLoadingFees(true);
        const response = await axiosRequest({
          baseURL: import.meta.env.VITE_APP_BASE_URL,
          url: API.FEES.STRUCTURES,
          method: "GET",
        });

        if (!isMounted) return;

        const data: FeesStructure[] =
          response.data?.data ||
          response.data?.results ||
          (Array.isArray(response.data) ? response.data : []);

        setFeeStructuresList(data);
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch fees", error);
        }
      } finally {
        if (isMounted) {
          setLoadingFees(false);
        }
      }
    };

    fetchFees();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ─── Filter & Match Fee Structure Based on Form State ───────── */
  useEffect(() => {
    if (!feeStructuresList || feeStructuresList.length === 0) {
      setMatchedFee(null);
      setFeeCandidates([]);
      return;
    }

    const courseKey = formData.course.toLowerCase().replace(/_/g, " ");
    const attemptKey = (formData.batch_attempt || "").toLowerCase();
    const yearKey = String(formData.attempt_year || "");

    const candidates = feeStructuresList.filter((fs) => {
      if (!fs.is_active) return false;

      const levelName = (fs.level_name || "").toLowerCase();
      const fsName = (fs.name || "").toLowerCase();

      const levelMatch =
        levelName.includes(courseKey) ||
        fsName.includes(courseKey) ||
        (formData.course === "cs_executive" &&
          (levelName.includes("executive") || fsName.includes("executive"))) ||
        (formData.course === "cs_professional" &&
          (levelName.includes("professional") || fsName.includes("professional"))) ||
        (formData.course === "cseet" &&
          (levelName.includes("cseet") || fsName.includes("cseet")));

      if (!levelMatch) return false;

      const attemptVal = (fs.attempt || "").toLowerCase();
      const attemptDisplay = (fs.attempt_display || "").toLowerCase();
      const attemptMatch =
        attemptVal === attemptKey ||
        attemptDisplay === attemptKey ||
        fsName.includes(attemptKey);

      if (!attemptMatch) return false;

      const yearMatch =
        String(fs.year || "") === yearKey ||
        fsName.includes(yearKey);

      return yearMatch;
    });

    setFeeCandidates(candidates);

    if (candidates.length === 0) {
      setMatchedFee(null);
      return;
    }

    let match: FeesStructure | null = null;

    if (formData.course === "cseet") {
      match =
        candidates.find(
          (fs) =>
            !fs.group_module ||
            fs.group_module === "" ||
            fs.group_module === "full" ||
            fs.group_module === "all"
        ) || candidates[0];
    } else {
      const group = formData.group_module; // "both", "module_1", "module_2"

      if (group === "both" || group === "all") {
        match =
          candidates.find(
            (fs) =>
              fs.group_module === "all" ||
              fs.group_module === "both" ||
              (fs.name && /both|all\s*module/i.test(fs.name))
          ) ||
          candidates.find(
            (fs) =>
              Number(fs.institute_fees_all_modules || fs.institute_fees_both_modules || 0) > 0
          ) ||
          candidates[0];
      } else if (group.startsWith("module_")) {
        const modKey = `institute_fees_${group}` as keyof FeesStructure;
        match =
          candidates.find(
            (fs) =>
              fs.group_module === group ||
              (fs.name && new RegExp(group.replace("_", "\\s*"), "i").test(fs.name))
          ) ||
          candidates.find((fs) => Number((fs as any)[modKey] || 0) > 0) ||
          candidates[0];
      } else {
        match = candidates.find((fs) => fs.group_module === group) || candidates[0];
      }
    }

    setMatchedFee(match || null);
    setFormData((prev) => ({
      ...prev,
      fee_structure: match?.id ? String(match.id) : "",
    }));
  }, [
    feeStructuresList,
    formData.course,
    formData.batch_attempt,
    formData.attempt_year,
    formData.group_module,
  ]);

interface ModuleOption {
  value: string;
  label: string;
}

  /* ─── Available Modules based on Course & Fee Structures ─────── */
  const availableModuleOptions: ModuleOption[] = useMemo<ModuleOption[]>(() => {
    if (formData.course === "cseet") {
      return [{ value: "full", label: "Full Syllabus" }];
    }

    const courseKey = formData.course.toLowerCase().replace(/_/g, " ");
    const attemptKey = (formData.batch_attempt || "").toLowerCase();
    const yearKey = String(formData.attempt_year || "");

    // 1. Look for active fee structures matching course, attempt, and year
    const exactCandidates = feeStructuresList.filter((fs) => {
      if (!fs.is_active) return false;
      const levelName = (fs.level_name || "").toLowerCase();
      const fsName = (fs.name || "").toLowerCase();
      const levelMatch =
        levelName.includes(courseKey) ||
        fsName.includes(courseKey) ||
        (formData.course === "cs_executive" &&
          (levelName.includes("executive") || fsName.includes("executive"))) ||
        (formData.course === "cs_professional" &&
          (levelName.includes("professional") || fsName.includes("professional")));

      if (!levelMatch) return false;

      const attemptVal = (fs.attempt || "").toLowerCase();
      const attemptDisplay = (fs.attempt_display || "").toLowerCase();
      const attemptMatch =
        attemptVal === attemptKey ||
        attemptDisplay === attemptKey ||
        fsName.includes(attemptKey);
      if (!attemptMatch) return false;

      const yearMatch = String(fs.year || "") === yearKey || fsName.includes(yearKey);
      return yearMatch;
    });

    // 2. Fallback to any active fee structures for this course
    const relevantStructures =
      exactCandidates.length > 0
        ? exactCandidates
        : feeStructuresList.filter((fs) => {
            if (!fs.is_active) return false;
            const levelName = (fs.level_name || "").toLowerCase();
            const fsName = (fs.name || "").toLowerCase();
            return (
              levelName.includes(courseKey) ||
              fsName.includes(courseKey) ||
              (formData.course === "cs_executive" &&
                (levelName.includes("executive") || fsName.includes("executive"))) ||
              (formData.course === "cs_professional" &&
                (levelName.includes("professional") || fsName.includes("professional")))
            );
          });

    // 3. Detect which module numbers exist in the fee structures
    const detectedModules: number[] = [];
    for (let i = 1; i <= 5; i++) {
      const hasModule = relevantStructures.some((fs) => {
        const fee = Number((fs as any)[`institute_fees_module_${i}`] || 0);
        if (fee > 0) return true;
        if (fs.group_module === `module_${i}`) return true;
        if (fs.name && new RegExp(`module\\s*${i}|module_${i}`, "i").test(fs.name)) return true;
        if (typeof fs.modules_count === "number" && fs.modules_count >= i) return true;
        return false;
      });
      if (hasModule) {
        detectedModules.push(i);
      }
    }

    // Default module numbers if no modules configured in fee structure yet
    const moduleNumbers =
      detectedModules.length > 0
        ? detectedModules
        : formData.course === "cs_executive"
        ? [1, 2]
        : formData.course === "cs_professional"
        ? [1, 2]
        : [1, 2];

    const options: ModuleOption[] = [];

    // Aggregate option for all / both modules
    if (moduleNumbers.length > 1) {
      if (moduleNumbers.length === 2) {
        options.push({ value: "both", label: "Both Modules" });
      } else {
        options.push({ value: "both", label: `All Modules (${moduleNumbers.length} Modules)` });
      }
    }

    // Individual module options
    moduleNumbers.forEach((num) => {
      options.push({ value: `module_${num}`, label: `Module ${num}` });
    });

    return options;
  }, [
    formData.course,
    formData.batch_attempt,
    formData.attempt_year,
    feeStructuresList,
  ]);

  const detectedModuleCount = useMemo(() => {
    const modOpts = availableModuleOptions.filter((opt: ModuleOption) => opt.value.startsWith("module_"));
    return modOpts.length > 0 ? modOpts.length : 2;
  }, [availableModuleOptions]);

  // Synchronize group_module with available options
  useEffect(() => {
    if (availableModuleOptions.length === 0) return;
    const validValues = availableModuleOptions.map((opt: ModuleOption) => opt.value);

    // If currently "all" and "both" is valid, normalize to "both"
    if (formData.group_module === "all" && validValues.includes("both")) {
      setFormData((prev) => ({ ...prev, group_module: "both" }));
      return;
    }

    // If current selection is not valid, reset to first option or "module_1"
    if (!validValues.includes(formData.group_module)) {
      const preferred = validValues.includes("module_1")
        ? "module_1"
        : validValues[0];
      setFormData((prev) => ({ ...prev, group_module: preferred }));
    }
  }, [availableModuleOptions, formData.group_module]);


  const nextStep = () => { setCurrentStep(p => min(p + 1, 4)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const prevStep = () => { setCurrentStep(p => max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const min = Math.min;
  const max = Math.max;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) {
      submitData(false);
    } else if (currentStep === 3) {
      submitData(true);
    }
  };

  /* ── Submit Steps 1-3 ── */
  const submitData = (isFinalStep: boolean) => {
    if (isFinalStep && !formData.consent) {
      toast.error("Please accept the consent to proceed.");
      return;
    }

    const payload = new FormData();

    // Append text fields (always)
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "fee_structure") {
        const id = value || (matchedFee?.id ? String(matchedFee.id) : "");
        if (id) payload.append(key, String(id));
        return;
      }
      if (key === "payment_mode") {
        if (value) payload.append("payment_choice", String(value));
        return;
      }
      if (key === "reference_name") {
        if (value) payload.append(key, String(value));
        return;
      }
      if (
        key === "tenth_percentage" ||
        key === "tenth_percentile" ||
        key === "twelfth_percentage" ||
        key === "twelfth_percentile"
      ) {
        if (value) payload.append(key, String(parseFloat(value as string)));
      } else if (key === "reference") {
        payload.append(key, String(value));
      } else {
        payload.append(key, String(value));
      }
    });

    // Ensure selected fee structure is attached to payload
    if (!payload.has("fee_structure") && matchedFee?.id) {
      payload.append("fee_structure", String(matchedFee.id));
    }

    // Append documents ONLY on step 3 (final application step before payment proof)
    if (isFinalStep) {
      if (docSignature) payload.append("doc_signature", docSignature);
      if (docPhoto) payload.append("doc_photo", docPhoto);
      if (docIdCard) payload.append("doc_id_card", docIdCard);
      if (docPanCard) payload.append("doc_pan_card", docPanCard);
      if (docDobCertificate) payload.append("doc_dob_certificate", docDobCertificate);
      if (doc12thReceipt) payload.append("doc_twelfth_receipt", doc12thReceipt);
      if (doc12thMarkSheet) payload.append("doc_twelfth_marksheet", doc12thMarkSheet);
      if (docCategoryCertificate) payload.append("doc_category_cert", docCategoryCertificate);
    }

    setLoading(true);

    const method = isFinalStep ? "POST" : (savedAdmissionId ? "PATCH" : "POST");
    const endpoint = savedAdmissionId
      ? API.ADMISSIONS.SUBMIT(savedAdmissionId)
      : API.ADMISSIONS.CREATE;

    dispatch({
      type: admissionActions.SUBMIT_ADMISSION,
      method: method,
      endPoint: endpoint,
      body: payload,
      auth: false,
      isFormData: true,
      setLoading: (val: boolean) => setLoading(val),
      getResponse: (res: any) => {
        // If an ID is returned, save it
        const newId = res?.data?.id || res?.id || res?.data?.data?.id;
        const validId = String(newId || savedAdmissionId || "");
        if (validId) {
          setSavedAdmissionId(validId);
          setSearchParams({ id: validId });
        }

        if (isFinalStep) {
          setIsSubmitted(true);
          toast.success("Admission details submitted successfully! Please proceed with payment proof.");

          // Pre-populate expected payment amount if empty
          const instFee = getInstituteFee(matchedFee, formData.course, formData.group_module);
          const tokenAmt = Number(matchedFee?.token_amount || 0);
          if (formData.payment_type === "token" && tokenAmt > 0) {
            setPaymentAmount((prev) => prev || String(tokenAmt));
          } else if (formData.payment_type === "full_payment" && instFee > 0) {
            setPaymentAmount((prev) => prev || String(instFee));
          }
          if (!paymentSubmittedAt) {
            setPaymentSubmittedAt(new Date().toISOString().slice(0, 16));
          }

          // Advance to Step 4
          setCurrentStep(4);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          nextStep();
        }
      },
      getError: (err: any) => {
        let msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.detail;
        if (!msg && err?.response?.data && typeof err.response.data === "object") {
          const firstKey = Object.keys(err.response.data)[0];
          const val = err.response.data[firstKey];
          msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
        }
        if (!msg) msg = err?.message || "Failed to save data. Please try again.";
        toast.error(msg);
      },
    });
  };

  /* ── Submit Payment Proof (Step 4 PATCH Request) ── */
  const handlePatchPaymentProof = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetId = savedAdmissionId || admissionId;
    if (!targetId) {
      toast.error("Admission ID is missing. Please save Step 1-3 first.");
      return;
    }

    if (!paymentAmount && !transactionId.trim() && !paymentScreenshot && !existingPaymentScreenshot) {
      toast.error("Please enter a payment amount, transaction ID, or upload a receipt screenshot.");
      return;
    }

    const payload = new FormData();
    if (transactionId.trim()) {
      payload.append("transaction_id", transactionId.trim());
    }
    if (paymentAmount) {
      payload.append("payment_amount", String(paymentAmount));
    }
    if (paymentNote.trim()) {
      payload.append("payment_note", paymentNote.trim());
    }

    const submittedTime = paymentSubmittedAt
      ? new Date(paymentSubmittedAt).toISOString()
      : new Date().toISOString();
    payload.append("payment_submitted_at", submittedTime);

    if (paymentScreenshot) {
      payload.append("payment_screenshot", paymentScreenshot);
    }

    setPaymentProofSubmitting(true);

    dispatch({
      type: admissionActions.SUBMIT_ADMISSION,
      method: "PATCH",
      endPoint: API.ADMISSIONS.SUBMIT(targetId),
      body: payload,
      auth: false,
      isFormData: true,
      setLoading: (val: boolean) => setPaymentProofSubmitting(val),
      getResponse: (res: any) => {
        const data = res?.data?.data || res?.data || res;
        setPaymentProofSuccess(true);
        if (data?.payment_screenshot) {
          setExistingPaymentScreenshot(data.payment_screenshot);
        }
        if (Array.isArray(data?.payment_history)) {
          setPaymentHistory(data.payment_history);
        }
        toast.success("Payment proof and transaction details submitted successfully!");
      },
      getError: (err: any) => {
        let msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.detail;
        if (!msg && err?.response?.data && typeof err.response.data === "object") {
          const firstKey = Object.keys(err.response.data)[0];
          const val = err.response.data[firstKey];
          msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
        }
        if (!msg) msg = err?.message || "Failed to submit payment details. Please try again.";
        toast.error(msg);
      },
    });
  };

  /* ────────────────────────────────────────────────────────────
     FORM
     ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8"
      style={{
        background: `linear-gradient(180deg, ${T.surface} 0%, ${T.primaryLight}30 100%)`,
        fontFamily: T.bodyFont,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-6 sm:mb-8">
          <img
            src={logo}
            alt="Insight ERP"
            className="h-16 sm:h-20 object-contain mx-auto mb-4 sm:mb-5"
          />
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: T.navy, fontFamily: T.headingFont }}
          >
            Student Admission Form
          </h1>
          <p className="mt-2 text-sm sm:text-base max-w-md mx-auto" style={{ color: T.textMuted }}>
            Complete the registration form below to confirm your admission
          </p>

          {/* ── Admission Status / Switch Banner ── */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {savedAdmissionId || admissionId ? (
              <>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Admission ID: <strong>#{savedAdmissionId || admissionId}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInputAdmissionId(savedAdmissionId || admissionId || "");
                    setEntryMode("resume");
                    setIsChoiceModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-sm hover:shadow cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-amber-600" />
                  <span>Change Admission ID</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartNewAdmission}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm hover:shadow cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-gray-500" />
                  <span>Start New Admission Form</span>
                </button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500/10 text-amber-900 border border-amber-300/80">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>New Admission Form</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInputAdmissionId("");
                    setEntryMode("resume");
                    setIsChoiceModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-sm hover:shadow cursor-pointer"
                >
                  <FileEdit className="w-4 h-4 text-amber-600" />
                  <span>Incomplete admission form? <strong>Enter Admission ID</strong></span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Choice & Resume Admission Modal ── */}
        <Dialog open={isChoiceModalOpen} onOpenChange={setIsChoiceModalOpen}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-2xl">
            {/* Header */}
            <div
              className="px-6 pt-6 pb-5 text-white"
              style={{
                background: `linear-gradient(135deg, ${T.navy} 0%, #001733 100%)`,
                borderBottom: `3px solid ${T.primary}`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                  style={{ background: "rgba(247,169,0,0.2)" }}
                >
                  <GraduationCap className="w-5 h-5" style={{ color: T.primary }} />
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400">
                    INSIGHT CS Classes
                  </span>
                  <DialogTitle className="text-lg sm:text-xl font-bold leading-tight text-white" style={{ fontFamily: T.headingFont }}>
                    Student Admission Form
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-gray-300">
                {entryMode === "select"
                  ? "Please select how you would like to proceed with your admission:"
                  : "Enter your Admission ID below to retrieve your saved details and continue."}
              </DialogDescription>
            </div>

            <div className="p-6">
              {entryMode === "select" ? (
                <div className="space-y-3.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Select Admission Option
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option 1: New Admission Form */}
                    <div
                      onClick={() => {
                        handleStartNewAdmission();
                      }}
                      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 border-gray-200 hover:border-amber-400 bg-white hover:bg-amber-50/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-800 mb-3 group-hover:scale-105 transition-transform">
                          <Sparkles className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full mb-1.5">
                          Fresh Form
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                          New Admission Form
                        </h3>
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                          Start a fresh admission application from Step 1.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-bold text-amber-800 group-hover:underline">
                        <span>Start New Admission</span>
                        <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>

                    {/* Option 2: Incomplete Admission Form */}
                    <div
                      onClick={() => {
                        setInputAdmissionId(savedAdmissionId || admissionId || "");
                        setEntryMode("resume");
                      }}
                      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-800 mb-3 group-hover:scale-105 transition-transform">
                          <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full mb-1.5">
                          Details Saved
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          Incomplete Admission Form
                        </h3>
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                          Already started? Enter your <strong>Admission ID</strong> to continue.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-bold text-blue-700 group-hover:underline">
                        <span>Enter Admission ID</span>
                        <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Resume Incomplete Admission Form View */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadAdmissionById(inputAdmissionId);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="resume_admission_id" className="text-xs sm:text-sm font-semibold" style={{ color: T.text }}>
                      Admission ID <span style={{ color: T.error }}>*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="resume_admission_id"
                        type="text"
                        required
                        placeholder="e.g. 1042"
                        value={inputAdmissionId}
                        onChange={(e) => setInputAdmissionId(e.target.value)}
                        disabled={loadingExisting}
                        className="h-11 pl-9 text-sm font-semibold"
                        autoFocus
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={loadingExisting}
                      onClick={() => setEntryMode("select")}
                      className="w-full sm:w-auto h-10 px-3 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      Back to Options
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loadingExisting}
                        onClick={() => setIsChoiceModalOpen(false)}
                        className="h-10 px-4 text-xs font-semibold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loadingExisting || !inputAdmissionId.trim()}
                        className="h-10 px-5 text-xs font-semibold text-black"
                        style={{ background: T.primary }}
                      >
                        {loadingExisting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading Admission...
                          </>
                        ) : (
                          "Load Admission"
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Stepper ── */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {[
              { num: 1, label: "Personal Info" },
              { num: 2, label: "Course Info" },
              { num: 3, label: "Documents" },
              { num: 4, label: "Payment Proof" },
            ].map((step, idx) => {
              const isClickable = Boolean(savedAdmissionId) || step.num <= currentStep;
              return (
                <React.Fragment key={step.num}>
                  <div
                    className={`flex flex-col items-center ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() => {
                      if (isClickable) {
                        setCurrentStep(step.num);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-colors duration-300 ${
                        currentStep >= step.num
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-gray-200 !text-white !important'
                      }`}
                      style={{
                        background: currentStep >= step.num ? T.primary : T.grayLight,
                        color: currentStep >= step.num ? T.black : T.textMuted,
                      }}
                    >
                      {step.num}
                    </div>
                    <span
                      className="text-xs sm:text-sm mt-1.5 font-medium hidden sm:block"
                      style={{ color: currentStep >= step.num ? T.black : T.textMuted }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`w-6 sm:w-10 md:w-16 h-1 rounded-full transition-colors duration-300 mb-5 sm:mb-6 ${
                        currentStep > step.num ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                      style={{ background: currentStep > step.num ? T.primary : T.grayLight }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <form onSubmit={currentStep === 4 ? handlePatchPaymentProof : handleNext} className="space-y-5 sm:space-y-6">
          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 1: PERSONAL INFO                                 */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <>
          {/* ════════════════════════════════════════════════════════ */}
          {/*  PERSONAL INFORMATION                                  */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={User} title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  First Name <span style={{ color: T.error }}>*</span>
                </Label>
                <Input
                  required
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. Tulsi"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Surname <span style={{ color: T.error }}>*</span>
                </Label>
                <Input
                  required
                  value={formData.surname}
                  onChange={(e) => handleChange("surname", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. Kerai"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Father's Name
                </Label>
                <Input
                  value={formData.father_name}
                  onChange={(e) => handleChange("father_name", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. Harji"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Mother's Name
                </Label>
                <Input
                  value={formData.mother_name}
                  onChange={(e) => handleChange("mother_name", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. Jashuben"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Date of Birth <span style={{ color: T.error }}>*</span>
                </Label>
                <Input
                  required
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => handleChange("category", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gen">General</SelectItem>
                    <SelectItem value="obc">OBC</SelectItem>
                    <SelectItem value="sc_st">SC / ST</SelectItem>
                    {/* <SelectItem value="st">ST</SelectItem> */}
                    {/* <SelectItem value="ews">EWS</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact info sub-section */}
            <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
              <SubSection icon={Phone} title="Contact Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Student Phone <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    type="tel"
                    value={formData.phone_student}
                    onChange={(e) => handleChange("phone_student", e.target.value)}
                    className="h-10 sm:h-11 text-sm"
                    placeholder="e.g. 9954563258"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Father's Phone
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone_father}
                    onChange={(e) => handleChange("phone_father", e.target.value)}
                    className="h-10 sm:h-11 text-sm"
                    placeholder="e.g. 9978221566"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Student Email <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="h-10 sm:h-11 text-sm"
                    placeholder="e.g. tulikerai06@gmail.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Parent Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email_parent}
                    onChange={(e) => handleChange("email_parent", e.target.value)}
                    className="h-10 sm:h-11 text-sm"
                    placeholder="e.g. parent@gmail.com"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
          {/* ════════════════════════════════════════════════════════ */}
          {/*  ADDRESS DETAILS                                       */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={MapPin} title="Address Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Street Address
                </Label>
                <Input
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. 45, main road"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  City
                </Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. Bhuj"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  State
                </Label>
                <Input
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. Kutch"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Pincode
                </Label>
                <Input
                  value={formData.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. 370001"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Country
                </Label>
                <Input
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. India"
                />
              </div>
            </div>
          </SectionCard>
          {/* ════════════════════════════════════════════════════════ */}
          {/*  ACADEMIC BACKGROUND                                   */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={GraduationCap} title="Past Academic Background">
            <div className="space-y-6 sm:space-y-8">
              {/* 10th */}
              <div>
                <SubSection icon={School} title="10th Standard Details" />
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5 rounded-xl"
                  style={{ background: `${T.primaryLight}50`, border: `1px solid ${T.border}` }}
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Board/Medium
                    </Label>
                    <Select
                      value={formData.tenth_medium}
                      onValueChange={(val) => handleChange("tenth_medium", val)}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gseb">GSEB</SelectItem>
                        <SelectItem value="cbse">CBSE</SelectItem>
                        <SelectItem value="icse">ICSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      School Name
                    </Label>
                    <Input
                      value={formData.tenth_school}
                      onChange={(e) => handleChange("tenth_school", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="School name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Coaching Institute
                    </Label>
                    <Input
                      value={formData.tenth_coaching}
                      onChange={(e) => handleChange("tenth_coaching", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="Coaching name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Percentage (%)
                    </Label>
                    <Input
                      type="number" min="0" max="100"
                      step="0.01"
                      value={formData.tenth_percentage}
                      onChange={(e) => handleChange("tenth_percentage", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="e.g. 86.16"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Percentile
                    </Label>
                    <Input
                      type="number" min="0" max="100"
                      step="0.01"
                      value={formData.tenth_percentile}
                      onChange={(e) => handleChange("tenth_percentile", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="e.g. 95.42"
                    />
                  </div>
                </div>
              </div>

              {/* 12th */}
              <div>
                <SubSection icon={Award} title="12th Standard Details" />
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5 rounded-xl"
                  style={{ background: `${T.primaryLight}50`, border: `1px solid ${T.border}` }}
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Board/Medium
                    </Label>
                    <Select
                      value={formData.twelfth_medium}
                      onValueChange={(val) => handleChange("twelfth_medium", val)}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gseb">GSEB</SelectItem>
                        <SelectItem value="cbse">CBSE</SelectItem>
                        <SelectItem value="icse">ICSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      School Name
                    </Label>
                    <Input
                      value={formData.twelfth_school}
                      onChange={(e) => handleChange("twelfth_school", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="School name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Coaching Institute
                    </Label>
                    <Input
                      value={formData.twelfth_coaching}
                      onChange={(e) => handleChange("twelfth_coaching", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="Coaching name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Percentage (%)
                    </Label>
                    <Input
                      type="number" min="0" max="100"
                      step="0.01"
                      value={formData.twelfth_percentage}
                      onChange={(e) => handleChange("twelfth_percentage", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="e.g. 80.16"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Percentile
                    </Label>
                    <Input
                      type="number" min="0" max="100"
                      step="0.01"
                      value={formData.twelfth_percentile}
                      onChange={(e) => handleChange("twelfth_percentile", e.target.value)}
                      className="h-10 sm:h-11 text-sm bg-white"
                      placeholder="e.g. 95.42"
                    />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
          {/* ════════════════════════════════════════════════════════ */}
          {/*  OTHER DETAILS                                         */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={Megaphone} title="Other Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  How did you hear about us?
                </Label>
                <Select
                  value={formData.reference}
                  onValueChange={(val) => handleChange("reference", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="existing">Existing Student</SelectItem>
                    <SelectItem value="offline_ad">Offline Ad</SelectItem>
                    <SelectItem value="social_media">Social Media - Instagram / Whatsapp</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="other">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.reference === "other" && (
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Please specify <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    value={formData.reference_name}
                    onChange={(e) => handleChange("reference_name", e.target.value)}
                    className="h-10 sm:h-11 text-sm bg-white"
                    placeholder="e.g. From a friend"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Inquiry Date
                </Label>
                <Input
                  type="date"
                  value={formData.inquiry_date}
                  onChange={(e) => handleChange("inquiry_date", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Location
                </Label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="h-10 sm:h-11 text-sm"
                  placeholder="e.g. Naranpura (Ahmedabad)"
                />
              </div>
            </div>
          </SectionCard>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading} className="h-12 px-8 font-semibold" style={{ background: T.primary, color: T.black }}>
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    "Next: Course Info"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 2: COURSE & ACADEMIC INFO                        */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <>
          {/* ════════════════════════════════════════════════════════ */}
          {/*  ACADEMIC PREFERENCES                                  */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={GraduationCap} title="Academic Preferences">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Qualification */}
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Current Qualification <span style={{ color: T.error }}>*</span>
                </Label>
                <Select
                  value={formData.qualification}
                  onValueChange={(val) => handleChange("qualification", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appearing_12">Appearing 12th</SelectItem>
                    <SelectItem value="pass_12">Passed 12th</SelectItem>
                    <SelectItem value="cseet_pass">CSEET Pass</SelectItem>
                    <SelectItem value="cs_executive_pass">CS Executive Pass</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                    <SelectItem value="post_graduate">Post Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Course <span style={{ color: T.error }}>*</span>
                </Label>
                <Select
                  value={formData.course}
                  onValueChange={(val) => handleChange("course", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["appearing_12", "pass_12"].includes(formData.qualification) && (
                      <SelectItem value="cseet">CSEET</SelectItem>
                    )}
                    {["cseet_pass", "graduate", "post_graduate"].includes(formData.qualification) && (
                      <SelectItem value="cs_executive">CS Executive</SelectItem>
                    )}
                    {formData.qualification === "cs_executive_pass" && (
                      <SelectItem value="cs_professional">CS Professional</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Batch Attempt
                </Label>
                <Select
                  value={formData.batch_attempt}
                  onValueChange={(val) => handleChange("batch_attempt", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.course === "cseet" ? (
                      <>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="oct">October</SelectItem>
                        <SelectItem value="feb">February</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="dec">December</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Attempt Year <span style={{ color: T.error }}>*</span>
                </Label>
                <Select
                  value={formData.attempt_year}
                  onValueChange={(val) => handleChange("attempt_year", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Group Module
                </Label>
                <Select
                  value={formData.group_module}
                  onValueChange={(val) => handleChange("group_module", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModuleOptions.map((opt: ModuleOption) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Payment Type <span style={{ color: T.error }}>*</span>
                </Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(val) => handleChange("payment_type", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_payment">Full Payment</SelectItem>
                    <SelectItem value="token">Token Payment</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.payment_type === "token" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Token Payment Mode <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Select
                    value={formData.payment_mode || "online"}
                    onValueChange={(val) => handleChange("payment_mode", val)}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-sm">
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  ICSI Fees Payment <span style={{ color: T.error }}>*</span>
                </Label>
                <Select
                  value={formData.icsi_fees_payment}
                  onValueChange={(val) => handleChange("icsi_fees_payment", val)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pay_yourself">Pay Yourself</SelectItem>
                    <SelectItem value="pay_through_institute">Pay through Institute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════════════════ */}
          {/*  FEE BREAKDOWN                                         */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={CreditCard} title="Fee Breakdown">
            <div className="space-y-4">
              {loadingFees && !matchedFee ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: T.primaryDark }} />
                  <span>Loading fee structure...</span>
                </div>
              ) : matchedFee ? (
                <>
                  {/* Level & Structure Info Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Fee Structure</span>
                    </div>
                    {feeCandidates.length > 1 ? (
                      <Select
                        value={String(matchedFee.id)}
                        onValueChange={(val) => {
                          const chosen = feeCandidates.find((c) => String(c.id) === String(val));
                          if (chosen) {
                            setMatchedFee(chosen);
                            setFormData((prev) => ({ ...prev, fee_structure: String(chosen.id) }));
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs sm:text-sm font-semibold w-auto min-w-[200px] bg-background">
                          <SelectValue placeholder="Select Fee Structure" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeCandidates.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name || c.level_name || `Structure #${c.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-left sm:text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {matchedFee.name || matchedFee.level_name || "—"}
                        </span>
                        {matchedFee.name && matchedFee.level_name && (
                          <span className="text-xs text-muted-foreground block">
                            Level: {matchedFee.level_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Pay to Institute Section ── */}
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/20 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: T.primaryDark }} />
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          Pay to Institute
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {/* CSEET: Institute Fee */}
                      {formData.course === "cseet" && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Institute Fee</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(getInstituteFee(matchedFee, formData.course, formData.group_module))}
                          </span>
                        </div>
                      )}

                      {/* CS Exec / Prof: Module-based Institute Fees */}
                      {formData.course !== "cseet" && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            Institute Fee (
                            {availableModuleOptions.find((o: ModuleOption) => o.value === formData.group_module)?.label ||
                              (formData.group_module === "both"
                                ? (detectedModuleCount === 2 ? "Both Modules" : "All Modules")
                                : formData.group_module.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))}
                            )
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(getInstituteFee(matchedFee, formData.course, formData.group_module))}
                          </span>
                        </div>
                      )}

                      {/* ICSI fees included when paying through institute */}
                      {formData.icsi_fees_payment === "pay_through_institute" && (
                        <>
                          {formData.course === "cseet" && (
                            <>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">ICSI Registration Fees</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">ICSI Exam Fees</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(getIcsiExamFees(matchedFee, feeCandidates))}
                                </span>
                              </div>
                            </>
                          )}
                          {formData.course === "cs_executive" && (
                            <>
                              {formData.qualification === "cseet_pass" && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">ICSI Reg. Fees (Via CSEET)</span>
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                                  </span>
                                </div>
                              )}
                              {["graduate", "post_graduate"].includes(formData.qualification) && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">ICSI Reg. Fees (Direct Entry)</span>
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          {formData.course === "cs_professional" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">ICSI Registration Fees</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                              </span>
                            </div>
                          )}
                          {formData.course !== "cseet" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">ICSI Exam Fees (Per Module)</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(getIcsiExamFees(matchedFee, feeCandidates) * (formData.course !== "cseet" && (formData.group_module === "both" || formData.group_module === "all") ? detectedModuleCount : 1))}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {/* ── Total Payable / Payment Breakdown ── */}
                      {(() => {
                        const instituteFee = getInstituteFee(matchedFee, formData.course, formData.group_module);
                        let totalPayable = instituteFee;
                        if (formData.icsi_fees_payment === "pay_through_institute") {
                          const regFee = getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates);
                          const examFee = getIcsiExamFees(matchedFee, feeCandidates) * (formData.course !== "cseet" && (formData.group_module === "both" || formData.group_module === "all") ? detectedModuleCount : 1);
                          totalPayable += regFee + examFee;
                        }
                        const tokenAmt = Number(matchedFee?.token_amount || 0);
                        const remainingFees = Math.max(0, instituteFee - tokenAmt);

                        if (formData.payment_type === "token") {
                          return (
                            <div className="pt-3 mt-1 border-t border-border/50 space-y-3">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Institute Course Fee</span>
                                <span className="font-medium text-foreground">{formatCurrency(instituteFee)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm bg-amber-500/10 dark:bg-amber-500/20 px-3 py-2 rounded-lg border border-amber-300/60">
                                <div>
                                  <span className="font-semibold text-amber-900 dark:text-amber-200 block">Token Amount (Payable Now)</span>
                                  <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                                    {formData.payment_mode === "cash"
                                      ? "Cash payment at branch office"
                                      : formData.payment_mode === "cheque"
                                        ? "Cheque payment at branch office"
                                        : "Via Razorpay link sent to Email & WhatsApp"}
                                  </span>
                                </div>
                                <span className="text-base font-bold text-amber-700 dark:text-amber-300">
                                  {formatCurrency(tokenAmt)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <div>
                                  <span className="font-semibold text-foreground block">Remaining Fees</span>
                                  <span className="text-[11px] text-muted-foreground">Institute Fee − Token Amount</span>
                                </div>
                                <span className="text-base font-bold text-foreground">
                                  {formatCurrency(remainingFees)}
                                </span>
                              </div>
                              <div className="rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3.5 space-y-1">
                                <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>15-Day Policy Notice</span>
                                </div>
                                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                  In 15 days you have to pay remaining fees (<strong>{formatCurrency(remainingFees)}</strong>) otherwise it will be considered as Finance.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        if (formData.payment_type === "finance") {
                          return (
                            <div className="pt-3 mt-1 border-t border-border/50 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-foreground">Total Course Fee</span>
                                <span className="text-base font-bold" style={{ color: T.primaryDark }}>
                                  {formatCurrency(totalPayable)}
                                </span>
                              </div>
                              <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3.5 space-y-1">
                                <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                  <span>Finance / Loan Option</span>
                                </div>
                                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                  No online payment link will be generated. Our admissions team will contact you to assist with EMI / loan documentation and approval.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="pt-3 mt-1 border-t border-border/50 space-y-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-sm font-semibold text-foreground block">Total Payable to Institute</span>
                                <span className="text-[11px] text-muted-foreground">Full payment Razorpay link will be emailed</span>
                              </div>
                              <span className="text-base font-bold" style={{ color: T.primaryDark }}>
                                {formatCurrency(totalPayable)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── Pay by Yourself (ICSI) Section ── */}
                  {formData.icsi_fees_payment === "pay_yourself" && (
                    <div className="rounded-xl border border-amber-500/30 overflow-hidden bg-amber-50/30 dark:bg-amber-950/10 mt-4">
                      <div className="px-4 py-2.5 bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Pay by Yourself (Directly to ICSI)
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-2.5">
                        {formData.course === "cseet" && (
                          <>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Registration Fees</span>
                              <span className="font-medium text-amber-800 dark:text-amber-300">
                                {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Exam Fees</span>
                              <span className="font-medium text-amber-800 dark:text-amber-300">
                                {formatCurrency(getIcsiExamFees(matchedFee, feeCandidates))}
                              </span>
                            </div>
                          </>
                        )}
                        {formData.course === "cs_executive" && (
                          <>
                            {formData.qualification === "cseet_pass" && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Reg. Fees (Via CSEET)</span>
                                <span className="font-medium text-amber-800 dark:text-amber-300">
                                  {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                                </span>
                              </div>
                            )}
                            {["graduate", "post_graduate"].includes(formData.qualification) && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Reg. Fees (Direct Entry)</span>
                                <span className="font-medium text-amber-800 dark:text-amber-300">
                                  {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {formData.course === "cs_professional" && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Registration Fees</span>
                            <span className="font-medium text-amber-800 dark:text-amber-300">
                              {formatCurrency(getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates))}
                            </span>
                          </div>
                        )}
                        {formData.course !== "cseet" && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Exam Fees (Per Module)</span>
                            <span className="font-medium text-amber-800 dark:text-amber-300">
                              {formatCurrency(getIcsiExamFees(matchedFee, feeCandidates) * (formData.course !== "cseet" && (formData.group_module === "both" || formData.group_module === "all") ? detectedModuleCount : 1))}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 pt-2 mt-1 border-t border-amber-500/20">
                          <Info className="w-3.5 h-3.5 mt-0.5 text-amber-600/70 dark:text-amber-400/70 shrink-0" />
                          <span className="text-xs text-amber-700/80 dark:text-amber-400/70">
                            These fees are to be paid directly to ICSI by you. They are not included in the institute total above.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <CreditCard className="w-7 h-7 text-muted-foreground/40" />
                  <span className="font-medium">No fee structure found for this combination</span>
                  <span className="text-xs text-muted-foreground/60">Standard fees will apply upon submission.</span>
                </div>
              )}
            </div>
          </SectionCard>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8 font-semibold">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="h-12 px-8 font-semibold" style={{ background: T.primary, color: T.black }}>
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    "Next: Documents"
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 3: DOCUMENTS & SUBMIT                            */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <>
          {/* ════════════════════════════════════════════════════════ */}
          {/*  DOCUMENT UPLOADS                                      */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={FileImage} title="Document Uploads">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FileUploadField
                label="Signature Upload"
                icon={PenTool}
                file={docSignature}
                onFileChange={setDocSignature}
                existingUrl={existingDocs.doc_signature}
                // required
              />
              <FileUploadField
                label="Your Passport Size Photo Upload"
                icon={Camera}
                file={docPhoto}
                onFileChange={setDocPhoto}
                existingUrl={existingDocs.doc_photo}
                // required
              />
              <FileUploadField
                label="Aadhar Card"
                icon={CreditCard}
                file={docIdCard}
                onFileChange={setDocIdCard}
                existingUrl={existingDocs.doc_id_card}
                // required
              />
              <FileUploadField
                label="PAN Card"
                icon={CreditCard}
                file={docPanCard}
                onFileChange={setDocPanCard}
                existingUrl={existingDocs.doc_pan_card}
                // required
              />
              <FileUploadField
                label="10th Marksheet"
                icon={Baby}
                file={docDobCertificate}
                onFileChange={setDocDobCertificate}
                existingUrl={existingDocs.doc_dob_certificate}
                // required
              />
              <FileUploadField
                label="12th Receipt / Hall Ticket (if Appearing in 10+2)"
                icon={FileCheck}
                file={doc12thReceipt}
                onFileChange={setDoc12thReceipt}
                existingUrl={existingDocs.doc_twelfth_receipt}
                // required
              />
              <FileUploadField
                label="12th Passing Certificate / Marksheet"
                icon={GraduationCap}
                file={doc12thMarkSheet}
                onFileChange={setDoc12thMarkSheet}
                existingUrl={existingDocs.doc_twelfth_marksheet}
                // required
              />
              <FileUploadField
                label="Category Certificate (if belonging to SC/ST or Physically Handicapped Category)"
                icon={BadgeCheck}
                file={docCategoryCertificate}
                onFileChange={setDocCategoryCertificate}
                existingUrl={existingDocs.doc_category_cert}
                // required
              />
            </div>
          </SectionCard>
          {/* ── Consent & Submit ── */}
          <div
            className="rounded-2xl p-4 sm:p-6"
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="flex items-start sm:items-center gap-3 mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl"
              style={{ background: T.primaryLight, border: `1px solid ${T.primary}30` }}
            >
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) => handleChange("consent", checked as boolean)}
                className="w-5 h-5 mt-0.5 sm:mt-0 flex-shrink-0"
              />
              <label
                htmlFor="consent"
                className="text-xs sm:text-sm font-medium leading-snug cursor-pointer"
                style={{ color: T.text }}
              >
                I hereby declare that all the information provided above is true and correct to the
                best of my knowledge. I agree to be contacted by the institute for admission-related
                communication.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold text-black transition-all duration-200"
              style={{
                background: formData.consent && !loading ? T.primary : T.textMuted,
                boxShadow:
                  formData.consent && !loading ? "0 4px 14px rgba(247,169,0,0.25)" : "none",
              }}
              disabled={loading || !formData.consent}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting Admission...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Submit Admission & Proceed to Payment Proof
                </>
              )}
            </Button>
          </div>
              <div className="flex justify-start -mt-2 mb-6 px-4">
                 <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8 font-semibold">
                  Back to Course Info
                </Button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 4: PAYMENT PROOF & CONFIRMATION                  */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* ── Confirmation Summary Header Card ── */}
              <div
                className="rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden"
                style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: "0 10px 40px rgba(0,33,71,0.08)" }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${T.success}15 0%, ${T.success}25 100%)`,
                  }}
                >
                  <CheckCircle2 className="w-10 h-10" style={{ color: T.success }} />
                </div>

                <h2
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: T.black, fontFamily: T.headingFont }}
                >
                  Admission Submitted!
                </h2>
                <p className="text-sm sm:text-base mb-6" style={{ color: T.text }}>
                  Your registration form has been received successfully.
                </p>

                {/* Admission Details Summary */}
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/60 text-xs sm:text-sm text-left max-w-lg mx-auto space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="text-muted-foreground font-medium">Admission ID</span>
                    <span className="font-mono font-bold text-foreground text-sm">#{savedAdmissionId || "Submitted"}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="text-muted-foreground font-medium">Course & Attempt</span>
                    <span className="font-semibold text-foreground uppercase">
                      {formData.course?.replace(/_/g, " ")} ({formData.batch_attempt} {formData.attempt_year})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Payment Plan</span>
                    <span className="font-semibold capitalize text-foreground">
                      {formData.payment_type === "token"
                        ? `Token Payment (${formData.payment_mode === "cash" ? "Cash" : formData.payment_mode === "cheque" ? "Cheque" : "Online"})`
                        : formData.payment_type === "full_payment"
                          ? "Full Payment"
                          : "Finance Assistance"}
                    </span>
                  </div>
                </div>

                {/* Conditional Payment Guidance Card */}
                {(() => {
                  const instFee = getInstituteFee(matchedFee, formData.course, formData.group_module);
                  const tokenAmt = Number(matchedFee?.token_amount || 0);
                  const remFees = Math.max(0, instFee - tokenAmt);
                  let fullTotal = instFee;
                  if (formData.icsi_fees_payment === "pay_through_institute") {
                    const regFee = getIcsiRegFees(matchedFee, formData.qualification, formData.course, feeCandidates);
                    const examFee = getIcsiExamFees(matchedFee, feeCandidates) * (formData.course !== "cseet" && (formData.group_module === "both" || formData.group_module === "all") ? detectedModuleCount : 1);
                    fullTotal += regFee + examFee;
                  }

                  if (formData.payment_type === "token") {
                    const isCash = formData.payment_mode === "cash";
                    const isCheque = formData.payment_mode === "cheque";

                    return (
                      <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-left my-4 max-w-lg mx-auto space-y-2.5">
                        <div className="flex items-center gap-2 font-semibold text-amber-900 text-sm">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            {isCash
                              ? "Token Payment (Cash Selected)"
                              : isCheque
                                ? "Token Payment (Cheque Selected)"
                                : "Token Payment Link Sent"}
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          {isCash ? (
                            <>
                              Token payment of <strong>{formatCurrency(tokenAmt)}</strong> selected in <strong>Cash</strong>. Please submit cash or upload deposit receipt below.
                            </>
                          ) : isCheque ? (
                            <>
                              Token payment of <strong>{formatCurrency(tokenAmt)}</strong> selected via <strong>Cheque</strong>{formData.cheque_no ? ` (${formData.cheque_no})` : ""}. Please submit your cheque or upload cheque photo below.
                            </>
                          ) : (
                            <>
                              A secure Razorpay payment link for the token amount (<strong>{formatCurrency(tokenAmt)}</strong>) has been generated and sent to <strong>{formData.email}</strong> and WhatsApp.
                            </>
                          )}
                        </p>
                        <div className="pt-2 border-t border-amber-200 text-xs text-amber-900 font-medium">
                          ⚠️ <strong>Notice Regarding Remaining Fees:</strong> In 15 days you have to pay remaining fees (<strong>{formatCurrency(remFees)}</strong>) otherwise it will be considered as Finance.
                        </div>
                      </div>
                    );
                  }

                  if (formData.payment_type === "full_payment") {
                    return (
                      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 text-left my-4 max-w-lg mx-auto space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Full Payment Link Sent</span>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          A secure payment link for <strong>{formatCurrency(fullTotal)}</strong> has been generated and sent to <strong>{formData.email}</strong> and WhatsApp. You can also upload your payment proof below.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-left my-4 max-w-lg mx-auto space-y-1.5">
                      <div className="flex items-center gap-2 font-semibold text-blue-900 text-sm">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Finance Application In Review</span>
                      </div>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        No immediate payment is required. Our admissions counsellor will get in touch with you within 24–48 hours to complete your finance/EMI approval. You may optionally upload any advance voucher or down-payment proof below.
                      </p>
                    </div>
                  );
                })()}

                {/* Active Razorpay Quick Pay Action */}
                {razorpayPaymentLink && (
                  <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-2 border-amber-400 max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-sm">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        Razorpay Payment Link Ready
                      </span>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Pay securely with UPI, Debit/Credit Card, or Netbanking.
                      </p>
                    </div>
                    <a
                      href={razorpayPaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-black bg-amber-400 hover:bg-amber-500 shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      <span>Pay Token Now</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                )}

                <p className="text-xs text-muted-foreground my-3 max-w-lg mx-auto leading-relaxed">
                  Prefer direct UPI or bank transfer? You can upload your payment receipt and enter the transaction reference ID below to complete your admission confirmation.
                </p>
              </div>

              {/* ── Section: Payment History & Transactions ── */}
              <SectionCard icon={History} title="Payment History & Transactions">
                <div className="space-y-4">
                  {paymentHistory && paymentHistory.length > 0 ? (
                    <div className="space-y-4">
                      {paymentHistory.map((item: any, idx: number) => {
                        const isPending = item.status === "pending" || !item.status;
                        const isPaid = item.status === "paid" || item.status === "success" || item.status === "completed";
                        const isFailed = item.status === "failed";
                        const eventLabel =
                          item.event === "payment_link_created"
                            ? "Online Payment Link Generated"
                            : item.event === "payment_received" || item.event === "paid"
                              ? "Payment Received & Confirmed"
                              : item.event === "proof_uploaded" || item.event === "payment_submitted"
                                ? "Payment Proof Submitted"
                                : (item.event || "Payment Transaction").replace(/_/g, " ");

                        return (
                          <div
                            key={idx}
                            className="rounded-2xl border p-4 sm:p-5 transition-all space-y-3.5"
                            style={{
                              background: isPaid ? "rgba(16, 185, 129, 0.04)" : isPending ? "rgba(245, 158, 11, 0.04)" : T.card,
                              borderColor: isPaid ? "rgba(16, 185, 129, 0.3)" : isPending ? "rgba(245, 158, 11, 0.35)" : T.border,
                            }}
                          >
                            {/* Top row: event label, time, status */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    background: isPaid ? "rgba(16, 185, 129, 0.15)" : isPending ? "rgba(245, 158, 11, 0.15)" : "rgba(0,0,0,0.06)",
                                  }}
                                >
                                  {isPaid ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : item.razorpay_payment_link ? (
                                    <Link2 className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-foreground capitalize">
                                    {eventLabel}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {item.timestamp || item.created_at
                                        ? new Date(item.timestamp || item.created_at).toLocaleString("en-IN", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                          })
                                        : item.date || "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Badge
                                variant="outline"
                                className={`self-start sm:self-auto text-xs font-semibold px-2.5 py-1 ${
                                  isPaid
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : isPending
                                      ? "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                                      : isFailed
                                        ? "bg-rose-50 text-rose-800 border-rose-300"
                                        : "bg-muted text-foreground"
                                }`}
                              >
                                {isPaid
                                  ? "✅ Paid / Verified"
                                  : isPending
                                    ? "⏳ Payment Pending"
                                    : isFailed
                                      ? "❌ Failed"
                                      : (item.status || "Recorded")}
                              </Badge>
                            </div>

                            {/* Amount & Plan Row */}
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <div>
                                <span className="text-[11px] text-muted-foreground block">
                                  Transaction Amount
                                </span>
                                <span className="text-xl sm:text-2xl font-black text-foreground" style={{ color: T.navy }}>
                                  {formatCurrency(Number(item.amount || item.token_amount || 0))}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-2.5 py-1 rounded-md bg-muted/60 font-medium text-foreground">
                                  {item.payment_type_display || item.payment_type || "Token Payment"}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-muted/60 font-medium text-foreground capitalize">
                                  Mode: {item.payment_choice_display || item.payment_choice || "Online"}
                                </span>
                              </div>
                            </div>

                            {/* Breakdown stat chips if available */}
                            {(item.total_fees != null || item.remaining_fees != null) && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs">
                                {item.total_fees != null && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px]">Total Course Fee</span>
                                    <span className="font-semibold text-foreground">
                                      {formatCurrency(Number(item.total_fees))}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground block text-[11px]">Payable / Token Amount</span>
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(Number(item.amount || item.token_amount || 0))}
                                  </span>
                                </div>
                                {item.remaining_fees != null && (
                                  <div>
                                    <span className="text-muted-foreground block text-[11px]">Remaining Balance</span>
                                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                                      {formatCurrency(Number(item.remaining_fees))}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Razorpay Online Link Box */}
                            {item.razorpay_payment_link && (
                              <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                                    <Link2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                                    <span>Razorpay Payment Link</span>
                                  </div>
                                  {item.razorpay_payment_link_id && (
                                    <span className="font-mono text-[11px] text-amber-800/80 dark:text-amber-300/80 block">
                                      ID: {item.razorpay_payment_link_id}
                                    </span>
                                  )}
                                </div>

                                <a
                                  href={item.razorpay_payment_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-500 shadow-sm transition-all shrink-0 cursor-pointer"
                                >
                                  <span>{isPaid ? "View Payment Link" : "Pay with Razorpay"}</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}

                            {/* Uploaded Receipt / Screenshot Proof */}
                            {(item.payment_screenshot || item.payment_proof) && (
                              <div className="flex items-center gap-2 pt-1 text-xs">
                                <Receipt className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Receipt Proof:</span>
                                <a
                                  href={item.payment_screenshot || item.payment_proof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                                >
                                  <span>View Document</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}

                            {/* Terms Note */}
                            {(item.terms_note || item.fee_terms_note) && (
                              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>{item.terms_note || item.fee_terms_note}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-muted/20 border border-dashed border-border/60 text-muted-foreground space-y-2">
                      <History className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-semibold text-foreground">No Payment History Recorded Yet</p>
                      <p className="text-xs max-w-md mx-auto">
                        When a payment link is created or you submit a transaction receipt, your complete payment audit log will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* ── Payment Proof Upload & Details Card ── */}
              <SectionCard icon={Receipt} title="Upload Payment Proof & Transaction Details">
                <div className="space-y-6">
                  {paymentProofSuccess && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="text-xs sm:text-sm space-y-1">
                        <p className="font-semibold">Payment Details Saved Successfully!</p>
                        <p className="text-emerald-800/90 dark:text-emerald-300/90">
                          Your payment reference <strong>{transactionId || `#${savedAdmissionId}`}</strong> has been recorded and submitted for verification by our accounts team.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Payment Amount */}
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Payment Amount Paid (₹) <span style={{ color: T.error }}>*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 sm:top-3 text-sm font-semibold text-muted-foreground pointer-events-none">
                          ₹
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="h-10 sm:h-11 pl-8 text-sm font-semibold"
                          placeholder="e.g. 20000"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Amount paid by the student ({formData.payment_type === "token" ? "Token amount" : "Full course fees"}).
                      </p>
                    </div>

                    {/* Transaction ID */}
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Transaction ID / Reference Number
                      </Label>
                      <Input
                        type="text"
                        maxLength={100}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="h-10 sm:h-11 text-sm font-mono"
                        placeholder="UPI Ref / UTR / Cheque No / Bank Ref"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        UPI / Bank transaction reference number.
                      </p>
                    </div>

                    {/* Payment Submitted Date & Time */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Payment Date & Time
                      </Label>
                      <Input
                        type="datetime-local"
                        value={paymentSubmittedAt ? paymentSubmittedAt.slice(0, 16) : ""}
                        onChange={(e) => setPaymentSubmittedAt(e.target.value)}
                        className="h-10 sm:h-11 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Date and time when payment was executed. Defaults to current timestamp.
                      </p>
                    </div>

                    {/* Payment Screenshot Upload */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <FileUploadField
                        label="Payment Screenshot / Receipt Upload"
                        icon={Receipt}
                        file={paymentScreenshot}
                        onFileChange={setPaymentScreenshot}
                        existingUrl={existingPaymentScreenshot}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Upload screenshot or photo of UPI payment receipt, bank transfer slip, or deposit receipt (JPG, PNG, PDF).
                      </p>
                    </div>

                    {/* Payment Note */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Payment Note <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <Textarea
                        rows={3}
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="Optional note from student regarding payment (e.g., Paid via PhonePe from Father's account, Cheque deposited at branch, etc.)."
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="w-full sm:w-auto h-12 px-6 font-semibold"
                    >
                      Back to Documents
                    </Button>

                    <Button
                      type="submit"
                      disabled={paymentProofSubmitting}
                      className="w-full sm:flex-1 h-12 text-sm sm:text-base font-semibold text-black transition-all"
                      style={{
                        background: T.primary,
                        boxShadow: "0 4px 14px rgba(247,169,0,0.25)",
                      }}
                    >
                      {paymentProofSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting Payment Proof...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          {paymentProofSuccess ? "Update Payment Proof Details" : "Submit Payment Proof"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}
        </form>

        {/* ── Footer ── */}
        <p className="text-center mt-6 sm:mt-8 text-xs" style={{ color: T.textMuted }}>
          Your data is secure and will only be used for admission-related communication.
        </p>
      </div>
    </div>
  );
}


