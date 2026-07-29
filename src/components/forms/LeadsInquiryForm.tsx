import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useDropdown } from "@/hooks/useDropdown";
import { useToast } from "@/hooks/useToast";
import { leadActions } from "@/redux/actions";
import { API } from "@/service/api";
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
    email: "",
    street: "",
    city: "",
    state: "",
    phone_student: "",
    phone_father: "",
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
    setInquiryData((prev) => {
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
    setInquiryData((prev) => ({
      ...prev,
      group_module:
        prev.course === "cseet" ? "full" : "module_1",
    }));
  }, [inquiryData.course]);

  const handleContactChange = (field: string, value: string | boolean) => {
    setContactData((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Submit ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        email: inquiryData.email,
        street: inquiryData.street,
        city: inquiryData.city,
        state: inquiryData.state,
        phone_student: inquiryData.phone_student,
        phone_father: inquiryData.phone_father,
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
      getResponse: () => {
        setIsSubmitted(true);
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

          <div className="flex flex-col sm:flex-row gap-3">
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
    { key: "inquiry" as const, label: "Inquiry Form", icon: ClipboardList },
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
                    className="h-10 sm:h-11 text-sm"
                    placeholder="e.g. Abc"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Email <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    type="email"
                    value={contactData.email}
                    onChange={(e) => handleContactChange("email", e.target.value)}
                    className="h-10 sm:h-11 text-sm"
                    placeholder="e.g. abc@gmail.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Phone <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input
                    required
                    type="tel"
                    value={contactData.phone_student}
                    onChange={(e) => handleContactChange("phone_student", e.target.value)}
                    className="h-10 sm:h-11 text-sm"
                    placeholder="e.g. 5658965147"
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
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  INQUIRY FORM                                          */}
          {/* ════════════════════════════════════════════════════════ */}
          {isInquiry && (
            <>
              {/* Academic Preferences */}
              <SectionCard icon={GraduationCap} title="Academic Preferences">
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
                      Group Module
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
                      Batch Attempt
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
                      value={inquiryData.surname}
                      onChange={(e) => handleInquiryChange("surname", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. Kerai"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Father's Name
                    </Label>
                    <Input
                      value={inquiryData.father_name}
                      onChange={(e) => handleInquiryChange("father_name", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. Harji"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Email <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      type="email"
                      value={inquiryData.email}
                      onChange={(e) => handleInquiryChange("email", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. abc@gmail.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Student Phone <span style={{ color: T.error }}>*</span>
                    </Label>
                    <Input
                      required
                      type="tel"
                      value={inquiryData.phone_student}
                      onChange={(e) => handleInquiryChange("phone_student", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. 9974545456"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Father's Phone
                    </Label>
                    <Input
                      type="tel"
                      value={inquiryData.phone_father}
                      onChange={(e) => handleInquiryChange("phone_father", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. 7490021566"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Address */}
              <SectionCard icon={MapPin} title="Address Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Street Address
                    </Label>
                    <Input
                      value={inquiryData.street}
                      onChange={(e) => handleInquiryChange("street", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. 45, main road"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      City
                    </Label>
                    <Input
                      value={inquiryData.city}
                      onChange={(e) => handleInquiryChange("city", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. Bhuj"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      State
                    </Label>
                    <Input
                      value={inquiryData.state}
                      onChange={(e) => handleInquiryChange("state", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. Kutch"
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
                        Current Qualification
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
                          Board/Medium
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
                          School Name
                        </Label>
                        <Input
                          value={inquiryData.tenth_school}
                          onChange={(e) => handleInquiryChange("tenth_school", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white"
                          placeholder="School name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Coaching Institute
                        </Label>
                        <Input
                          value={inquiryData.tenth_coaching}
                          onChange={(e) => handleInquiryChange("tenth_coaching", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white"
                          placeholder="Coaching name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentage (%)
                        </Label>
                        <Input
                          type="number" min="0"
                          step="0.01"
                          value={inquiryData.tenth_percentage}
                          onChange={(e) => handleInquiryChange("tenth_percentage", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white"
                          placeholder="e.g. 86.16"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentile
                        </Label>
                        <Input
                          type="number" min="0"
                          step="0.01"
                          value={inquiryData.tenth_percentile}
                          onChange={(e) => handleInquiryChange("tenth_percentile", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white"
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
                          Board/Medium
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
                          School Name
                        </Label>
                        <Input
                          value={inquiryData.twelfth_school}
                          onChange={(e) => handleInquiryChange("twelfth_school", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white"
                          placeholder="School name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Coaching Institute
                        </Label>
                        <Input
                          value={inquiryData.twelfth_coaching}
                          onChange={(e) => handleInquiryChange("twelfth_coaching", e.target.value)}
                          className="h-10 sm:h-11 text-sm bg-white"
                          placeholder="Coaching name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentage (%)
                        </Label>
                        <Input
                          type="number" min="0"
                          step="0.01"
                          value={inquiryData.twelfth_percentage}
                          onChange={(e) =>
                            handleInquiryChange("twelfth_percentage", e.target.value)
                          }
                          className="h-10 sm:h-11 text-sm bg-white"
                          placeholder="e.g. 80.16"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                          Percentile
                        </Label>
                        <Input
                          type="number" min="0"
                          step="0.01"
                          value={inquiryData.twelfth_percentile}
                          onChange={(e) =>
                            handleInquiryChange("twelfth_percentile", e.target.value)
                          }
                          className="h-10 sm:h-11 text-sm bg-white"
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
                      How did you hear about us?
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
                      value={inquiryData.inquiry_date}
                      onChange={(e) => handleInquiryChange("inquiry_date", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                      Location
                    </Label>
                    <Input
                      value={inquiryData.location}
                      onChange={(e) => handleInquiryChange("location", e.target.value)}
                      className="h-10 sm:h-11 text-sm"
                      placeholder="e.g. Naranpura (Ahmedabad)"
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
