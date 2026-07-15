import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { studentActions, inventoryActions } from "@/redux/actions";
import { setStudentDetail, setStudentDetailLoading, setStudentDetailError } from "@/redux/slices/studentSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { motion } from "framer-motion";
import {
  ChevronLeft, Calendar, MapPin, Phone, Mail, FileText, User,
  CreditCard, GraduationCap, Shield, Clock, Building2, Heart,
  Globe, Droplets, BookOpen, QrCode, Download, ExternalLink,
  Users, History, AlertCircle, CheckCircle2, Image, Package, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

/* ─── Skeleton Loading State ─────────────────────────── */
function DetailSkeleton() {
  return (
    <div className=" mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Skeleton width={36} height={36} borderRadius={8} />
        <Skeleton width={180} height={28} />
      </div>
      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <Skeleton circle width={96} height={96} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton width={220} height={32} />
            <Skeleton width={60} height={22} borderRadius={12} />
          </div>
          <Skeleton width={320} height={16} />
          <div className="flex gap-6 pt-1">
            <Skeleton width={120} height={14} />
            <Skeleton width={120} height={14} />
            <Skeleton width={160} height={14} />
          </div>
        </div>
      </div>
      {/* Quick info pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <Skeleton width={100} height={12} />
            <Skeleton width={140} height={20} />
          </div>
        ))}
      </div>
      {/* Tab bar */}
      <Skeleton width={400} height={40} borderRadius={8} />
      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <Skeleton width={160} height={20} />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton width="35%" height={14} />
                  <Skeleton width="55%" height={14} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Reusable Sub-components ────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

function InfoRow({ icon, label, value, mono }: { icon?: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  if (!value || value === "—") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-border/30 last:border-0 gap-1 sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-2/5 flex-shrink-0">
          {icon && <span className="text-muted-foreground/60">{icon}</span>}
          <span>{label}</span>
        </div>
        <div className="text-sm text-muted-foreground/50 sm:w-3/5">—</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-border/30 last:border-0 gap-1 sm:gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:w-2/5 flex-shrink-0">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className={`text-sm font-medium sm:w-3/5 break-words ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function SectionCard({ title, icon, children, index = 0 }: { title: string; icon?: React.ReactNode; children: React.ReactNode; index?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full"
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-muted/30 border-b border-border/50">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="font-heading text-sm font-semibold text-card-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function QuickInfoPill({ icon, label, value, index = 0 }: { icon: React.ReactNode; label: string; value: string; index?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-text-primary truncate">{value}</p>
      </div>
    </motion.div>
  );
}

function DocCard({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 p-3.5 rounded-lg border border-border bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
    >
      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 grid place-items-center flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        {icon || <FileText className="w-4 h-4" />}
      </div>
      <span className="text-sm font-medium flex-1 truncate">{label}</span>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </a>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  } catch {
    return dateStr;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "inactive": return "bg-red-50 text-red-700 border-red-200";
    case "alumni": return "bg-purple-50 text-purple-700 border-purple-200";
    case "suspended": return "bg-amber-50 text-amber-700 border-amber-200";
    default: return "bg-gray-50 text-black border-gray-200";
  }
}

/* ─── Main Page ──────────────────────────────────────── */

type BulkAllocLine = { item: string; quantity: string; notes: string };
const blankBulkLine = (): BulkAllocLine => ({ item: "", quantity: "1", notes: "" });

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { setPageTitle } = useUI();

  const { currentStudent: student, loadingDetail, detailError } = useSelector((state: RootState) => state.students);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueMode, setIssueMode] = useState<"single" | "bulk">("single");
  const [issueLoading, setIssueLoading] = useState(false);
  
  const [issueForm, setIssueForm] = useState({ item: "", quantity: "1", notes: "" });
  const [bulkLines, setBulkLines] = useState<BulkAllocLine[]>([blankBulkLine()]);

  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnTarget, setReturnTarget] = useState<any>(null);
  const [returnNotes, setReturnNotes] = useState("");

  const fetchInventoryItems = () => {
    dispatch({
      type: inventoryActions.GET_ITEMS,
      method: "GET",
      endPoint: API.INVENTORY.ITEMS,
      auth: true,
      getResponse: (res: any) => {
        const data = Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.results)
              ? res.data.results
              : [];
        setInventoryItems(data);
      },
      getError: () => toast.error("Failed to fetch inventory items"),
    });
  };

  const handleOpenIssue = () => {
    setIssueOpen(true);
    fetchInventoryItems();
  };

  const handleIssueItem = () => {
    dispatch({
      type: inventoryActions.CREATE_ALLOCATION,
      method: "POST",
      endPoint: API.INVENTORY.ALLOCATIONS,
      body: {
        item: issueForm.item,
        quantity: Number(issueForm.quantity),
        status: "issued",
        student: student?.id,
        ...(issueForm.notes ? { notes: issueForm.notes } : {}),
      },
      auth: true,
      setLoading: (v: boolean) => setIssueLoading(v),
      getResponse: () => {
        toast.success("Item issued successfully.");
        setIssueOpen(false);
        setIssueForm({ item: "", quantity: "1", notes: "" });
        if (id) {
          dispatch({
            type: studentActions.GET_STUDENT_DETAIL,
            method: "GET",
            endPoint: API.STUDENTS.GET(id),
            auth: true,
            getResponse: (r: any) => {
              if (r?.success && r?.data) {
                dispatch(setStudentDetail(r.data));
              }
            }
          });
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to issue item"),
    });
  };

  const addBulkLine = () => setBulkLines(p => [...p, blankBulkLine()]);
  const removeBulkLine = (idx: number) => setBulkLines(p => p.filter((_, i) => i !== idx));
  const updateBulkLine = (idx: number, field: keyof BulkAllocLine, val: string) => {
    setBulkLines(p => p.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const handleBulkIssue = () => {
    const body: any = {
      student: student?.id,
      allocations: bulkLines.map((line) => ({
        item: line.item,
        quantity: Number(line.quantity),
        ...(line.notes ? { notes: line.notes } : {}),
      })),
    };

    dispatch({
      type: inventoryActions.BULK_ALLOCATION,
      method: "POST",
      endPoint: API.INVENTORY.ALLOCATION_BULK,
      body,
      auth: true,
      setLoading: (v: boolean) => setIssueLoading(v),
      getResponse: (res: any) => {
        const created = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (created.length > 0) {
          toast.success(`${created.length} item(s) issued successfully.`);
          setIssueOpen(false);
          setBulkLines([blankBulkLine()]);
          if (id) {
            dispatch({
              type: studentActions.GET_STUDENT_DETAIL,
              method: "GET",
              endPoint: API.STUDENTS.GET(id),
              auth: true,
              getResponse: (r: any) => {
                if (r?.success && r?.data) {
                  dispatch(setStudentDetail(r.data));
                }
              }
            });
          }
        } else toast.error("Failed to issue items.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to issue items"),
    });
  };

  const handleOpenReturn = (item: any) => {
    setReturnTarget(item);
    setReturnNotes("");
    setReturnOpen(true);
  };

  const handleReturnItem = () => {
    if (!returnTarget) return;
    dispatch({
      type: inventoryActions.RETURN_ALLOCATION,
      method: "POST",
      endPoint: API.INVENTORY.ALLOCATION_RETURN(returnTarget.allocation_id),
      body: { return_notes: returnNotes },
      auth: true,
      setLoading: (v: boolean) => setReturnLoading(v),
      getResponse: () => {
        toast.success("Item returned successfully. Stock restored.");
        setReturnOpen(false);
        setReturnTarget(null);
        setReturnNotes("");
        // Reload student details to refresh returned item status
        if (id) {
          dispatch({
            type: studentActions.GET_STUDENT_DETAIL,
            method: "GET",
            endPoint: API.STUDENTS.GET(id),
            auth: true,
            getResponse: (r: any) => {
              if (r?.success && r?.data) {
                dispatch(setStudentDetail(r.data));
              }
            }
          });
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to return item"),
    });
  };

  useEffect(() => {
    setPageTitle("Student Profile");
  }, [setPageTitle]);

  useEffect(() => {
    if (!id) return;
    dispatch({
      type: studentActions.GET_STUDENT_DETAIL,
      method: "GET",
      endPoint: API.STUDENTS.GET(id),
      auth: true,
      setLoading: (val: boolean) => dispatch(setStudentDetailLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setStudentDetail(res.data));
        } else {
          dispatch(setStudentDetailError("Invalid data format"));
        }
      },
      getError: (err: any) => {
        dispatch(setStudentDetailError(err?.message || "Failed to load"));
        toast.error("Failed to load student details.");
      }
    });
  }, [id, dispatch, toast]);

  if (loadingDetail) return <DetailSkeleton />;
  if (detailError) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <p className="text-lg font-medium text-red-600 mb-2">Failed to load student</p>
      <p className="text-sm text-muted-foreground mb-4">{detailError}</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );
  if (!student) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-lg font-medium text-muted-foreground">No student data found.</p>
      <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
    </div>
  );

  const address = [student.apartment, student.street, student.city, student.state, student.pincode, student.country]
    .filter(Boolean).join(", ");

  const docs = [
    { key: "doc_id_proof", label: "ID Proof", icon: <Shield className="w-4 h-4" /> },
    { key: "doc_dob_certificate", label: "DOB Certificate", icon: <Calendar className="w-4 h-4" /> },
    { key: "doc_signature", label: "Signature", icon: <FileText className="w-4 h-4" /> },
    { key: "doc_tenth_marksheet", label: "10th Marksheet", icon: <BookOpen className="w-4 h-4" /> },
    { key: "doc_twelfth_marksheet", label: "12th Marksheet", icon: <BookOpen className="w-4 h-4" /> },
    { key: "doc_graduation_cert", label: "Graduation Certificate", icon: <GraduationCap className="w-4 h-4" /> },
    { key: "doc_category_cert", label: "Category Certificate", icon: <FileText className="w-4 h-4" /> },
  ].filter(d => (student as any)[d.key]);

  return (
    <div className=" mx-auto space-y-6 pb-12">
      {/* ── Back Navigation ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Student Profile</h1>
      </div>

      {/* ── Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
      >
        {/* Accent band */}
        <div className="h-1.5 " />
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary grid place-items-center text-3xl font-bold shadow-md ring-2 ring-primary/20">
              {student.full_name?.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">{student.full_name}</h2>
              <Badge className={`border ${getStatusColor(student.status)} font-medium`}>
                {student.status_display}
              </Badge>
              {student.qr_blocked && (
                <Badge className="bg-red-50 text-red-700 border border-red-200">QR Blocked</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{student.admission_number}</span>
              <span>•</span>
              <span className="capitalize">{student.course?.replace(/_/g, " ")}</span>
              <span>•</span>
              <span className="capitalize">{student.group_module?.replace(/_/g, " ")}</span>
              <span>•</span>
              <span className="capitalize">{student.batch_attempt} batch</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {student.branch?.name}, {student.branch?.city}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {student.phone_student}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {student.email}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Info Pills ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickInfoPill
          icon={<Building2 className="w-5 h-5" />}
          label="Branch"
          value={student.branch?.name || "—"}
          index={0}
        />
        <QuickInfoPill
          icon={<Users className="w-5 h-5" />}
          label="Counsellor"
          value={student.assigned_counsellor?.name || "Unassigned"}
          index={1}
        />
        <QuickInfoPill
          icon={<Clock className="w-5 h-5" />}
          label="Enrolled"
          value={formatDate(student.enrolled_at)}
          index={2}
        />
        <QuickInfoPill
          icon={<CreditCard className="w-5 h-5" />}
          label="ID Card"
          value={student.id_card_ready ? "Ready" : "Not Generated"}
          index={3}
        />
      </div>

      {/* ── Tabbed Content ── */}
      <Tabs defaultValue="profile">
        <TabsList className="mb-5 flex-wrap h-auto p-1">
          <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="family" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Family</TabsTrigger>
          <TabsTrigger value="academic" className="gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Academic</TabsTrigger>
          <TabsTrigger value="idcard" className="gap-1.5"><CreditCard className="w-3.5 h-3.5" /> ID Card</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Documents</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="w-3.5 h-3.5" /> History</TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1.5"><Package className="w-3.5 h-3.5" /> Inventory</TabsTrigger>
        </TabsList>

        {/* ── Tab: Profile ── */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Personal Information" icon={<User className="w-4 h-4" />} index={0}>
              <InfoRow icon={<User className="w-4 h-4" />} label="First Name" value={student.first_name} />
              <InfoRow label="Surname" value={student.surname} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={formatDate(student.dob)} />
              <InfoRow label="Gender" value={student.gender_display || "—"} />
              <InfoRow icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={student.blood_group_display || "—"} />
              <InfoRow icon={<Shield className="w-4 h-4" />} label="Category" value={student.category?.toUpperCase() || "—"} />
              <InfoRow icon={<Globe className="w-4 h-4" />} label="Nationality" value={student.nationality || "—"} />
            </SectionCard>

            <SectionCard title="Contact Details" icon={<Phone className="w-4 h-4" />} index={1}>
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Student Phone" value={student.phone_student} />
              {student.phone_student_2 && (
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Alt Phone" value={student.phone_student_2} />
              )}
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Student Email" value={student.email} />
              <div className="my-3 border-t border-border/30" />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Full Address" value={address || "—"} />
              <InfoRow label="Location Area" value={student.location || "—"} />
            </SectionCard>
          </div>

          {/* Administrative Notes */}
          {student.notes && (
            <SectionCard title="Administrative Notes" icon={<FileText className="w-4 h-4" />} index={2}>
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{student.notes}</p>
            </SectionCard>
          )}
        </TabsContent>

        {/* ── Tab: Family ── */}
        <TabsContent value="family" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Parents" icon={<Users className="w-4 h-4" />} index={0}>
              <InfoRow label="Father's Name" value={student.father_name || "—"} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Father's Phone" value={student.phone_father || "—"} />
              {student.phone_father_2 && (
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Alt Father Phone" value={student.phone_father_2} />
              )}
              <div className="my-3 border-t border-border/30" />
              <InfoRow label="Mother's Name" value={student.mother_name || "—"} />
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Parent Email" value={student.email_parent || "—"} />
            </SectionCard>

            <SectionCard title="Emergency Contact" icon={<Heart className="w-4 h-4" />} index={1}>
              <InfoRow label="Contact Name" value={student.emergency_contact_name || "—"} />
              <InfoRow label="Relationship" value={student.emergency_contact_relationship_display || "—"} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={student.emergency_contact_phone || "—"} />
            </SectionCard>
          </div>

          {/* Linked Parent Accounts */}
          {student.parent_links?.length > 0 && (
            <SectionCard title="Linked Parent Accounts" icon={<Users className="w-4 h-4" />} index={2}>
              <div className="grid sm:grid-cols-2 gap-4">
                {student.parent_links.map((p: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-primary">{p.parent_name}</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{p.relationship_display}</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {p.parent_phone}</p>
                      <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {p.parent_email}</p>
                      <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Linked: {formatDateTime(p.linked_at)}</p>
                    </div>
                    {p.is_primary && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Primary Contact
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* ── Tab: Academic ── */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Course & Enrollment" icon={<GraduationCap className="w-4 h-4" />} index={0}>
              <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Course" value={<span className="capitalize">{student.course?.replace(/_/g, " ")}</span>} />
              <InfoRow label="Module / Group" value={<span className="capitalize">{student.group_module?.replace(/_/g, " ")}</span>} />
              <InfoRow label="Batch Attempt" value={<span className="capitalize">{student.batch_attempt}</span>} />
              <InfoRow label="Current Batch" value={student.current_batch_name || "Not assigned"} />
              <InfoRow label="Qualification" value={student.qualification?.replace(/_/g, " ") || "—"} />
              <InfoRow label="Roll Number" value={student.roll_number || "Not assigned"} />
            </SectionCard>

            <SectionCard title="Counsellor & Branch" icon={<Building2 className="w-4 h-4" />} index={1}>
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="Branch" value={`${student.branch?.name}, ${student.branch?.city}`} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Counsellor" value={student.assigned_counsellor?.name || "None"} />
              {student.assigned_counsellor && (
                <>
                  <InfoRow icon={<Mail className="w-4 h-4" />} label="Counsellor Email" value={student.assigned_counsellor.email} />
                  <InfoRow icon={<Phone className="w-4 h-4" />} label="Counsellor Phone" value={student.assigned_counsellor.phone} />
                </>
              )}
              <div className="my-3 border-t border-border/30" />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Enrolled At" value={formatDateTime(student.enrolled_at)} />
              <InfoRow label="Created At" value={formatDateTime(student.created_at)} />
              <InfoRow label="Last Updated" value={formatDateTime(student.updated_at)} />
            </SectionCard>
          </div>

          {/* Batch History */}
          <SectionCard title="Batch History" icon={<History className="w-4 h-4" />} index={2}>
            {student.batch_history?.length > 0 ? (
              <div className="space-y-3">
                {student.batch_history.map((b: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/40 text-sm">
                    <p className="font-medium">{b.batch_name || b.new_batch}</p>
                    <p className="text-xs text-muted-foreground">{b.reason || "Batch transfer"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-muted-foreground">
                <History className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No batch transfers recorded.</p>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ── Tab: ID Card ── */}
        <TabsContent value="idcard" className="space-y-6">
          {student.id_card ? (
            <div className="grid md:grid-cols-2 gap-6">
              <SectionCard title="Student ID Card" icon={<CreditCard className="w-4 h-4" />} index={0}>
                <div className="flex flex-col items-center py-4">
                  {student.id_card.card_image ? (
                    <a href={student.id_card.card_image} target="_blank" rel="noreferrer" className="group relative">
                      <img
                        src={student.id_card.card_image}
                        alt="Student ID Card"
                        className="max-w-full max-h-[320px] rounded-lg shadow-lg border border-border group-hover:shadow-xl transition-shadow"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors flex items-center justify-center">
                        <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-70 transition-opacity drop-shadow-lg" />
                      </div>
                    </a>
                  ) : (
                    <div className="w-full h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="mt-4 space-y-1 text-center">
                    <p className="text-xs text-muted-foreground">
                      Generated: {formatDateTime(student.id_card.generated_at)}
                    </p>
                    {student.id_card.regenerated_at && (
                      <p className="text-xs text-muted-foreground">
                        Regenerated: {formatDateTime(student.id_card.regenerated_at)}
                      </p>
                    )}
                    <Badge className={student.id_card.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200 mt-2" : "bg-red-50 text-red-700 border border-red-200 mt-2"}>
                      {student.id_card.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="QR Code" icon={<QrCode className="w-4 h-4" />} index={1}>
                <div className="flex flex-col items-center py-4">
                  {student.id_card.qr_image ? (
                    <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
                      <img
                        src={student.id_card.qr_image}
                        alt="Student QR Code"
                        className="w-40 h-40"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-muted/30 rounded-xl flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="mt-4 space-y-2 text-center">
                    <p className="text-xs text-muted-foreground">QR Data</p>
                    <code className="text-xs font-mono bg-muted px-3 py-1.5 rounded-md block max-w-[280px] truncate">
                      {student.id_card.qr_data}
                    </code>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : (
            <SectionCard title="Digital ID Card" icon={<CreditCard className="w-4 h-4" />} index={0}>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CreditCard className="w-16 h-16 mb-4 opacity-15" />
                <p className="text-base font-medium mb-1">ID Card Not Generated</p>
                <p className="text-sm text-muted-foreground/70">The student's digital ID card has not been created yet.</p>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* ── Tab: Documents ── */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo & Signature */}
            <SectionCard title="Photo & Signature" icon={<Image className="w-4 h-4" />} index={0}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Photograph</p>
                  {student.photo_url ? (
                    <a href={student.photo_url} target="_blank" rel="noreferrer">
                      <img src={student.photo_url} alt="Photo" className="w-full max-w-[140px] mx-auto rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow" />
                    </a>
                  ) : (
                    <div className="w-[140px] h-[180px] mx-auto bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Signature</p>
                  {student.doc_signature ? (
                    <a href={student.doc_signature} target="_blank" rel="noreferrer">
                      <img src={student.doc_signature} alt="Signature" className="w-full max-w-[140px] mx-auto rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow" />
                    </a>
                  ) : (
                    <div className="w-[140px] h-[80px] mx-auto bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Document Files */}
            <SectionCard title="Uploaded Documents" icon={<FileText className="w-4 h-4" />} index={1}>
              {docs.length > 0 ? (
                <div className="space-y-2.5">
                  {docs.map(d => (
                    <DocCard key={d.key} href={(student as any)[d.key]} label={d.label} icon={d.icon} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-3 opacity-15" />
                  <p className="text-sm">No documents uploaded yet.</p>
                </div>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        {/* ── Tab: Inventory ── */}
        <TabsContent value="inventory" className="space-y-6">
          <SectionCard title="Issued Inventory Items" icon={<Package className="w-4 h-4" />} index={0}>
            <div className="flex justify-end mb-4">
              <Button onClick={handleOpenIssue} className="gap-2" size="sm">
                <Plus className="w-4 h-4" />
                Allocate Item
              </Button>
            </div>
            {student.issued_items?.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item Name</th>
                      <th className="px-4 py-3 font-medium">Size</th>
                      <th className="px-4 py-3 font-medium">Quantity</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Issued At</th>
                      <th className="px-4 py-3 font-medium">Returned At</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {student.issued_items.map((item: any, i: number) => (
                      <tr key={item.allocation_id || i} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {item.item_name}
                          {item.notes && <span className="block text-xs text-muted-foreground mt-0.5 font-normal">{item.notes}</span>}
                        </td>
                        <td className="px-4 py-3">{item.item_size || "—"}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">
                          <Badge className={`font-normal border ${item.status === 'issued' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            {item.status_display || item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.issued_at)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.returned_at)}</td>
                        <td className="px-4 py-3 text-right">
                          {item.status === 'issued' && (
                            <Button variant="outline" size="sm" onClick={() => handleOpenReturn(item)} className="h-7 text-xs">
                              Return
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
                <Package className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No items issued to this student.</p>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ── Tab: History ── */}
        <TabsContent value="history" className="space-y-6">
          <SectionCard title="Status History" icon={<History className="w-4 h-4" />} index={0}>
            {student.status_history?.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border/60" />
                <div className="space-y-6">
                  {student.status_history.map((h: any, i: number) => (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      className="relative pl-7"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-background shadow-sm ${
                        h.new_status === "active" ? "bg-emerald-500" :
                        h.new_status === "inactive" ? "bg-red-500" :
                        h.new_status === "suspended" ? "bg-amber-500" :
                        "bg-primary"
                      }`} />

                      <div className="bg-muted/20 rounded-lg border border-border/40 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {h.old_status !== h.new_status ? (
                              <>
                                <Badge className="bg-gray-100 text-black border border-gray-200 text-xs">{h.old_status_display}</Badge>
                                <span className="text-muted-foreground text-xs">→</span>
                                <Badge className={`border text-xs ${getStatusColor(h.new_status)}`}>{h.new_status_display}</Badge>
                              </>
                            ) : (
                              <Badge className={`border text-xs ${getStatusColor(h.new_status)}`}>{h.new_status_display}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(h.changed_at)}</span>
                        </div>
                        {h.reason && (
                          <p className="text-sm text-text-secondary mt-2 italic leading-relaxed">"{h.reason}"</p>
                        )}
                        {h.changed_by_name && (
                          <p className="text-xs text-muted-foreground mt-1">Changed by: {h.changed_by_name}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <History className="w-10 h-10 mb-3 opacity-15" />
                <p className="text-sm">No status changes recorded yet.</p>
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* ── Issue Item Dialog ── */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Issue Item(s) to {student.full_name}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-2">
            <Button
              variant={issueMode === "single" ? "default" : "outline"}
              className="gap-2 h-9 flex-1"
              onClick={() => setIssueMode("single")}
            >
              <User className="w-4 h-4" /> Single Issue
            </Button>
            <Button
              variant={issueMode === "bulk" ? "default" : "outline"}
              className={`gap-2 h-9 flex-1 ${issueMode === "bulk" ? "bg-amber-500 hover:bg-amber-600 text-white border-none" : ""}`}
              onClick={() => setIssueMode("bulk")}
            >
              <Package className="w-4 h-4" /> Bulk Issue
            </Button>
          </div>

          {issueMode === "single" && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm mb-1 block">Item *</Label>
                <Select
                  value={issueForm.item}
                  onValueChange={(v) => setIssueForm((prev) => ({ ...prev, item: v }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} {item.size ? `(${item.size})` : ""} — Stock: {item.total_stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">Quantity *</Label>
                <Input
                  type="number" min="0"
                  value={issueForm.quantity}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  min="1"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">Notes</Label>
                <Textarea
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Optional notes..."
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {issueMode === "bulk" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Items to Issue *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={addBulkLine}
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>

                {bulkLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 border border-border rounded-lg">
                    <div className="col-span-6">
                      {idx === 0 && <Label className="text-xs mb-1 block">Item</Label>}
                      <Select
                        value={line.item}
                        onValueChange={(v) => updateBulkLine(idx, "item", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} {item.size ? `(${item.size})` : ""} — {item.total_stock}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs mb-1 block">Qty</Label>}
                      <Input
                        type="number" min="0"
                        value={line.quantity}
                        onChange={(e) => updateBulkLine(idx, "quantity", e.target.value)}
                        min="1"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      {idx === 0 && <Label className="text-xs mb-1 block">Notes</Label>}
                      <Input
                        value={line.notes}
                        onChange={(e) => updateBulkLine(idx, "notes", e.target.value)}
                        placeholder="Optional"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-1">
                      {bulkLines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeBulkLine(idx)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
                ℹ All items will be issued atomically — if any item fails, none will be issued.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)} disabled={issueLoading}>
              Cancel
            </Button>
            <Button
              onClick={issueMode === "single" ? handleIssueItem : handleBulkIssue}
              disabled={
                issueLoading ||
                (issueMode === "single" && (!issueForm.item || !issueForm.quantity)) ||
                (issueMode === "bulk" && bulkLines.some((l) => !l.item || !l.quantity))
              }
              className={`${issueMode === "bulk" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
            >
              {issueLoading
                ? "Issuing..."
                : issueMode === "bulk"
                  ? `Issue ${bulkLines.length} Item(s)`
                  : "Issue Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Return Confirm Dialog ── */}
      <Dialog open={returnOpen} onOpenChange={o => { setReturnOpen(o); if (!o) setReturnTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return Item</DialogTitle>
            {returnTarget && (
              <p className="text-sm text-muted-foreground mt-1">
                Returning <span className="font-semibold text-foreground">{returnTarget.item_name}</span> (Qty: {returnTarget.quantity})
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-1 block">Return Notes</Label>
              <Textarea
                value={returnNotes}
                onChange={e => setReturnNotes(e.target.value)}
                placeholder="Condition on return, notes, etc."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)} disabled={returnLoading}>Cancel</Button>
            <Button onClick={handleReturnItem} disabled={returnLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {returnLoading ? "Returning…" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
