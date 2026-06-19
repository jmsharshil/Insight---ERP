import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { admissionActions } from "@/redux/actions";
import {
  setSelectedAdmission,
  setSelectedAdmissionLoading,
  setAdmissionsError,
} from "@/redux/slices/admissionSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  Camera,
  PenTool,
  Baby,
  CreditCard,
  FileCheck,
  GraduationCap,
  BadgeCheck,
  Upload,
  Loader2,
  Eye,
  Pencil,
  Save,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import EditAdmissionDialog from "@/components/forms/EditAdmissionDialog";
import { formatCurrency } from "@/lib/utils";

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-border/40 last:border-0 gap-1 sm:gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-1/3">
        {icon} <span>{label}</span>
      </div>
      <div className="text-sm font-medium sm:w-2/3 break-words">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-5 h-full">
      <h3 className="font-heading text-lg font-semibold mb-4 text-card-foreground border-b border-border/50 pb-2">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

const getFileType = (url?: string) => {
  if (!url) return "unknown";
  const cleanUrl = url.split("?")[0].toLowerCase();
  if (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".gif") ||
    cleanUrl.endsWith(".webp")
  ) {
    return "image";
  }
  if (cleanUrl.endsWith(".pdf")) {
    return "pdf";
  }
  return "other";
};

type DocumentKey =
  | "doc_photo"
  | "doc_signature"
  | "doc_dob_certificate"
  | "doc_id_card"
  | "doc_twelfth_receipt"
  | "doc_twelfth_marksheet"
  | "doc_category_cert";

interface DocType {
  key: DocumentKey;
  label: string;
  icon: React.ElementType;
}

const DOCUMENT_TYPES: readonly DocType[] = [
  { key: "doc_photo", label: "Photograph", icon: Camera },
  { key: "doc_signature", label: "Signature", icon: PenTool },
  { key: "doc_dob_certificate", label: "DOB Certificate / 10th Marksheet", icon: Baby },
  { key: "doc_id_card", label: "ID Proof (Aadhar/PAN/License)", icon: CreditCard },
  { key: "doc_twelfth_receipt", label: "12th Receipt / Hall Ticket", icon: FileCheck },
  { key: "doc_twelfth_marksheet", label: "12th Marksheet", icon: GraduationCap },
  { key: "doc_category_cert", label: "Category Certificate", icon: BadgeCheck },
] as const;

