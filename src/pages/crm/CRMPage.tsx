import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, Users, UserPlus, TrendingUp, CheckCircle2, XCircle,
  ChevronRight, Phone, Mail, Calendar as CalIcon, MessageSquare,
  StickyNote, Move,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DUMMY_LEADS, LEAD_STATUS_META, COURSE_OPTIONS, SOURCE_OPTIONS, ASSIGNEE_POOL,
  type Lead, type LeadStatus, type InteractionNote,
} from "@/constants/dummy/crm";
import { formatDate, cn } from "@/lib/utils";

const STATUSES: LeadStatus[] = ["new", "contacted", "interested", "converted", "lost"];

const leadSchema = z.object({
  studentName: z.string().trim().min(2, "Required").max(80),
  guardianName: z.string().trim().min(2, "Required").max(80),
  contact: z.string().trim().min(7, "Enter contact"),
  email: z.string().trim().email("Invalid email").or(z.literal("")),
  courseInterested: z.string().min(1, "Required"),
  source: z.string().min(1, "Required"),
  assignedTo: z.string().min(1, "Required"),
  remarks: z.string().max(500).optional(),
});
type LeadForm = z.infer<typeof leadSchema>;

function StatusBadge({ status }: { status: LeadStatus }) {
  const m = LEAD_STATUS_META[status];
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400 }}
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", m.bg, m.color)}
    >
      {m.label}
    </motion.span>
  );
}

