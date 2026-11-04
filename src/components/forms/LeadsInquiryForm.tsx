import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useDropdown } from "@/hooks/useDropdown";
import { useToast } from "@/hooks/useToast";
import { leadActions } from "@/redux/actions";
import { API } from "@/service/api";
import { axiosRequest } from "@/service/axiosRequest";
import { AppDispatch } from "@/store";
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
  Building2,
  Phone,
  GraduationCap,
  MapPin,
  Search,
  Loader2,
  Mail,
  User,
  PhoneCall,
  ClipboardList,
  BookOpen,
  Calendar,
  MapPinned,
  School,
  BarChart3,
  Award,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

import { THEME } from "@/config/theme";

/* ─── Theme constants ───────────────────────────────────────── */
const T = {
  ...THEME.colors,
  headingFont: THEME.fontFamily.heading,
  bodyFont: THEME.fontFamily.body,
};

/* ─── Reusable section card ─────────────────────────────────── */
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

/* ─── Sub-section header ────────────────────────────────────── */
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
        style={{ color: T.navy, fontFamily: T.headingFont }}
      >
        {title}
      </h3>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */
export default function LeadsInquiryForm() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formType, setFormType] = useState<"contact" | "inquiry">("contact");
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  // Fetch branches
  const {
    options: branches,
    loading: branchesLoading,
    fetchOptions: fetchBranches,
  } = useDropdown("branches", false);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // ── Inquiry state
  const [inquiryData, setInquiryData] = useState({
    course: "cseet",
    group_module: "full",
    batch_attempt: "june",
    first_name: "",
    surname: "",
    father_name: "",
    mother_name: "",
    dob: "",
    category: "gen",
    email: "",
    email_parent: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "INDIA",
    phone_student: "",
    phone_father: "",
    phone_student_2: "",
    qualification: "appearing_12",
    tenth_medium: "gseb",
    tenth_school: "",
    tenth_coaching: "",
    tenth_percentage: "",
    tenth_percentile: "",
    twelfth_medium: "gseb",
    twelfth_school: "",
    twelfth_coaching: "",
    twelfth_percentage: "",
    twelfth_percentile: "",
    reference: "google",
    reference_name: "",
    inquiry_date: new Date().toISOString().split("T")[0],
    location: "",
    consent: true,
    branch: "",
  });

  // ── Contact state
  const [contactData, setContactData] = useState({
    first_name: "",
    email: "",
    phone_student: "",
    course: "cseet",
    consent: true,
    branch: "",
  });

  const handleInquiryChange = (field: string, value: string | boolean | number) => {
    // Convert string inputs to uppercase except email and enum/dropdown select keys
    let processedValue = value;
    if (typeof value === "string") {
      if (field === "email" || field === "email_parent") {
        processedValue = value.toLowerCase();
      } else {
        const preserveCaseFields = [
          "course", "group_module", "batch_attempt", "qualification",
          "tenth_medium", "twelfth_medium", "category", "reference", "branch", "dob", "inquiry_date"
        ];
        if (!preserveCaseFields.includes(field)) {
          processedValue = value.toUpperCase();
        }
      }
    }

    setInquiryData((prev) => {
      const updated = { ...prev, [field]: processedValue };
      if (field === "course") {
        if (processedValue === "cseet") {
          updated.group_module = "full";
          if (!["june", "oct", "feb"].includes(prev.batch_attempt)) {
            updated.batch_attempt = "june";
          }
        } else if (processedValue === "cs_executive" || processedValue === "cs_professional") {
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
    setInquiryData((prev) => ({
      ...prev,
      group_module:
        prev.course === "cseet" ? "full" : "module_1",
    }));
  }, [inquiryData.course]);

  const handleContactChange = (field: string, value: string | boolean) => {
    let processedValue = value;
    if (typeof value === "string") {
      if (field === "email") {
        processedValue = value.toLowerCase();
      } else if (field !== "course" && field !== "branch") {
        processedValue = value.toUpperCase();
      }
    }
    setContactData((prev) => ({ ...prev, [field]: processedValue }));
  };

  /* ──0 Submit ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formType === "contact") {
      if (!contactData.first_name.trim() || !contactData.phone_student.trim() || !contactData.email.trim() || !contactData.branch) {
        toast.error("Please fill in all compulsory fields marked with *");
        return;
      }
    } else {
      // Validate all compulsory details for enrollment/inquiry form
      const compulsoryCheck: { key: keyof typeof inquiryData; label: string }[] = [
        { key: "first_name", label: "First Name" },
        { key: "surname", label: "Surname" },
        { key: "father_name", label: "Father's Name" },
        { key: "mother_name", label: "Mother's Name" },
        { key: "dob", label: "Date of Birth" },
        { key: "category", label: "Category" },
        { key: "phone_student", label: "Student Phone" },
        { key: "phone_father", label: "Father's Phone" },
        { key: "phone_student_2", label: "Mother's Phone" },
        { key: "email", label: "Student Email" },
        { key: "email_parent", label: "Parent Email" },
        { key: "street", label: "Street Address" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "pincode", label: "Pincode" },
        { key: "country", label: "Country" },
        { key: "qualification", label: "Current Qualification" },
        { key: "tenth_medium", label: "10th Board/Medium" },
        { key: "tenth_school", label: "10th School Name" },
        { key: "tenth_coaching", label: "10th Coaching Institute" },
        { key: "tenth_percentage", label: "10th Percentage" },
        { key: "tenth_percentile", label: "10th Percentile" },
        { key: "twelfth_medium", label: "12th Board/Medium" },
        { key: "twelfth_school", label: "12th School Name" },
        { key: "twelfth_coaching", label: "12th Coaching Institute" },
        { key: "twelfth_percentage", label: "12th Percentage" },
        { key: "twelfth_percentile", label: "12th Percentile" },
        { key: "reference", label: "How did you hear about us?" },
        { key: "inquiry_date", label: "Inquiry Date" },
        { key: "location", label: "Location" },
        { key: "branch", label: "Branch" },
      ];

      for (const field of compulsoryCheck) {
        const val = inquiryData[field.key];
        if (val === undefined || val === null || String(val).trim() === "") {
          toast.error(`Compulsory field missing: ${field.label}`);
          return;
        }
      }

      if (inquiryData.reference === "other" && !inquiryData.reference_name.trim()) {
        toast.error("Please specify how you heard about us");
        return;
      }

      // Ensure Student Phone, Father Phone, and Mother Phone are distinct
      const cleanStudent = inquiryData.phone_student.trim().replace(/\D/g, "");
      const cleanFather = inquiryData.phone_father.trim().replace(/\D/g, "");
      const cleanMother = inquiryData.phone_student_2.trim().replace(/\D/g, "");

      if (cleanStudent && cleanFather && cleanStudent.slice(-10) === cleanFather.slice(-10)) {
        toast.error("Father's phone number cannot be the same as Student's phone number.");
        return;
      }
      if (cleanStudent && cleanMother && cleanStudent.slice(-10) === cleanMother.slice(-10)) {
        toast.error("Mother's phone number cannot be the same as Student's phone number.");
        return;
      }
      if (cleanFather && cleanMother && cleanFather.slice(-10) === cleanMother.slice(-10)) {
        toast.error("Father's phone number and Mother's phone number cannot be the same.");
        return;
      }
    }

    let payload: Record<string, unknown>;

    if (formType === "contact") {
      payload = {
        form_type: "contact",
        first_name: contactData.first_name,
        email: contactData.email,
        phone_student: contactData.phone_student,
        course: contactData.course,
        consent: contactData.consent,
        branch: contactData.branch,
      };
    } else {
      payload = {
        form_type: "inquiry",
        course: inquiryData.course,
        group_module: inquiryData.group_module,
        batch_attempt: inquiryData.batch_attempt,
        first_name: inquiryData.first_name,
        surname: inquiryData.surname,
        father_name: inquiryData.father_name,
        mother_name: inquiryData.mother_name,
        dob: inquiryData.dob,
        category: inquiryData.category,
        email: inquiryData.email,
        email_parent: inquiryData.email_parent,
        street: inquiryData.street,
        city: inquiryData.city,
        state: inquiryData.state,
        pincode: inquiryData.pincode,
        country: inquiryData.country,
        phone_student: inquiryData.phone_student,
        phone_father: inquiryData.phone_father,
        phone_student_2: inquiryData.phone_student_2,
        qualification: inquiryData.qualification,
        tenth_medium: inquiryData.tenth_medium,
        tenth_school: inquiryData.tenth_school,
        tenth_coaching: inquiryData.tenth_coaching,
        tenth_percentage: inquiryData.tenth_percentage
          ? parseFloat(inquiryData.tenth_percentage)
          : null,
        tenth_percentile: inquiryData.tenth_percentile
          ? parseFloat(inquiryData.tenth_percentile)
          : null,
        twelfth_medium: inquiryData.twelfth_medium,
        twelfth_school: inquiryData.twelfth_school,
        twelfth_coaching: inquiryData.twelfth_coaching,
        twelfth_percentage: inquiryData.twelfth_percentage
          ? parseFloat(inquiryData.twelfth_percentage)
          : null,
        twelfth_percentile: inquiryData.twelfth_percentile
          ? parseFloat(inquiryData.twelfth_percentile)
          : null,
        reference: inquiryData.reference,
        reference_name: inquiryData.reference === "other" ? inquiryData.reference_name : "",
        inquiry_date: inquiryData.inquiry_date,
        location: inquiryData.location,
        consent: inquiryData.consent,
        branch: inquiryData.branch,
      };
    }

    setLoading(true);
    dispatch({
      type: leadActions.CREATE_LEAD,
      method: "POST",
      endPoint: API.LEADS.CREATE,
      body: payload,
      auth: false,
      setLoading: (val: boolean) => setLoading(val),
      getResponse: async (res: any) => {
        setIsSubmitted(true);
        const resData = res?.data?.data || res?.data || res;
        const leadId = resData?.lead_id || resData?.id || res?.lead_id || res?.data?.lead_id;
        const returnedAdmissionId = resData?.admission || resData?.admission_id;

        let targetAdmissionId = returnedAdmissionId ? String(returnedAdmissionId) : null;
        const cleanPhone = inquiryData.phone_student.trim().replace(/\D/g, "");
        const clean10 = cleanPhone.slice(-10);

        // If backend did not return admission id directly, query the admission created for this student's phone
        if (!targetAdmissionId && cleanPhone && formType === "inquiry") {
          try {
            const admListRes = await axiosRequest({
              baseURL: import.meta.env.VITE_APP_BASE_URL,
              url: `${API.ADMISSIONS.LIST}?phone_student=${clean10}`,
              method: "GET",
            });
            const listData = admListRes?.data?.data || admListRes?.data || [];
            if (Array.isArray(listData) && listData.length > 0) {
              targetAdmissionId = String(listData[0].id || listData[0].admission_id || "");
            }
          } catch (e) {}
        }

        const effectiveAdmissionId = targetAdmissionId || (leadId ? String(leadId) : null);
        if (effectiveAdmissionId) {
          setSubmittedLeadId(effectiveAdmissionId);
        }

        // Cache inquiry data locally under all keys for instant auto-filling in Admission form
        const snapshot = {
          ...inquiryData,
          id: effectiveAdmissionId,
          lead_id: leadId,
          admission_id: effectiveAdmissionId,
        };
        try {
          localStorage.setItem("latest_inquiry_data", JSON.stringify(snapshot));
          if (effectiveAdmissionId) {
            localStorage.setItem(`inquiry_cache_id_${effectiveAdmissionId}`, JSON.stringify(snapshot));
          }
          if (leadId && String(leadId) !== effectiveAdmissionId) {
            localStorage.setItem(`inquiry_cache_id_${leadId}`, JSON.stringify(snapshot));
          }
          if (cleanPhone) {
            localStorage.setItem(`inquiry_cache_phone_${cleanPhone}`, JSON.stringify(snapshot));
          }
          if (clean10) {
            localStorage.setItem(`inquiry_cache_phone_${clean10}`, JSON.stringify(snapshot));
          }
        } catch (storageErr) {
          console.warn("Could not cache inquiry to localStorage:", storageErr);
        }

        // Immediately enrich backend admission record with extra fields using FormData
        if (effectiveAdmissionId && formType === "inquiry") {
          try {
            const patchFormData = new FormData();
            patchFormData.append("mother_name", inquiryData.mother_name ? inquiryData.mother_name.trim().toUpperCase() : "");
            if (inquiryData.dob) patchFormData.append("dob", inquiryData.dob);
            patchFormData.append("category", inquiryData.category ? String(inquiryData.category).toLowerCase() : "gen");
            patchFormData.append("email_parent", inquiryData.email_parent ? inquiryData.email_parent.trim().toLowerCase() : "");
            patchFormData.append("phone_student_2", inquiryData.phone_student_2 ? inquiryData.phone_student_2.trim() : "");
            patchFormData.append("pincode", inquiryData.pincode ? inquiryData.pincode.trim().toUpperCase() : "");

            await axiosRequest({
              baseURL: import.meta.env.VITE_APP_BASE_URL,
              url: `/api/v1/admissions/${effectiveAdmissionId}/`,
              method: "PATCH",
              data: patchFormData,
            });
          } catch (patchErr) {
            console.warn("Could not immediately patch backend admission with extra fields:", patchErr);
          }
        }

        toast.success("Your form has been submitted successfully!");
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to submit. Please try again.";
        toast.error(msg);
      },
    });
  };

  /* ────────────────────────────────────────────────────────────── */
  /*  SUCCESS SCREEN                                               */
  /* ────────────────────────────────────────────────────────────── */
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
            style={{ color: T.navy, fontFamily: T.headingFont }}
          >
            Thank You!
          </h2>
          <p className="text-base sm:text-lg mb-2" style={{ color: T.text }}>
            Your {formType === "contact" ? "contact request" : "inquiry application"} has been
            received.
          </p>
          <p className="text-sm mb-10 max-w-sm mx-auto" style={{ color: T.textMuted }}>
            Our admissions team will review your details and reach out to you within 24 hours. We
            appreciate your interest!
          </p>

          {submittedLeadId && (
            <div
              className="p-4 rounded-2xl mb-6 text-center border"
              style={{
                background: `${T.primary}10`,
                borderColor: `${T.primary}35`,
              }}
            >
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: T.primaryDark }}>
                Your Admission Reference ID
              </p>
              <p className="text-2xl font-black mt-1" style={{ color: T.navy }}>
                #{submittedLeadId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Save this ID to auto-load your complete details when completing your admission.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {submittedLeadId && (
              <Button
                className="flex-1 h-12 text-sm font-semibold text-white transition-all shadow-md"
                style={{ background: T.navy }}
                onClick={() => {
                  window.location.href = `/admission?id=${submittedLeadId}&phone=${encodeURIComponent(
                    inquiryData.phone_student.trim()
                  )}`;
                }}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Proceed to Admission Form
              </Button>
            )}
            <Button
              className="flex-1 h-12 text-sm font-semibold text-black transition-all"
              style={{ background: T.primary }}
              onClick={() => {
                setIsSubmitted(false);
                setFormType("contact");
              }}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Submit Another Form
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────── */
  /*  FORM                                                         */
  /* ────────────────────────────────────────────────────────────── */
  const isInquiry = formType === "inquiry";
  const consentChecked = isInquiry ? inquiryData.consent : contactData.consent;

  const FORM_TABS = [
    { key: "contact" as const, label: "Contact Form", icon: PhoneCall },
    { key: "inquiry" as const, label: "Enrollment Form", icon: ClipboardList },
  ];

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
            {isInquiry ? "Student Admission Inquiry" : "Get in Touch"}
          </h1>
          <p className="mt-2 text-sm sm:text-base max-w-md mx-auto" style={{ color: T.textMuted }}>
            {isInquiry
              ? "Fill in the details below to register your interest in our programmes"
              : "Have a question? Reach out and our team will get back to you shortly"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* ── Form Type Toggle ── */}
          <div
            className="rounded-2xl p-1.5 sm:p-2 flex gap-1.5 sm:gap-2"
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {FORM_TABS.map(({ key, label, icon: TabIcon }) => {
              const active = formType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormType(key)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
                  style={{
                    background: active ? T.primary : "transparent",
                    color: active ? "#fff" : T.textMuted,
                    boxShadow: active ? "0 2px 8px rgba(247,169,0,0.2)" : "none",
                  }}
                >
                  <TabIcon
                    className="w-4 h-4"
                    style={{ color: active ? T.primary : T.textMuted }}
                  />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════════ */}
          {/*  CONTACT FORM                                          */}
          {/* ════════════════════════════════════════════════════════ */}
          {!isInquiry && (
            <SectionCard icon={Mail} title="Contact Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Full Name <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    value={contactData.first_name}
                    onChange={(e) => handleContactChange("first_name", e.target.value)}
                    className="h-10 sm:h-11 text-sm uppercase"
                    style={{ textTransform: "uppercase" }}
                    placeholder="e.g. ABC"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Student Phone <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    type="tel"
                    value={contactData.phone_student}
                    onChange={(e) => handleContactChange("phone_student", e.target.value)}
                    className="h-10 sm:h-11 text-sm uppercase"
                    style={{ textTransform: "uppercase" }}
                    placeholder="e.g. 9974545456"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Student Email <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    type="email"
                    value={contactData.email}
                    onChange={(e) => handleContactChange("email", e.target.value)}
                    className="h-10 sm:h-11 text-sm lowercase"
                    placeholder="e.g. student@gmail.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Course <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Select
                    value={contactData.course}
                    onValueChange={(val) => handleContactChange("course", val)}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cseet">CSEET</SelectItem>
                      <SelectItem value="cs_executive">CS Executive</SelectItem>
                      <SelectItem value="cs_professional">CS Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Branch <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Select
                    value={contactData.branch}
                    onValueChange={(val) => handleContactChange("branch", val)}
                    disabled={branchesLoading}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-sm">
                      <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select Branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.value} value={String(b.value)}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  INQUIRY FORM                                          */}
          {/* ════════════════════════════════════════════════════════ */}
          {isInquiry && (
            <>
              {/* Academic Preferences */}
              <SectionCard icon={GraduationCap} title="Course Selection">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Course <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Select
                      value={inquiryData.course}
                      onValueChange={(val) => handleInquiryChange("course", val)}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cseet">CSEET</SelectItem>
                        <SelectItem value="cs_executive">CS Executive</SelectItem>
                        <SelectItem value="cs_professional">CS Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Group Module <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Select
                      value={inquiryData.group_module}
                      onValueChange={(val) => handleInquiryChange("group_module", val)}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {inquiryData.course === "cseet" ? (
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
                      Batch Attempt <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Select
                      value={inquiryData.batch_attempt}
                      onValueChange={(val) => handleInquiryChange("batch_attempt", val)}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {inquiryData.course === "cseet" ? (
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
                </div>
              </SectionCard>

              {/* Personal Information */}
              <SectionCard icon={User} title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      First Name <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.first_name}
                      onChange={(e) => handleInquiryChange("first_name", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. TULSI"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Surname <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.surname}
                      onChange={(e) => handleInquiryChange("surname", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. KERAI"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Father's Name <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.father_name}
                      onChange={(e) => handleInquiryChange("father_name", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. HARJI"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Mother's Name <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.mother_name}
                      onChange={(e) => handleInquiryChange("mother_name", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. JASHUBEN"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Date of Birth <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      type="date"
                      value={inquiryData.dob}
                      onChange={(e) => handleInquiryChange("dob", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Category <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Select
                      value={inquiryData.category}
                      onValueChange={(val) => handleInquiryChange("category", val)}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gen">General</SelectItem>
                        <SelectItem value="obc">OBC</SelectItem>
                        <SelectItem value="sc_st">SC / ST</SelectItem>
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
                        value={inquiryData.phone_student}
                        onChange={(e) => handleInquiryChange("phone_student", e.target.value)}
                        className="h-10 sm:h-11 text-sm uppercase"
                        style={{ textTransform: "uppercase" }}
                        placeholder="e.g. 9974545456"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Father's Phone <span style={{ color: T.error }}>*</span>
                      </Label>
                      <Input
                        required
                        type="tel"
                        value={inquiryData.phone_father}
                        onChange={(e) => handleInquiryChange("phone_father", e.target.value)}
                        className="h-10 sm:h-11 text-sm uppercase"
                        style={{ textTransform: "uppercase" }}
                        placeholder="e.g. 7490021566"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Mother's Phone <span style={{ color: T.error }}>*</span>
                      </Label>
                      <Input
                        required
                        type="tel"
                        value={inquiryData.phone_student_2}
                        onChange={(e) => handleInquiryChange("phone_student_2", e.target.value)}
                        className="h-10 sm:h-11 text-sm uppercase"
                        style={{ textTransform: "uppercase" }}
                        placeholder="e.g. 9825012345"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Student Email <span style={{ color: T.error }}>*</span>
                      </Label>
                      <Input
                        required
                        type="email"
                        value={inquiryData.email}
                        onChange={(e) => handleInquiryChange("email", e.target.value)}
                        className="h-10 sm:h-11 text-sm lowercase"
                        placeholder="e.g. student@gmail.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Parent Email <span style={{ color: T.error }}>*</span>
                      </Label>
                      <Input
                        required
                        type="email"
                        value={inquiryData.email_parent}
                        onChange={(e) => handleInquiryChange("email_parent", e.target.value)}
                        className="h-10 sm:h-11 text-sm lowercase"
                        placeholder="e.g. parent@gmail.com"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Address */}
              <SectionCard icon={MapPin} title="Address Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Street Address <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.street}
                      onChange={(e) => handleInquiryChange("street", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. 45, MAIN ROAD"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      City <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.city}
                      onChange={(e) => handleInquiryChange("city", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. BHUJ"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      State <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.state}
                      onChange={(e) => handleInquiryChange("state", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. GUJARAT"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Pincode <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.pincode}
                      onChange={(e) => handleInquiryChange("pincode", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. 370001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Country <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.country}
                      onChange={(e) => handleInquiryChange("country", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. INDIA"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Academic Background */}
              <SectionCard icon={Building2} title="Past Academic Background">
                <div className="space-y-6 sm:space-y-8">
                  {/* Qualification */}
                  <div className="pb-5 sm:pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="max-w-xs">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Current Qualification <span style={{ color: T.error }}>*</span>
                      </Label>
                      <Select
                        value={inquiryData.qualification}
                        onValueChange={(val) => handleInquiryChange("qualification", val)}
                      >
                        <SelectTrigger className="h-10 sm:h-11 text-sm mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appearing_12">Appearing 12th</SelectItem>
                          <SelectItem value="pass_12">Passed 12th</SelectItem>
                          <SelectItem value="cseet_pass">CSEET Pass</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="post_graduate">Post Graduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 10th */}
                  <div>
                    <SubSection icon={School} title="10th Standard Details" />
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5 rounded-xl"
                      style={{ background: `${T.primaryLight}50`, border: `1px solid ${T.border}` }}
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Board/Medium <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Select
                          value={inquiryData.tenth_medium}
                          onValueChange={(val) => handleInquiryChange("tenth_medium", val)}
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
                          School Name <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          value={inquiryData.tenth_school}
                          onChange={(e) => handleInquiryChange("tenth_school", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          style={{ textTransform: "uppercase" }}
                          placeholder="School name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Coaching Institute <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          value={inquiryData.tenth_coaching}
                          onChange={(e) => handleInquiryChange("tenth_coaching", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          style={{ textTransform: "uppercase" }}
                          placeholder="Coaching name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentage (%) <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          type="number" min="0" max="100"
                          step="0.01"
                          value={inquiryData.tenth_percentage}
                          onChange={(e) => handleInquiryChange("tenth_percentage", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          placeholder="e.g. 86.16"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentile <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          type="number" min="0" max="100"
                          step="0.01"
                          value={inquiryData.tenth_percentile}
                          onChange={(e) => handleInquiryChange("tenth_percentile", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          placeholder="e.g. 97.16"
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
                          Board/Medium <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Select
                          value={inquiryData.twelfth_medium}
                          onValueChange={(val) => handleInquiryChange("twelfth_medium", val)}
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
                          School Name <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          value={inquiryData.twelfth_school}
                          onChange={(e) => handleInquiryChange("twelfth_school", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          style={{ textTransform: "uppercase" }}
                          placeholder="School name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Coaching Institute <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          value={inquiryData.twelfth_coaching}
                          onChange={(e) => handleInquiryChange("twelfth_coaching", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          style={{ textTransform: "uppercase" }}
                          placeholder="Coaching name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentage (%) <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          type="number" min="0" max="100"
                          step="0.01"
                          value={inquiryData.twelfth_percentage}
                          onChange={(e) =>
                            handleInquiryChange("twelfth_percentage", e.target.value)
                          }
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          placeholder="e.g. 80.16"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentile <span style={{ color: T.error }}>*</span>
                        </Label>
                        <Input
                          required
                          type="number" min="0" max="100"
                          step="0.01"
                          value={inquiryData.twelfth_percentile}
                          onChange={(e) =>
                            handleInquiryChange("twelfth_percentile", e.target.value)
                          }
                          className="h-10 sm:h-11 text-sm bg-white uppercase"
                          placeholder="e.g. 95.42"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Other Details */}
              <SectionCard icon={Megaphone} title="Other Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      How did you hear about us? <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Select
                      value={inquiryData.reference}
                      onValueChange={(val) => handleInquiryChange("reference", val)}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="existing">Existing Student</SelectItem>
                        <SelectItem value="offline_ad">Offline Ad</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="other">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {inquiryData.reference === "other" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                        Please specify <span style={{ color: T.error }}>*</span>
                      </Label>
                      <Input
                        required
                        value={inquiryData.reference_name}
                        onChange={(e) => handleInquiryChange("reference_name", e.target.value)}
                        className="h-10 sm:h-11 text-sm bg-white uppercase"
                        style={{ textTransform: "uppercase" }}
                        placeholder="e.g. FROM A FRIEND"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Inquiry Date <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      type="date"
                      value={inquiryData.inquiry_date}
                      onChange={(e) => handleInquiryChange("inquiry_date", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Location <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      value={inquiryData.location}
                      onChange={(e) => handleInquiryChange("location", e.target.value)}
                      className="h-10 sm:h-11 text-sm uppercase"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. NARANPURA (AHMEDABAD)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Branch <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Select
                      value={inquiryData.branch}
                      onValueChange={(val) => handleInquiryChange("branch", val)}
                      disabled={branchesLoading}
                    >
                      <SelectTrigger className="h-10 sm:h-11 text-sm">
                        <SelectValue
                          placeholder={branchesLoading ? "Loading branches..." : "Select Branch"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.value} value={String(b.value)}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

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
                checked={consentChecked}
                onCheckedChange={(checked) =>
                  isInquiry
                    ? handleInquiryChange("consent", checked as boolean)
                    : handleContactChange("consent", checked as boolean)
                }
                className="w-5 h-5 mt-0.5 sm:mt-0 flex-shrink-0"
              />
              <label
                htmlFor="consent"
                className="text-xs sm:text-sm font-medium leading-snug cursor-pointer"
                style={{ color: T.text }}
              >
                I agree to be contacted by the institute and receive updates regarding admission and
                related programmes.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold text-black transition-all duration-200"
              style={{
                background: consentChecked && !loading ? T.primary : T.textMuted,
                boxShadow: consentChecked && !loading ? "0 4px 14px rgba(247,169,0,0.25)" : "none",
              }}
              disabled={loading || !consentChecked}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  {isInquiry ? "Submit Inquiry Application" : "Submit Contact Request"}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* ── Footer ── */}
        <p className="text-center mt-6 sm:mt-8 text-xs" style={{ color: T.textMuted }}>
          Your data is secure and will only be used for admission-related communication.
        </p>
      </div>
    </div>
  );
}