function AdmissionDetailSkeleton() {
  return (
    <div className="mx-auto space-y-6 pb-12 p-4 md:p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Skeleton width={40} height={40} className="rounded-md" />
          <Skeleton width={200} height={32} />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Skeleton width={120} height={36} className="rounded-md" />
          <Skeleton width={150} height={36} className="rounded-md" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <Skeleton circle width={96} height={96} containerClassName="shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Skeleton width={250} height={36} />
            <Skeleton width={120} height={24} borderRadius={12} />
          </div>
          <Skeleton width="40%" height={20} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <Skeleton width={120} height={16} />
            <Skeleton width={120} height={16} />
            <Skeleton width={180} height={16} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Skeleton width={120} height={40} className="rounded-md shrink-0" />
        <Skeleton width={140} height={40} className="rounded-md shrink-0" />
        <Skeleton width={100} height={40} className="rounded-md shrink-0" />
        <Skeleton width={120} height={40} className="rounded-md shrink-0" />
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-5">
          <Skeleton width={150} height={24} className="mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 border-b border-border/40 pb-2 last:border-0"
              >
                <div className="sm:w-1/3">
                  <Skeleton height={16} width="80%" />
                </div>
                <div className="sm:w-2/3">
                  <Skeleton height={16} width="60%" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm p-5">
          <Skeleton width={150} height={24} className="mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 border-b border-border/40 pb-2 last:border-0"
              >
                <div className="sm:w-1/3">
                  <Skeleton height={16} width="80%" />
                </div>
                <div className="sm:w-2/3">
                  <Skeleton height={16} width="60%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentAdmissionDetailedPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { setPageTitle } = useUI();

  const {
    selectedAdmission: admission,
    selectedAdmissionLoading: loading,
    error,
  } = useSelector((state: RootState) => state.admissions);

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Edit details modal state
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    setPageTitle("Admission Details");
  }, [setPageTitle]);

  const loadAdmissionDetails = useCallback(() => {
    if (!id) return;
    dispatch({
      type: admissionActions.GET_ADMISSION_DETAIL,
      method: "GET",
      endPoint: API.ADMISSIONS.GET(id),
      auth: true,
      setLoading: (val: boolean) => dispatch(setSelectedAdmissionLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setSelectedAdmission(res.data));
        } else {
          dispatch(setAdmissionsError("Invalid data format"));
        }
      },
      getError: (err: any) => {
        dispatch(setAdmissionsError(err?.message || "Failed to load"));
        toast.error("Failed to load admission details.");
      },
    });
  }, [id, dispatch, toast]);

  useEffect(() => {
    loadAdmissionDetails();
  }, [loadAdmissionDetails]);

  const handleDocumentUpload = (key: string, file: File) => {
    if (!admission?.id) return;

    const payload = new FormData();
    payload.append(key, file);

    setUploadingDoc(key);
    dispatch({
      type: admissionActions.SUBMIT_ADMISSION,
      method: "PATCH",
      endPoint: API.ADMISSIONS.SUBMIT(admission.id),
      body: payload,
      auth: true,
      setLoading: (val: boolean) => {
        if (!val) setUploadingDoc(null);
      },
      getResponse: () => {
        toast.success("Document updated successfully!");
        loadAdmissionDetails();
      },
      getError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to update document";
        toast.error(errMsg);
      },
    });
  };

  const triggerFileInput = (key: string) => {
    setSelectedDocKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedDocKey) {
      handleDocumentUpload(selectedDocKey, file);
    }
    e.target.value = "";
  };

  if (loading) return <AdmissionDetailSkeleton />;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!admission)
    return <div className="p-6 text-center text-muted-foreground">No data found.</div>;

  const handleApprove = () => {
    dispatch({
      type: admissionActions.APPROVE_ADMISSION,
      method: "POST",
      endPoint: API.ADMISSIONS.APPROVE(admission.id),
      auth: true,
      setLoading: (val: boolean) => dispatch(setSelectedAdmissionLoading(val)),
      getResponse: () => {
        toast.success("Admission approved successfully!");
        navigate(-1);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || "Failed to approve admission");
      },
    });
  };

  return (
    <div className="mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Admission #{admission.id}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setEditModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2 border-border/80 hover:bg-muted/50"
          >
            <Pencil className="w-4 h-4" /> Edit Details
          </Button>
          {(admission.status === "approval_pending" ||
            admission.status === "payment_submitted") && (
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
              Approve Admission
            </Button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center gap-6"
      >
        {admission.doc_photo ? (
          <img
            src={admission.doc_photo}
            alt={admission.first_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary-light text-primary-dark grid place-items-center text-3xl font-bold shadow-sm">
            {admission.first_name?.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-heading font-bold text-text-primary">
              {admission.first_name} {admission.surname}
            </h2>
            <Badge
              className={
                admission.status === "payment_pending"
                  ? "bg-amber-100 text-amber-700"
                  : admission.status === "payment_submitted"
                    ? "bg-blue-100 text-blue-700"
                    : admission.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-black"
              }
            >
              {admission.status_display || admission.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">
            <span className="capitalize">{admission.course?.replace(/_/g, " ")}</span> (
            {admission.batch_attempt})
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {admission.branch?.name || admission.city}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" /> {admission.phone_student}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-4 h-4" /> {admission.email}
            </span>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile & Contact</TabsTrigger>
          <TabsTrigger value="academic">Academic & Forms</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payment">Payment Info</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Personal Details">
              <Row
                icon={<User className="w-4 h-4" />}
                label="First Name"
                value={admission.first_name}
              />
              <Row label="Surname" value={admission.surname} />
              <Row
                icon={<Calendar className="w-4 h-4" />}
                label="Date of Birth"
                value={admission.dob}
              />
              <Row label="Category" value={admission.category?.toUpperCase() || "—"} />
            </Card>

            <Card title="Address & Location">
              <Row icon={<MapPin className="w-4 h-4" />} label="Street" value={admission.street} />
              {admission.apartment && <Row label="Apartment" value={admission.apartment} />}
              <Row label="City" value={admission.city} />
              <Row label="State" value={admission.state} />
              <Row label="Pincode" value={admission.pincode} />
              <Row label="Country" value={admission.country} />
              <Row label="Location Area" value={admission.location || "—"} />
            </Card>

            <Card title="Parents & Guardians">
              <Row label="Father's Name" value={admission.father_name || "—"} />
              <Row label="Mother's Name" value={admission.mother_name || "—"} />
              <Row
                icon={<Phone className="w-4 h-4" />}
                label="Father Phone"
                value={admission.phone_father || "—"}
              />
              {admission.phone_father_2 && (
                <Row
                  icon={<Phone className="w-4 h-4" />}
                  label="Alt Father Phone"
                  value={admission.phone_father_2}
                />
              )}
              <Row
                icon={<Mail className="w-4 h-4" />}
                label="Parent Email"
                value={admission.email_parent || "—"}
              />
            </Card>

            <Card title="Administrative Notes">
              <div className="space-y-4">
                <Row
                  label="Counsellor"
                  value={admission.assigned_counsellor?.name || "Unassigned"}
                />
                <Row
                  label="Reference"
                  value={admission.reference?.replace(/_/g, " ").toUpperCase() || "—"}
                />
                <Row label="Consent Given" value={admission.consent ? "Yes" : "No"} />
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground block mb-1">Notes:</span>
                  <p className="text-sm bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                    {admission.note || "No notes available."}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Admission Details">
              <Row
                label="Course"
                value={<span className="capitalize">{admission.course?.replace(/_/g, " ")}</span>}
              />
              <Row
                label="Module/Group"
                value={
                  <span className="capitalize">{admission.group_module?.replace(/_/g, " ")}</span>
                }
              />
              <Row
                label="Batch Attempt"
                value={<span className="capitalize">{admission.batch_attempt}</span>}
              />
              <Row label="Qualification" value={admission.qualification || "—"} />
            </Card>

            <Card title="10th Standard Details">
              <Row
                label="Medium"
                value={<span className="uppercase">{admission.tenth_medium || "—"}</span>}
              />
              <Row label="School" value={admission.tenth_school || "—"} />
              <Row label="Coaching" value={admission.tenth_coaching || "—"} />
              <Row
                label="Percentage"
                value={admission.tenth_percentage ? `${admission.tenth_percentage}%` : "—"}
              />
              <Row
                label="Percentile"
                value={admission.tenth_percentile ? `${admission.tenth_percentile} PR` : "—"}
              />
            </Card>

            <Card title="12th Standard Details">
              <Row
                label="Medium"
                value={<span className="uppercase">{admission.twelfth_medium || "—"}</span>}
              />
              <Row label="School" value={admission.twelfth_school || "—"} />
              <Row label="Coaching" value={admission.twelfth_coaching || "—"} />
              <Row
                label="Percentage"
                value={admission.twelfth_percentage ? `${admission.twelfth_percentage}%` : "—"}
              />
              <Row
                label="Percentile"
                value={admission.twelfth_percentile ? `${admission.twelfth_percentile} PR` : "—"}
              />
            </Card>

            <Card title="Graduation Details">
              <Row label="University" value={admission.grad_university || "—"} />
              <Row label="College" value={admission.grad_college || "—"} />
              <Row label="Last Semester" value={admission.grad_last_sem || "—"} />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card title="Uploaded Documents">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {DOCUMENT_TYPES.map(({ key, label, icon: Icon }) => {
                const docUrl = admission[key as keyof typeof admission] as string | null;
                const fileType = getFileType(docUrl || undefined);
                const isDocUploading = uploadingDoc === key;

                return (
                  <div
                    key={key}
                    className="relative bg-card border border-border/85 rounded-xl overflow-hidden shadow-xs flex flex-col group transition-all duration-200 hover:shadow-md hover:border-border-hover"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span
                          className="text-xs sm:text-sm font-semibold text-text-primary truncate"
                          title={label}
                        >
                          {label}
                        </span>
                      </div>
                      <Badge
                        variant={docUrl ? "default" : "secondary"}
                        className={
                          docUrl
                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                        }
                      >
                        {docUrl ? "Uploaded" : "Pending"}
                      </Badge>
                    </div>

                    {/* Preview Area */}
                    <div className="relative h-48 flex items-center justify-center p-4 bg-muted/5 min-h-[12rem]">
                      {isDocUploading && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 transition-all duration-200">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                          <span className="text-xs font-medium text-muted-foreground animate-pulse">
                            Uploading...
                          </span>
                        </div>
                      )}

                      {docUrl ? (
                        fileType === "image" ? (
                          <div className="relative w-full h-full group/image rounded overflow-hidden flex items-center justify-center">
                            <img
                              src={docUrl}
                              alt={label}
                              className="max-w-full max-h-full object-contain rounded border transition-transform duration-300 group-hover/image:scale-102"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-xs gap-1 shadow-xs"
                                onClick={() => window.open(docUrl, "_blank")}
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 text-xs gap-1 shadow-xs bg-primary hover:bg-primary/90 text-white border-0"
                                onClick={() => triggerFileInput(key)}
                              >
                                <Upload className="w-3.5 h-3.5" /> Replace
                              </Button>
                            </div>
                          </div>
                        ) : fileType === "pdf" ? (
                          <div className="relative w-full h-full flex flex-col items-center justify-center bg-red-500/5 border border-red-100/50 rounded-lg p-4 text-center group/pdf">
                            <FileText className="w-12 h-12 text-red-500 mb-2 transition-transform duration-200 group-hover/pdf:scale-105" />
                            <span className="text-xs font-semibold text-red-700 dark:text-red-400 truncate max-w-full">
                              {docUrl.split("/").pop()?.split("?")[0] || "document.pdf"}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1">
                              PDF Document
                            </span>
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pdf:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-xs gap-1 shadow-xs"
                                onClick={() => window.open(docUrl, "_blank")}
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 text-xs gap-1 shadow-xs bg-primary hover:bg-primary/90 text-white border-0"
                                onClick={() => triggerFileInput(key)}
                              >
                                <Upload className="w-3.5 h-3.5" /> Replace
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full flex flex-col items-center justify-center bg-blue-500/5 border border-blue-100/50 rounded-lg p-4 text-center group/other">
                            <FileText className="w-12 h-12 text-blue-500 mb-2 transition-transform duration-200 group-hover/other:scale-105" />
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate max-w-full">
                              {docUrl.split("/").pop()?.split("?")[0] || "document"}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1">
                              Attachment File
                            </span>
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/other:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-xs gap-1 shadow-xs"
                                onClick={() => window.open(docUrl, "_blank")}
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 text-xs gap-1 shadow-xs bg-primary hover:bg-primary/90 text-white border-0"
                                onClick={() => triggerFileInput(key)}
                              >
                                <Upload className="w-3.5 h-3.5" /> Replace
                              </Button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg bg-muted/5 text-center p-4">
                          <Upload className="w-8 h-8 text-muted-foreground/40 mb-2" />
                          <span className="text-xs text-muted-foreground mb-3">
                            No document uploaded
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary-dark"
                            onClick={() => triggerFileInput(key)}
                          >
                            <Upload className="w-3.5 h-3.5" /> Upload File
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Footer buttons for mobile/touch screens */}
                    {docUrl && (
                      <div className="p-3 border-t border-border/50 flex gap-2 md:hidden bg-muted/5 mt-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 gap-1"
                          onClick={() => window.open(docUrl, "_blank")}
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 gap-1"
                          onClick={() => triggerFileInput(key)}
                        >
                          <Upload className="w-3.5 h-3.5" /> Replace
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Payment Status">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {admission.status === "payment_submitted" || admission.status === "active" ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-lg capitalize">
                      {admission.status.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {admission.status === "payment_pending"
                        ? "Waiting for student to upload payment details."
                        : "Payment details submitted."}
                    </p>
                  </div>
                </div>

                {admission.status === "payment_pending" && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm mt-4">
                    The student has been sent a link to upload their payment details.
                    <br />
                    Link: <code>/insight/student/payment-upload?id={admission.id}</code>
                  </div>
                )}
              </div>
            </Card>

            {(admission.payment_screenshot ||
              admission.transaction_id ||
              admission.payment_amount) && (
              <Card title="Payment Details">
                <Row
                  label="Transaction ID"
                  value={
                    <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
                      {admission.transaction_id || "N/A"}
                    </span>
                  }
                />
                <Row
                  label="Submitted At"
                  value={
                    admission.payment_submitted_at
                      ? new Date(admission.payment_submitted_at).toLocaleString()
                      : "—"
                  }
                />
                {admission.payment_amount ? (
                  <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-border/40 last:border-0 gap-1 sm:gap-43">
                    <span className="text-sm text-muted-foreground block mb-1">Amount Paid:</span>
                    <span className="text-sm font-bold text-card-foreground">
                      {formatCurrency(Number(admission.payment_amount))}
                    </span>
                  </div>
                ) : null}
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground block mb-2">Screenshot:</span>
                  {admission.payment_screenshot ? (
                    <a href={admission.payment_screenshot} target="_blank" rel="noreferrer">
                      <img
                        src={admission.payment_screenshot}
                        alt="Payment Screenshot"
                        className="max-h-[200px] rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : (
                    <span className="text-sm">No screenshot provided.</span>
                  )}
                </div>
                {admission.payment_note && (
                  <div className="pt-4">
                    <span className="text-sm text-muted-foreground block mb-1">Student Note:</span>
                    <p className="text-sm bg-muted/30 p-2 rounded-md">{admission.payment_note}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden File Input for document upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />

      {/* Edit Admission Details Dialog component */}
      <EditAdmissionDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        admission={admission}
        onSaveSuccess={loadAdmissionDetails}
      />
    </div>
  );
}