export default function CRMPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => { setPageTitle("CRM & Pre-Admission"); }, [setPageTitle]);

  const [leads, setLeads] = useState<Lead[]>(DUMMY_LEADS);
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "convert" | "lost"; lead: Lead } | null>(null);
  const [tab, setTab] = useState("pipeline");

  const role = user?.role;
  const isLeadOwnerOnly = role === "counsellor" || role === "telecaller" || role === "sales_exec";
  const canReassign = role === "super_admin" || role === "branch_manager" || role === "sales_senior_exec";
  const canCreate = role !== "student" && role !== "parent" && role !== "faculty";

  // Role-scoped leads
  const visibleLeads = useMemo(() => {
    if (isLeadOwnerOnly && user) return leads.filter(l => l.assignedTo === user.id);
    return leads;
  }, [leads, isLeadOwnerOnly, user]);

  const stats = useMemo(() => {
    const by = (s: LeadStatus) => visibleLeads.filter(l => l.status === s).length;
    return {
      total: visibleLeads.length,
      new: by("new"),
      progress: by("contacted") + by("interested"),
      converted: by("converted"),
      lost: by("lost"),
    };
  }, [visibleLeads]);

  function moveLead(lead: Lead, to: LeadStatus) {
    if (to === lead.status) return;
    if (to === "converted") { setConfirm({ kind: "convert", lead }); return; }
    if (to === "lost") { setConfirm({ kind: "lost", lead }); return; }
    setLeads(prev => prev.map(l => l.id === lead.id
      ? { ...l, status: to, updatedAt: new Date().toISOString(),
          notes: [...l.notes, {
            id: `n-${Date.now()}`, author: user?.name ?? "—",
            content: `Status changed to ${LEAD_STATUS_META[to].label}`,
            type: "status_change", createdAt: new Date().toISOString(),
          }] }
      : l));
    if (selected?.id === lead.id) {
      setSelected(s => s ? { ...s, status: to } : s);
    }
    toast.success(`Lead moved to ${LEAD_STATUS_META[to].label}`);
  }

  function performConvert(lead: Lead) {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: "converted" } : l));
    toast.success("Lead converted! Student admission form auto-populated.");
    setConfirm(null); setSelected(null);
    navigate(`/students?prefill=${lead.id}`);
  }
  function performLost(lead: Lead) {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: "lost", lostReason: "Marked lost manually" } : l));
    toast.info("Lead marked as lost.");
    setConfirm(null);
  }

  function addNote(lead: Lead, content: string, type: InteractionNote["type"]) {
    if (!content.trim()) { toast.error("Please fix the errors before submitting."); return; }
    const note: InteractionNote = {
      id: `n-${Date.now()}`,
      author: user?.name ?? "—",
      content: content.trim(),
      type,
      createdAt: new Date().toISOString(),
    };
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, notes: [...l.notes, note] } : l));
    setSelected(s => s && s.id === lead.id ? { ...s, notes: [...s.notes, note] } : s);
    toast.success("Note added");
  }

  return (
    <div>
      <PageHeader
        title="CRM & Pre-Admission"
        subtitle="Manage inquiries through the admission pipeline."
        actions={
          canCreate ? (
            <Button onClick={() => setNewOpen(true)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
              <Plus className="w-4 h-4" /> New Inquiry
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard title="Total Leads" value={stats.total} icon={Users} index={0} />
        <StatCard title="New" value={stats.new} icon={UserPlus} index={1} />
        <StatCard title="In Progress" value={stats.progress} icon={TrendingUp} index={2} />
        <StatCard title="Converted" value={stats.converted} icon={CheckCircle2} trendType="up" index={3} />
        <StatCard title="Lost" value={stats.lost} icon={XCircle} trendType="down" index={4} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          {isLeadOwnerOnly && <TabsTrigger value="mine">My Leads</TabsTrigger>}
        </TabsList>

        <TabsContent value="pipeline">
          <PipelineBoard leads={visibleLeads} onCardClick={setSelected} onMove={moveLead} />
        </TabsContent>

        <TabsContent value="list">
          <LeadsTable leads={visibleLeads} onView={setSelected} canExport={!!user && !isLeadOwnerOnly} />
        </TabsContent>

        {isLeadOwnerOnly && (
          <TabsContent value="mine">
            <LeadsTable leads={visibleLeads} onView={setSelected} canExport={false} />
          </TabsContent>
        )}
      </Tabs>

      <NewInquiryDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={(data) => {
          const nextNum = leads.length + 1;
          const id = `INQ-${String(nextNum).padStart(3, "0")}`;
          const assignee = ASSIGNEE_POOL.find(a => a.id === data.assignedTo)!;
          const lead: Lead = {
            id, studentName: data.studentName, guardianName: data.guardianName,
            contact: data.contact, email: data.email || `${data.studentName.toLowerCase().replace(/\s/g, ".")}@gmail.com`,
            courseInterested: data.courseInterested, source: data.source as Lead["source"],
            status: "new", assignedTo: data.assignedTo, assignedToName: assignee.name,
            assignedRole: assignee.role,
            notes: data.remarks ? [{
              id: `n-${Date.now()}`, author: user?.name ?? "—",
              content: data.remarks, type: "note", createdAt: new Date().toISOString(),
            }] : [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          setLeads(prev => [lead, ...prev]);
          setNewOpen(false);
          toast.success(`New inquiry ${id} created successfully`);
        }}
      />

      <LeadDetailSheet
        lead={selected}
        onClose={() => setSelected(null)}
        onMove={moveLead}
        onAddNote={addNote}
        canReassign={canReassign}
        onReassign={(lead, newId) => {
          const a = ASSIGNEE_POOL.find(x => x.id === newId)!;
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, assignedTo: newId, assignedToName: a.name, assignedRole: a.role } : l));
          setSelected(s => s ? { ...s, assignedTo: newId, assignedToName: a.name, assignedRole: a.role } : s);
          toast.success(`Lead reassigned to ${a.name}`);
        }}
      />

      <ConfirmDialog
        open={confirm?.kind === "convert"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Convert to Student?"
        description="This will create a pre-filled admission entry for the student."
        confirmLabel="Convert"
        variant="info"
        onConfirm={() => confirm && performConvert(confirm.lead)}
      />
      <ConfirmDialog
        open={confirm?.kind === "lost"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Mark as Lost?"
        description="This lead will be archived as a lost opportunity."
        confirmLabel="Mark Lost"
        variant="danger"
        onConfirm={() => confirm && performLost(confirm.lead)}
      />
    </div>
  );
}

/* ---------------- Pipeline Board ---------------- */
function PipelineBoard({
  leads, onCardClick, onMove,
}: {
  leads: Lead[]; onCardClick: (l: Lead) => void; onMove: (l: Lead, to: LeadStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
      {STATUSES.map((s, i) => {
        const items = leads.filter(l => l.status === s);
        const m = LEAD_STATUS_META[s];
        return (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-muted/40 border border-border p-3 min-h-[300px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", m.bg.replace("100", "500"))} />
                <h3 className="font-heading font-semibold text-sm">{m.label}</h3>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{items.length}</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((lead) => (
                  <motion.div
                    layout
                    key={lead.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.18 }}
                    whileHover={{ y: -2, boxShadow: "0 8px 24px -8px rgba(0,33,71,0.18)" }}
                    onClick={() => onCardClick(lead)}
                    className="rounded-lg bg-card border border-border p-3 cursor-pointer shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{lead.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.courseInterested}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-muted">
                            <Move className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {STATUSES.filter(x => x !== lead.status).map(x => (
                            <DropdownMenuItem key={x} onClick={(e) => { e.stopPropagation(); onMove(lead, x); }}>
                              Move to {LEAD_STATUS_META[x].label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {lead.source}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(lead.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 truncate">→ {lead.assignedToName}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {items.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-6">No leads</div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------------- List Table ---------------- */
function LeadsTable({ leads, onView, canExport }: { leads: Lead[]; onView: (l: Lead) => void; canExport: boolean }) {
  const cols: DataTableColumn<Lead>[] = [
    { key: "id", header: "ID", className: "font-mono text-xs" },
    { key: "studentName", header: "Student" },
    { key: "courseInterested", header: "Course" },
    { key: "source", header: "Source", render: (r) => (
      <span className="text-xs uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">{r.source}</span>
    ) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "assignedToName", header: "Assigned To" },
    { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
    { key: "actions", header: "", render: (r) => (
      <Button variant="ghost" size="sm" onClick={() => onView(r)}>
        View <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    ) },
  ];
  return <div className="mt-3"><DataTable columns={cols} data={leads} exportable={canExport} /></div>;
}

/* ---------------- New Inquiry Dialog ---------------- */
function NewInquiryDialog({
  open, onClose, onCreate,
}: { open: boolean; onClose: () => void; onCreate: (d: LeadForm) => void }) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { courseInterested: "", source: "", assignedTo: "", remarks: "" },
  });
  useEffect(() => { if (!open) reset(); }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">New Inquiry</DialogTitle>
          <DialogDescription>Add a new pre-admission lead.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Student Name *</Label>
              <Input {...register("studentName")} className="mt-1" />
              {errors.studentName && <p className="text-xs text-destructive mt-1">{errors.studentName.message}</p>}
            </div>
            <div>
              <Label>Guardian Name *</Label>
              <Input {...register("guardianName")} className="mt-1" />
              {errors.guardianName && <p className="text-xs text-destructive mt-1">{errors.guardianName.message}</p>}
            </div>
            <div>
              <Label>Contact *</Label>
              <Input {...register("contact")} className="mt-1" />
              {errors.contact && <p className="text-xs text-destructive mt-1">{errors.contact.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register("email")} className="mt-1" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Course Interested *</Label>
              <Select value={watch("courseInterested")} onValueChange={(v) => setValue("courseInterested", v, { shouldValidate: true })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{COURSE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {errors.courseInterested && <p className="text-xs text-destructive mt-1">{errors.courseInterested.message}</p>}
            </div>
            <div>
              <Label>Source *</Label>
              <Select value={watch("source")} onValueChange={(v) => setValue("source", v, { shouldValidate: true })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              {errors.source && <p className="text-xs text-destructive mt-1">{errors.source.message}</p>}
            </div>
          </div>
          <div>
            <Label>Assign To *</Label>
            <Select value={watch("assignedTo")} onValueChange={(v) => setValue("assignedTo", v, { shouldValidate: true })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff" /></SelectTrigger>
              <SelectContent>
                {ASSIGNEE_POOL.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.role})</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.assignedTo && <p className="text-xs text-destructive mt-1">{errors.assignedTo.message}</p>}
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea {...register("remarks")} rows={3} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground">Create Inquiry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Lead Detail Sheet ---------------- */
function LeadDetailSheet({
  lead, onClose, onMove, onAddNote, canReassign, onReassign,
}: {
  lead: Lead | null;
  onClose: () => void;
  onMove: (l: Lead, s: LeadStatus) => void;
  onAddNote: (l: Lead, content: string, type: InteractionNote["type"]) => void;
  canReassign: boolean;
  onReassign: (l: Lead, newId: string) => void;
}) {
  const [note, setNote] = useState("");
  const [type, setType] = useState<InteractionNote["type"]>("note");
  useEffect(() => { setNote(""); setType("note"); }, [lead?.id]);
  if (!lead) return null;
  const idx = STATUSES.indexOf(lead.status);

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:max-w-[480px] w-full overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-xl">{lead.studentName}</SheetTitle>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono">{lead.id} · Created {formatDate(lead.createdAt)}</p>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Contact */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {lead.contact}</div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {lead.email}</div>
            <div className="flex items-center gap-2"><CalIcon className="w-4 h-4 text-muted-foreground" /> Guardian: {lead.guardianName}</div>
          </div>

          {/* Course */}
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Course Interested</p>
            <p className="font-medium">{lead.courseInterested}</p>
            <p className="text-xs text-muted-foreground mt-2">Source</p>
            <p className="font-medium uppercase">{lead.source}</p>
          </div>

          {/* Assigned */}
          <div>
            <Label className="text-xs">Assigned To</Label>
            {canReassign ? (
              <Select value={lead.assignedTo} onValueChange={(v) => onReassign(lead, v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSIGNEE_POOL.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.role})</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium mt-1">{lead.assignedToName}</p>
            )}
          </div>

          {/* Pipeline Stepper */}
          <div>
            <Label className="text-xs">Pipeline Status</Label>
            <div className="flex items-center gap-1 mt-2">
              {STATUSES.map((s, i) => {
                const active = i <= idx;
                return (
                  <button
                    key={s}
                    onClick={() => onMove(lead, s)}
                    className={cn(
                      "flex-1 h-8 rounded text-[11px] font-medium transition-all",
                      active ? `${LEAD_STATUS_META[s].bg} ${LEAD_STATUS_META[s].color}` : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {LEAD_STATUS_META[s].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Convert button */}
          {lead.status === "interested" && (
            <Button
              onClick={() => onMove(lead, "converted")}
              className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              Convert to Student
            </Button>
          )}

          {/* Interaction history */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-2">Interaction History</h4>
            <div className="space-y-2">
              {lead.notes.length === 0 && (
                <p className="text-xs text-muted-foreground">No interactions yet.</p>
              )}
              <AnimatePresence>
                {lead.notes.slice().reverse().map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-border bg-card p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                      {n.type === "call" && <Phone className="w-3 h-3" />}
                      {n.type === "visit" && <CalIcon className="w-3 h-3" />}
                      {n.type === "note" && <StickyNote className="w-3 h-3" />}
                      {n.type === "status_change" && <MessageSquare className="w-3 h-3" />}
                      <span className="font-medium text-foreground">{n.author}</span>
                      <span>· {formatDate(n.createdAt, "dd MMM, HH:mm")}</span>
                    </div>
                    <p>{n.content}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Add note */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs">Add Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add a quick note..." />
            <div className="flex gap-2">
              <Select value={type} onValueChange={(v) => setType(v as InteractionNote["type"])}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="visit">Visit</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => { onAddNote(lead, note, type); setNote(""); }}
                className="ml-auto bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
