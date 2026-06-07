import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useToast } from "@/hooks/useToast";
import { useDropdown } from "@/hooks/useDropdown";
import { admissionActions } from "@/redux/actions";
import { API } from "@/service/api";
import { AppDispatch } from "@/store";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2, GraduationCap, MapPin, Loader2, Mail, User, Phone,
  ClipboardList, Calendar, School, Award, Megaphone, ShieldCheck,
  FileImage, Upload, X, Camera, CreditCard, Baby, PenTool,
} from "lucide-react";

/* ─── Theme constants (matches LeadsInquiryForm) ──────────── */
const T = {
  primary: "#F7A900",
  primaryDark: "#D4900A",
  primaryLight: "#FFF3CC",
  navy: "#002147",
  navyLight: "#003366",
  surface: "#F7F7F7",
  card: "#FFFFFF",
  text: "#1a1a2e",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  success: "#16A34A",
  error: "#DC2626",
  headingFont: '"Sora", sans-serif',
  bodyFont: '"DM Sans", sans-serif',
};

/* ─── Reusable section card ────────────────────────────────── */
function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-md"
      style={{ border: `1px solid ${T.border}`, background: T.card, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div
        className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-2.5"
        style={{ background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)` }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(247,169,0,0.15)" }}>
          <Icon className="w-4 h-4" style={{ color: T.primary }} />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-white" style={{ fontFamily: T.headingFont }}>{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

/* ─── Sub-section header ───────────────────────────────────── */
function SubSection({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${T.primary}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: T.primaryDark }} />
      </div>
      <h3 className="font-semibold text-sm sm:text-base" style={{ color: T.navy, fontFamily: T.headingFont }}>{title}</h3>
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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${T.success}15` }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: T.success }} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: T.text }}>{file.name}</p>
              <p className="text-xs" style={{ color: T.textMuted }}>{(file.size / 1024).toFixed(1)} KB</p>
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${T.primary}15` }}>
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

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch locations dropdown
  const { options: locations, loading: locationsLoading, fetchOptions: fetchLocations } = useDropdown("locations", false);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  /* ─── Document state ──────────────────────────────────────── */
  const [docSignature, setDocSignature] = useState<File | null>(null);
  const [docPhoto, setDocPhoto] = useState<File | null>(null);
  const [docIdCard, setDocIdCard] = useState<File | null>(null);
  const [docDobCertificate, setDocDobCertificate] = useState<File | null>(null);

  /* ─── Form state ──────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    form_type: "admission",
    course: "cs_executive",
    group_module: "module_1",
    batch_attempt: "june",
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
    inquiry_date: new Date().toISOString().split("T")[0],
    location: "",
    consent: true,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Submit ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consent) {
      toast.error("Please accept the consent to proceed.");
      return;
    }

    const payload = new FormData();

    // Append documents
    if (docSignature) payload.append("doc_signature", docSignature);
    if (docPhoto) payload.append("doc_photo", docPhoto);
    if (docIdCard) payload.append("doc_id_card", docIdCard);
    if (docDobCertificate) payload.append("doc_dob_certificate", docDobCertificate);

    // Append text fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "tenth_percentage" || key === "tenth_percentile" || key === "twelfth_percentage" || key === "twelfth_percentile") {
        if (value) payload.append(key, String(parseFloat(value as string)));
      } else {
        payload.append(key, String(value));
      }
    });

    setLoading(true);
    dispatch({
      type: admissionActions.SUBMIT_ADMISSION,
      method: "POST",
      endPoint: API.ADMISSIONS.SUBMIT(admissionId),
      body: payload,
      auth: false,
      isFormData: true,
      setLoading: (val: boolean) => setLoading(val),
      getResponse: () => {
        setIsSubmitted(true);
        toast.success("Your admission form has been submitted successfully!");
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

  /* ────────────────────────────────────────────────────────────
     SUCCESS SCREEN
     ──────────────────────────────────────────────────────────── */
  if (isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `linear-gradient(180deg, ${T.surface} 0%, ${T.primaryLight}50 100%)`, fontFamily: T.bodyFont }}
      >
        <div
          className="max-w-lg w-full rounded-3xl p-8 sm:p-12 text-center animate-in fade-in zoom-in duration-500"
          style={{ background: T.card, boxShadow: "0 20px 60px rgba(0,33,71,0.12)" }}
        >
          <img src={logo} alt="Insight ERP" className="h-12 sm:h-14 object-contain mx-auto mb-10" />

          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: `linear-gradient(135deg, ${T.success}15 0%, ${T.success}25 100%)` }}
          >
            <CheckCircle2 className="w-12 h-12" style={{ color: T.success }} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: T.navy, fontFamily: T.headingFont }}>
            Admission Submitted!
          </h2>
          <p className="text-base sm:text-lg mb-2" style={{ color: T.text }}>
            Your registration form has been received successfully.
          </p>
          <p className="text-sm mb-10 max-w-sm mx-auto" style={{ color: T.textMuted }}>
            Our admissions team will verify your documents and get in touch with you within 48 hours. Thank you for choosing Insight!
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
      style={{ background: `linear-gradient(180deg, ${T.surface} 0%, ${T.primaryLight}30 100%)`, fontFamily: T.bodyFont }}
    >
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8 sm:mb-10">
          <img src={logo} alt="Insight ERP" className="h-16 sm:h-20 object-contain mx-auto mb-5 sm:mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: T.navy, fontFamily: T.headingFont }}>
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

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

          {/* ════════════════════════════════════════════════════════ */}
          {/*  DOCUMENT UPLOADS                                      */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={FileImage} title="Document Uploads">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FileUploadField
                label="Signature"
                icon={PenTool}
                file={docSignature}
                onFileChange={setDocSignature}
                required
              />
              <FileUploadField
                label="Passport Photo"
                icon={Camera}
                file={docPhoto}
                onFileChange={setDocPhoto}
                required
              />
              <FileUploadField
                label="ID Card (Aadhar/PAN)"
                icon={CreditCard}
                file={docIdCard}
                onFileChange={setDocIdCard}
                required
              />
              <FileUploadField
                label="Date of Birth Certificate"
                icon={Baby}
                file={docDobCertificate}
                onFileChange={setDocDobCertificate}
                required
              />
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════════════════ */}
          {/*  ACADEMIC PREFERENCES                                  */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={GraduationCap} title="Academic Preferences">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Form Type</Label>
                <Select value={formData.form_type} onValueChange={(val) => handleChange("form_type", val)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="admission">Admission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Course <span style={{ color: T.error }}>*</span>
                </Label>
                <Select value={formData.course} onValueChange={(val) => handleChange("course", val)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cs_executive">CS Executive</SelectItem>
                    <SelectItem value="cs_professional">CS Professional</SelectItem>
                    <SelectItem value="cseet">CSEET</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Group Module</Label>
                <Select value={formData.group_module} onValueChange={(val) => handleChange("group_module", val)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="module_1">Module 1</SelectItem>
                    <SelectItem value="module_2">Module 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Batch Attempt</Label>
                <Select value={formData.batch_attempt} onValueChange={(val) => handleChange("batch_attempt", val)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="june">June</SelectItem>
                    <SelectItem value="oct">October</SelectItem>
                    <SelectItem value="feb">February</SelectItem>
                    <SelectItem value="dec">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════════════════ */}
          {/*  PERSONAL INFORMATION                                  */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={User} title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  First Name <span style={{ color: T.error }}>*</span>
                </Label>
                <Input required value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. Tulsi" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Surname <span style={{ color: T.error }}>*</span>
                </Label>
                <Input required value={formData.surname} onChange={(e) => handleChange("surname", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. Kerai" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Father's Name</Label>
                <Input value={formData.father_name} onChange={(e) => handleChange("father_name", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. Harji" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Mother's Name</Label>
                <Input value={formData.mother_name} onChange={(e) => handleChange("mother_name", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. Jashuben" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                  Date of Birth <span style={{ color: T.error }}>*</span>
                </Label>
                <Input required type="date" value={formData.dob} onChange={(e) => handleChange("dob", e.target.value)} className="h-10 sm:h-11 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Category</Label>
                <Select value={formData.category} onValueChange={(val) => handleChange("category", val)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gen">General</SelectItem>
                    <SelectItem value="obc">OBC</SelectItem>
                    <SelectItem value="sc">SC</SelectItem>
                    <SelectItem value="st">ST</SelectItem>
                    <SelectItem value="ews">EWS</SelectItem>
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
                  <Input required type="tel" value={formData.phone_student} onChange={(e) => handleChange("phone_student", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. 9954563258" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Father's Phone</Label>
                  <Input type="tel" value={formData.phone_father} onChange={(e) => handleChange("phone_father", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. 9978221566" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>
                    Student Email <span style={{ color: T.error }}>*</span>
                  </Label>
                  <Input required type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. tulikerai06@gmail.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Parent Email</Label>
                  <Input type="email" value={formData.email_parent} onChange={(e) => handleChange("email_parent", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. parent@gmail.com" />
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
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Street Address</Label>
                <Input value={formData.street} onChange={(e) => handleChange("street", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. 45, main road" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>City</Label>
                <Input value={formData.city} onChange={(e) => handleChange("city", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. Bhuj" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>State</Label>
                <Input value={formData.state} onChange={(e) => handleChange("state", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. Kutch" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Pincode</Label>
                <Input value={formData.pincode} onChange={(e) => handleChange("pincode", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. 370001" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Country</Label>
                <Input value={formData.country} onChange={(e) => handleChange("country", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. India" />
              </div>
            </div>
          </SectionCard>

          {/* ════════════════════════════════════════════════════════ */}
          {/*  ACADEMIC BACKGROUND                                   */}
          {/* ════════════════════════════════════════════════════════ */}
          <SectionCard icon={GraduationCap} title="Past Academic Background">
            <div className="space-y-6 sm:space-y-8">
              {/* Qualification */}
              <div className="pb-5 sm:pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="max-w-xs">
                  <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Current Qualification</Label>
                  <Select value={formData.qualification} onValueChange={(val) => handleChange("qualification", val)}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm mt-1.5"><SelectValue /></SelectTrigger>
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
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Board/Medium</Label>
                    <Select value={formData.tenth_medium} onValueChange={(val) => handleChange("tenth_medium", val)}>
                      <SelectTrigger className="h-10 sm:h-11 text-sm bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gseb">GSEB</SelectItem>
                        <SelectItem value="cbse">CBSE</SelectItem>
                        <SelectItem value="icse">ICSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>School Name</Label>
                    <Input value={formData.tenth_school} onChange={(e) => handleChange("tenth_school", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="School name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Coaching Institute</Label>
                    <Input value={formData.tenth_coaching} onChange={(e) => handleChange("tenth_coaching", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="Coaching name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Percentage (%)</Label>
                    <Input type="number" step="0.01" value={formData.tenth_percentage} onChange={(e) => handleChange("tenth_percentage", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="e.g. 86.16" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Percentile</Label>
                    <Input type="number" step="0.01" value={formData.tenth_percentile} onChange={(e) => handleChange("tenth_percentile", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="e.g. 95.42" />
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
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Board/Medium</Label>
                    <Select value={formData.twelfth_medium} onValueChange={(val) => handleChange("twelfth_medium", val)}>
                      <SelectTrigger className="h-10 sm:h-11 text-sm bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gseb">GSEB</SelectItem>
                        <SelectItem value="cbse">CBSE</SelectItem>
                        <SelectItem value="icse">ICSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>School Name</Label>
                    <Input value={formData.twelfth_school} onChange={(e) => handleChange("twelfth_school", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="School name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Coaching Institute</Label>
                    <Input value={formData.twelfth_coaching} onChange={(e) => handleChange("twelfth_coaching", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="Coaching name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Percentage (%)</Label>
                    <Input type="number" step="0.01" value={formData.twelfth_percentage} onChange={(e) => handleChange("twelfth_percentage", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="e.g. 80.16" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Percentile</Label>
                    <Input type="number" step="0.01" value={formData.twelfth_percentile} onChange={(e) => handleChange("twelfth_percentile", e.target.value)} className="h-10 sm:h-11 text-sm bg-white" placeholder="e.g. 95.42" />
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
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>How did you hear about us?</Label>
                <Select value={formData.reference} onValueChange={(val) => handleChange("reference", val)}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="existing">Existing Student</SelectItem>
                    <SelectItem value="offline_ad">Offline Ad</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Inquiry Date</Label>
                <Input type="date" value={formData.inquiry_date} onChange={(e) => handleChange("inquiry_date", e.target.value)} className="h-10 sm:h-11 text-sm" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs sm:text-sm font-medium" style={{ color: T.text }}>Location</Label>
                <Input value={formData.location} onChange={(e) => handleChange("location", e.target.value)} className="h-10 sm:h-11 text-sm" placeholder="e.g. Naranpura (Ahmedabad)" />
              </div>
            </div>
          </SectionCard>

          {/* ── Consent & Submit ── */}
          <div
            className="rounded-2xl p-4 sm:p-6"
            style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
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
              <label htmlFor="consent" className="text-xs sm:text-sm font-medium leading-snug cursor-pointer" style={{ color: T.text }}>
                I hereby declare that all the information provided above is true and correct to the best of my knowledge. I agree to be contacted by the institute for admission-related communication.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold text-white transition-all duration-200"
              style={{
                background: formData.consent && !loading ? `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)` : T.textMuted,
                boxShadow: formData.consent && !loading ? "0 4px 14px rgba(0,33,71,0.25)" : "none",
              }}
              disabled={loading || !formData.consent}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Submit Admission Form
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
