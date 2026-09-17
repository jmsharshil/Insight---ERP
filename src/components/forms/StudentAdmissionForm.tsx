import React, { useState, useEffect, useRef } from "react";
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
      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
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
          accept="image/*"
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
                {(file.size / 1024).toFixed(1)} KB
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
  const [searchParams] = useSearchParams();
  const admissionId = searchParams.get("id") || "";

  const [savedAdmissionId, setSavedAdmissionId] = useState<string | null>(admissionId || null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);


  // Fetch locations dropdown
  const {
    options: locations,
    loading: locationsLoading,
    fetchOptions: fetchLocations,
  } = useDropdown("locations", false);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

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
    icsi_fees_payment: "pay_yourself",
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
    setFormData((prev) => ({
      ...prev,
      group_module: prev.course === "cseet" ? "full" : "module_1",
    }));
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
        if (groupModule === "both" || groupModule === "full") {
          if (currentMonth > 10) firstValidYear = currentYear + 2;
          else firstValidYear = currentYear + 1;
        } else {
          if (currentMonth > 0) firstValidYear = currentYear + 1;
        }
      } else if (attempt === "dec") {
        if (groupModule === "both" || groupModule === "full") {
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

  const [matchedFee, setMatchedFee] = useState<FeesStructure | null>(null);

  /* ─── Fetch Matching Fee Structure ──────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    const fetchFees = async () => {
      try {
        const response = await axiosRequest({
          baseURL: import.meta.env.VITE_APP_BASE_URL,
          url: API.FEES.STRUCTURES,
          method: "GET",
        });
        
        if (!isMounted) return;

        const data: FeesStructure[] = response.data?.data || response.data?.results || (Array.isArray(response.data) ? response.data : []);
        
        const match = data.find(
          (fs) =>
            fs.is_active &&
            fs.level_name?.toLowerCase().includes(formData.course.toLowerCase().replace("_", " ")) &&
            fs.attempt === formData.batch_attempt &&
            (String(fs.year) === formData.attempt_year || fs.name?.includes(formData.attempt_year))
        );
        setMatchedFee(match || null);
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch fees", error);
        }
      }
    };

    fetchFees();

    return () => {
      isMounted = false;
    };
  }, [formData.course, formData.batch_attempt, formData.attempt_year, formData.group_module]);


  const nextStep = () => { setCurrentStep(p => min(p + 1, 3)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const prevStep = () => { setCurrentStep(p => max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const min = Math.min;
  const max = Math.max;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) {
      submitData(false);
    } else {
      submitData(true);
    }
  };

  /* ── Submit ── */
  const submitData = (isFinalStep: boolean) => {
    if (isFinalStep && !formData.consent) {
      toast.error("Please accept the consent to proceed.");
      return;
    }

    const payload = new FormData();

    // Append text fields (always)
    Object.entries(formData).forEach(([key, value]) => {
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

    // Append documents ONLY on final step
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

    const method = savedAdmissionId ? "PATCH" : "POST";
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
        // If it was a POST, save the new ID
        if (!savedAdmissionId && res?.data?.id) {
          setSavedAdmissionId(String(res.data.id));
        }

        if (isFinalStep) {
          setIsSubmitted(true);
          toast.success("Your admission form has been submitted successfully!");
        } else {
          nextStep();
        }
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save data. Please try again.";
        toast.error(msg);
      },
    });
  };

  /* ────────────────────────────────────────────────────────────
     SUCCESS SCREEN
     ──────────────────────────────────────────────────────────── */
  if (isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(180deg, ${T.surface} 0%, ${T.primaryLight}50 100%)`,
          fontFamily: T.bodyFont,
        }}
      >
        <div
          className="max-w-lg w-full rounded-3xl p-8 sm:p-12 text-center animate-in fade-in zoom-in duration-500"
          style={{ background: T.card, boxShadow: "0 20px 60px rgba(0,33,71,0.12)" }}
        >
          <img src={logo} alt="Insight ERP" className="h-12 sm:h-14 object-contain mx-auto mb-10" />

          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{
              background: `linear-gradient(135deg, ${T.success}15 0%, ${T.success}25 100%)`,
            }}
          >
            <CheckCircle2 className="w-12 h-12" style={{ color: T.success }} />
          </div>

          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: T.black, fontFamily: T.headingFont }}
          >
            Admission Submitted!
          </h2>
          <p className="text-base sm:text-lg mb-2" style={{ color: T.text }}>
            Your registration form has been received successfully.
          </p>
          <p className="text-sm mb-10 max-w-sm mx-auto" style={{ color: T.textMuted }}>
            Our admissions team will verify your documents and get in touch with you within 48
            hours. Thank you for choosing Insight!
          </p>
        </div>
      </div>
    );
  }

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
        <div className="text-center mb-8 sm:mb-10">
          <img
            src={logo}
            alt="Insight ERP"
            className="h-16 sm:h-20 object-contain mx-auto mb-5 sm:mb-6"
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
          {admissionId && (
            <div
              className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: `${T.primary}15`, color: T.primaryDark }}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Application ID: #{admissionId}
            </div>
          )}
        </div>

                {/* ── Stepper ── */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {[
              { num: 1, label: "Personal Info" },
              { num: 2, label: "Course Info" },
              { num: 3, label: "Documents" },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-colors duration-300 ${
                      currentStep >= step.num
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-gray-200 !text-white !important'
                    }`}
                    style={{ background: currentStep >= step.num ? T.primary : T.grayLight, color: currentStep >= step.num ? T.black : T.textMuted }}
                  >
                    {step.num}
                  </div>
                  <span className="text-xs sm:text-sm mt-1.5 font-medium hidden sm:block" style={{ color: currentStep >= step.num ? T.black : T.textMuted }}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-8 sm:w-16 h-1 rounded-full transition-colors duration-300 mb-5 sm:mb-6 ${
                      currentStep > step.num ? 'bg-amber-500' : 'bg-gray-200'
                    }`}
                    style={{ background: currentStep > step.num ? T.primary : T.grayLight }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleNext} className="space-y-5 sm:space-y-6">
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
                    {formData.course === "cseet" ? (
                      <SelectItem value="full">Full Syllabus</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="module_1">Module 1</SelectItem>
                        <SelectItem value="module_2">Module 2</SelectItem>
                      </>
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
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {matchedFee ? (
                <>
                  {/* Level & Structure Info Header */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Level</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{matchedFee.level_name || "—"}</span>
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
                          <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.total_amount || 0))}</span>
                        </div>
                      )}

                      {/* CS Exec / Prof: Module-based Institute Fees */}
                      {formData.course !== "cseet" && (
                        <>
                          {formData.group_module === "both" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Institute Fee (Both Modules)</span>
                              <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.institute_fees_both_modules || 0))}</span>
                            </div>
                          )}
                          {formData.group_module === "module_1" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Institute Fee (Module 1)</span>
                              <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.institute_fees_module_1 || 0))}</span>
                            </div>
                          )}
                          {formData.group_module === "module_2" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Institute Fee (Module 2)</span>
                              <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.institute_fees_module_2 || 0))}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* ICSI fees included when paying through institute */}
                      {formData.icsi_fees_payment === "pay_through_institute" && (
                        <>
                          {formData.course === "cseet" && (
                            <>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">ICSI Registration Fees</span>
                                <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.icsi_registration_fees || 0))}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">ICSI Exam Fees</span>
                                <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.icsi_exam_fees || 0))}</span>
                              </div>
                            </>
                          )}
                          {formData.course === "cs_executive" && (
                            <>
                              {formData.qualification === "cseet_pass" && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">ICSI Reg. Fees (Via CSEET)</span>
                                  <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.icsi_registration_fees_via_cseet || 0))}</span>
                                </div>
                              )}
                              {["graduate", "post_graduate"].includes(formData.qualification) && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">ICSI Reg. Fees (Direct Entry)</span>
                                  <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.icsi_registration_fees_direct || 0))}</span>
                                </div>
                              )}
                            </>
                          )}
                          {formData.course === "cs_professional" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">ICSI Registration Fees</span>
                              <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.icsi_registration_fees || 0))}</span>
                            </div>
                          )}
                          {formData.course !== "cseet" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">ICSI Exam Fees (Per Module)</span>
                              <span className="font-medium text-foreground">{formatCurrency(Number(matchedFee.icsi_exam_fees || 0) * (formData.group_module === "both" ? 2 : 1))}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* ── Total Payable ── */}
                      <div className="flex justify-between items-center pt-3 mt-1 border-t border-border/50">
                        <span className="text-sm font-semibold text-foreground">Total Payable to Institute</span>
                        <span className="text-base font-bold" style={{ color: T.primaryDark }}>
                          {(() => {
                            let total = 0;
                            if (formData.course === "cseet") {
                              total += Number(matchedFee.total_amount || 0);
                            } else {
                              if (formData.group_module === "both") total += Number(matchedFee.institute_fees_both_modules || 0);
                              if (formData.group_module === "module_1") total += Number(matchedFee.institute_fees_module_1 || 0);
                              if (formData.group_module === "module_2") total += Number(matchedFee.institute_fees_module_2 || 0);
                            }
                            if (formData.icsi_fees_payment === "pay_through_institute") {
                              if (formData.course === "cseet") {
                                total += Number(matchedFee.icsi_registration_fees || 0) + Number(matchedFee.icsi_exam_fees || 0);
                              } else if (formData.course === "cs_executive") {
                                total += formData.qualification === "cseet_pass"
                                  ? Number(matchedFee.icsi_registration_fees_via_cseet || 0)
                                  : Number(matchedFee.icsi_registration_fees_direct || 0);
                                total += Number(matchedFee.icsi_exam_fees || 0) * (formData.group_module === "both" ? 2 : 1);
                              } else if (formData.course === "cs_professional") {
                                total += Number(matchedFee.icsi_registration_fees || 0);
                                total += Number(matchedFee.icsi_exam_fees || 0) * (formData.group_module === "both" ? 2 : 1);
                              }
                            }
                            return formatCurrency(total);
                          })()}
                        </span>
                      </div>
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
                              <span className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(Number(matchedFee.icsi_registration_fees || 0))}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Exam Fees</span>
                              <span className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(Number(matchedFee.icsi_exam_fees || 0))}</span>
                            </div>
                          </>
                        )}
                        {formData.course === "cs_executive" && (
                          <>
                            {formData.qualification === "cseet_pass" && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Reg. Fees (Via CSEET)</span>
                                <span className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(Number(matchedFee.icsi_registration_fees_via_cseet || 0))}</span>
                              </div>
                            )}
                            {["graduate", "post_graduate"].includes(formData.qualification) && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Reg. Fees (Direct Entry)</span>
                                <span className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(Number(matchedFee.icsi_registration_fees_direct || 0))}</span>
                              </div>
                            )}
                          </>
                        )}
                        {formData.course === "cs_professional" && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Registration Fees</span>
                            <span className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(Number(matchedFee.icsi_registration_fees || 0))}</span>
                          </div>
                        )}
                        {formData.course !== "cseet" && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-amber-800/70 dark:text-amber-300/70">ICSI Exam Fees (Per Module)</span>
                            <span className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(Number(matchedFee.icsi_exam_fees || 0) * (formData.group_module === "both" ? 2 : 1))}</span>
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
                // required
              />
              <FileUploadField
                label="Your Passport Size Photo Upload"
                icon={Camera}
                file={docPhoto}
                onFileChange={setDocPhoto}
                // required
              />
              <FileUploadField
                label="Aadhar Card"
                icon={CreditCard}
                file={docIdCard}
                onFileChange={setDocIdCard}
                // required
              />
              <FileUploadField
                label="PAN Card"
                icon={CreditCard}
                file={docPanCard}
                onFileChange={setDocPanCard}
                // required
              />
              <FileUploadField
                label="10th Marksheet"
                icon={Baby}
                file={docDobCertificate}
                onFileChange={setDocDobCertificate}
                // required
              />
              <FileUploadField
                label="12th Receipt / Hall Ticket (if Appearing in 10+2)"
                icon={FileCheck}
                file={doc12thReceipt}
                onFileChange={setDoc12thReceipt}
                // required
              />
              <FileUploadField
                label="12th Passing Certificate / Marksheet"
                icon={GraduationCap}
                file={doc12thMarkSheet}
                onFileChange={setDoc12thMarkSheet}
                // required
              />
              <FileUploadField
                label="Category Certificate (if belonging to SC/ST or Physically Handicapped Category)"
                icon={BadgeCheck}
                file={docCategoryCertificate}
                onFileChange={setDocCategoryCertificate}
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
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Submit Admission Form
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
        </form>

        {/* ── Footer ── */}
        <p className="text-center mt-6 sm:mt-8 text-xs" style={{ color: T.textMuted }}>
          Your data is secure and will only be used for admission-related communication.
        </p>
      </div>
    </div>
  );
}


