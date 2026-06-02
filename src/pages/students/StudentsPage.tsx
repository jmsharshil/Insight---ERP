import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users, GraduationCap, UserCheck, Award, Search } from "lucide-react";
import { z } from "zod";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DUMMY_STUDENTS, STUDENT_STATUS_META, COURSE_LIST, BATCH_LIST,
  type Student, type StudentStatus,
} from "@/constants/dummy/students";
import { DUMMY_LEADS } from "@/constants/dummy/crm";
import { cn, formatCurrency } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

const stepSchemas = [
  z.object({
    name: z.string().trim().min(2).max(80),
    dob: z.string().min(4),
    phone: z.string().trim().min(7),
    email: z.string().trim().email(),
    bloodGroup: z.string().min(1),
    address: z.string().trim().min(4),
  }),
  z.object({
    course: z.string().min(1),
    batch: z.string().min(1),
    guardianName: z.string().trim().min(2),
    guardianPhone: z.string().trim().min(7),
  }),
];

export default function StudentsPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => { setPageTitle("Students"); }, [setPageTitle]);

  const [students, setStudents] = useState<Student[]>(DUMMY_STUDENTS);
  const [filters, setFilters] = useState({ course: "all", batch: "all", status: "all" });
  const [addOpen, setAddOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ student: Student; status: StudentStatus } | null>(null);
  const [batchTransfer, setBatchTransfer] = useState<Student | null>(null);

  const canManage = user && !["student", "parent", "faculty"].includes(user.role);
  const isSuperAdmin = user?.role === "super_admin";

  // Open add form prefilled from CRM
  const prefillLeadId = params.get("prefill");
  useEffect(() => {
    if (prefillLeadId) setAddOpen(true);
  }, [prefillLeadId]);
  const prefillLead = prefillLeadId ? DUMMY_LEADS.find(l => l.id === prefillLeadId) : null;

  const visible = useMemo(() => {
    return students.filter(s =>
      (filters.course === "all" || s.course === filters.course) &&
      (filters.batch === "all" || s.batch === filters.batch) &&
      (filters.status === "all" || s.status === filters.status));
  }, [students, filters]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === "active").length,
    newThisMonth: students.filter(s => new Date(s.admissionDate) > new Date(Date.now() - 30 * 86400000)).length,
    alumni: students.filter(s => s.status === "alumni").length,
  }), [students]);

  function feeBadge(s: Student) {
    const paidPct = (s.feePaid / s.feeTotal) * 100;
    if (paidPct >= 100) return { label: "Paid", bg: "bg-green-100", color: "text-green-700" };
    if (paidPct >= 50) return { label: "Partial", bg: "bg-amber-100", color: "text-amber-700" };
    return { label: "Overdue", bg: "bg-red-100", color: "text-red-700" };
  }

  const cols: DataTableColumn<Student>[] = [
    {
      key: "name", header: "Student",
      render: (r) => (
        <button
          onClick={() => navigate(`/students/${r.id}`)}
          className="flex items-center gap-2 hover:text-primary-dark"
        >
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark grid place-items-center text-xs font-medium">
            {r.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <span className="font-medium">{r.name}</span>
        </button>
      ),
    },
    { key: "admissionNumber", header: "Admission No", className: "font-mono text-xs" },
    { key: "course", header: "Course" },
    { key: "batch", header: "Batch" },
    {
      key: "status", header: "Status",
      render: (r) => {
        const m = STUDENT_STATUS_META[r.status];
        return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", m.bg, m.color)}>{m.label}</span>;
      },
    },
    {
      key: "attendancePercent", header: "Attendance",
      render: (r) => <span className={cn("font-medium text-sm", r.attendancePercent < 75 ? "text-destructive" : "text-success")}>{r.attendancePercent}%</span>,
    },
    {
      key: "feeStatus", header: "Fees",
      render: (r) => {
        const f = feeBadge(r);
        return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", f.bg, f.color)}>{f.label}</span>;
      },
    },
    {
      key: "actions", header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/students/${r.id}`)}>View Profile</DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuItem onClick={() => setBatchTransfer(r)}>Transfer Batch</DropdownMenuItem>
                {(["active","inactive","transferred","alumni"] as StudentStatus[]).filter(s => s !== r.status).map(s => (
                  <DropdownMenuItem key={s} onClick={() => setConfirmState({ student: r, status: s })}>
                    Mark as {STUDENT_STATUS_META[s].label}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Student Management"
        subtitle="View, manage and onboard students."
        actions={
          canManage ? (
            <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
              <Plus className="w-4 h-4" /> Add Student
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Total Students" value={stats.total} icon={Users} index={0} />
        <StatCard title="Active" value={stats.active} icon={UserCheck} index={1} />
        <StatCard title="New This Month" value={stats.newThisMonth} icon={GraduationCap} trendType="up" index={2} />
        <StatCard title="Alumni" value={stats.alumni} icon={Award} index={3} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {isSuperAdmin && (
          <Select defaultValue="all">
            <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="surat">Surat Main</SelectItem>
              <SelectItem value="vadodara">Vadodara</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={filters.course} onValueChange={(v) => setFilters({ ...filters, course: v })}>
          <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {COURSE_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.batch} onValueChange={(v) => setFilters({ ...filters, batch: v })}>
          <SelectTrigger className="w-32 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {BATCH_LIST.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-32 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STUDENT_STATUS_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={cols} data={visible} exportable={isSuperAdmin || user?.role === "branch_manager"} />

      <AddStudentDialog
        open={addOpen}
        prefill={prefillLead ? { name: prefillLead.studentName, guardianName: prefillLead.guardianName, phone: prefillLead.contact, email: prefillLead.email, course: prefillLead.courseInterested } : undefined}
        onClose={() => setAddOpen(false)}
        onCreate={(data) => {
          const next = students.length + 1;
          const id = `STU-2024-${String(next).padStart(3, "0")}`;
          const s: Student = {
            id, admissionNumber: id,
            name: data.name, email: data.email, phone: data.phone,
            guardianName: data.guardianName, guardianPhone: data.guardianPhone,
            course: data.course, batch: data.batch,
            status: "active", dob: data.dob, address: data.address,
            bloodGroup: data.bloodGroup, admissionDate: new Date().toISOString().slice(0,10),
            feePaid: 0, feeTotal: 60000, attendancePercent: 100,
            digitalId: { qrCode: `QR-${id}`, validUntil: "2026-12-31" },
            inventory: { uniforms: 2, books: [`${data.course} Vol 1`] },
            documents: [],
          };
          setStudents(prev => [s, ...prev]);
          setAddOpen(false);
          toast.success(`Student ${id} added successfully. Admission number generated.`);
        }}
      />

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(o) => !o && setConfirmState(null)}
        title={`Change status to ${confirmState ? STUDENT_STATUS_META[confirmState.status].label : ""}?`}
        description="This action will be logged in the audit trail."
        variant={confirmState?.status === "inactive" ? "warning" : "info"}
        onConfirm={() => {
          if (!confirmState) return;
          setStudents(prev => prev.map(s => s.id === confirmState.student.id ? { ...s, status: confirmState.status } : s));
          toast.success(`${confirmState.student.name} marked as ${STUDENT_STATUS_META[confirmState.status].label}.`);
          setConfirmState(null);
        }}
      />

      <BatchTransferDialog
        student={batchTransfer}
        onClose={() => setBatchTransfer(null)}
        onSave={(newBatch) => {
          if (!batchTransfer) return;
          setStudents(prev => prev.map(s => s.id === batchTransfer.id ? { ...s, batch: newBatch } : s));
          toast.success(`Batch changed to ${newBatch}. Logged.`);
          setBatchTransfer(null);
        }}
      />
    </div>
  );
}

/* ---------- Add Student multi-step ---------- */
function AddStudentDialog({
  open, onClose, onCreate, prefill,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  prefill?: Partial<{ name: string; guardianName: string; phone: string; email: string; course: string }>;
}) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any>({
    name: "", dob: "", phone: "", email: "", bloodGroup: "", address: "",
    course: "", batch: "", guardianName: "", guardianPhone: "",
  });

  useEffect(() => {
    if (open) {
      setStep(0);
      setData((d: any) => ({ ...d, ...prefill }));
    }
  }, [open, prefill]);

  function next() {
    if (step < 2) {
      const schema = stepSchemas[step];
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        toast.error("Please fix the errors before submitting.");
        return;
      }
      setStep(step + 1);
    } else {
      setStep(3);
    }
  }

  const STEPS = ["Personal", "Academic", "Documents", "Review"];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Student</DialogTitle>
          <DialogDescription>Complete all steps to enrol a new student.</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <motion.div
                animate={{ scale: i === step ? 1.1 : 1, backgroundColor: i <= step ? "#F7A900" : "#E5E7EB" }}
                className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold text-white"
              >
                {i + 1}
              </motion.div>
              <span className={cn("text-xs", i === step ? "font-semibold" : "text-muted-foreground")}>{label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 mt-2">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *"><Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} /></Field>
              <Field label="DOB *"><Input type="date" value={data.dob} onChange={e => setData({ ...data, dob: e.target.value })} /></Field>
              <Field label="Phone *"><Input value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} /></Field>
              <Field label="Email *"><Input value={data.email} onChange={e => setData({ ...data, email: e.target.value })} /></Field>
              <Field label="Blood Group *">
                <Select value={data.bloodGroup} onValueChange={(v) => setData({ ...data, bloodGroup: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Address *" className="col-span-2"><Textarea value={data.address} onChange={e => setData({ ...data, address: e.target.value })} rows={2} /></Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Course *">
                <Select value={data.course} onValueChange={(v) => setData({ ...data, course: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{COURSE_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Batch *">
                <Select value={data.batch} onValueChange={(v) => setData({ ...data, batch: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{BATCH_LIST.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Guardian Name *"><Input value={data.guardianName} onChange={e => setData({ ...data, guardianName: e.target.value })} /></Field>
              <Field label="Guardian Phone *"><Input value={data.guardianPhone} onChange={e => setData({ ...data, guardianPhone: e.target.value })} /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Drop documents here</p>
              <p>Photo ID, Marksheets, Address Proof (UI only — no real upload in this demo)</p>
            </div>
          )}
          {step === 3 && (
            <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-1">
              <p><b>Name:</b> {data.name}</p>
              <p><b>Course:</b> {data.course} · <b>Batch:</b> {data.batch}</p>
              <p><b>Guardian:</b> {data.guardianName} ({data.guardianPhone})</p>
              <p><b>Phone:</b> {data.phone} · <b>Email:</b> {data.email}</p>
            </div>
          )}
        </motion.div>

        <DialogFooter>
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          {step < 3 ? (
            <Button onClick={next} className="bg-primary hover:bg-primary-dark text-primary-foreground">Next</Button>
          ) : (
            <Button onClick={() => onCreate(data)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
              Confirm & Add
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* ---------- Batch transfer ---------- */
function BatchTransferDialog({
  student, onClose, onSave,
}: { student: Student | null; onClose: () => void; onSave: (b: string) => void }) {
  const [b, setB] = useState("");
  const [reason, setReason] = useState("");
  useEffect(() => { if (student) { setB(""); setReason(""); } }, [student]);
  if (!student) return null;
  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Transfer Batch — {student.name}</DialogTitle>
          <DialogDescription>Current: <b>{student.batch}</b></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="New Batch">
            <Select value={b} onValueChange={setB}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {BATCH_LIST.filter(x => x !== student.batch).map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reason"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!b} onClick={() => onSave(b)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
