import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, XCircle, Clock, FileText, Trash2, Pencil, Search } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setApplications, setApplicationsLoading,
  addApplication, updateApplicationInList, removeApplication,
} from "@/redux/slices/leaveSlice";
import type { LeaveApplication } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const STATUS_BADGE: Record<string, string> = {
  approval_pending: "bg-yellow-100 text-yellow-700",
  approved:         "bg-green-100 text-green-700",
  rejected:         "bg-red-100 text-red-700",
  cancelled:        "bg-gray-100 text-gray-500",
};

const LEAVE_TYPE_OPTS = [
  { value: "paid",   label: "Paid Leave" },
  { value: "sick",   label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "club",   label: "Club Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

const ADMIN_ROLES   = ["super_admin", "branch_manager", "admin_senior_executive"];
const APPLY_ROLES   = ["faculty", "front_desk", "counsellor", "student", "parents"];
const APPROVE_ROLES = ["super_admin", "branch_manager", "admin_senior_executive"];

// Shared detail helpers
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right">{value}</p>
    </div>
  );
}

function LeaveApplicationDetail({ item }: { item: LeaveApplication }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <DetailRow label="Applicant"   value={item.applied_by_name} />
        <DetailRow label="Leave Type"  value={item.leave_type_display} />
        <DetailRow label="From"        value={item.from_date} />
        <DetailRow label="To"          value={item.to_date} />
        <DetailRow label="Total Days"  value={item.total_days} />
        <DetailRow label="Half Day"    value={item.is_half_day ? `Yes (${item.half_day_session})` : "No"} />
        <DetailRow label="Auto Generated" value={item.is_auto_generated ? "Yes" : "No"} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Status</p>
        <Badge className={`${STATUS_BADGE[item.status] ?? ""} text-xs capitalize`}>{item.status_display}</Badge>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Reason</p>
        <p className="text-sm bg-muted/30 rounded p-2">{item.reason}</p>
      </div>
      {item.rejection_reason && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
          <p className="text-sm bg-red-50 text-red-700 rounded p-2">{item.rejection_reason}</p>
        </div>
      )}
      <div className="border border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Approval Trail</p>
        <div className="flex items-center gap-2 text-sm">
          {item.is_first_approval_done
            ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            : <Clock className="w-4 h-4 text-yellow-500 shrink-0" />}
          <span>Step 1 — {item.first_approver_name || "Pending"}</span>
          {item.first_approved_at && (
            <span className="text-xs text-muted-foreground ml-auto">{new Date(item.first_approved_at).toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {item.status === "approved"
            ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            : <Clock className="w-4 h-4 text-yellow-500 shrink-0" />}
          <span>Step 2 — {item.second_approver_name || "Pending"}</span>
          {item.second_approved_at && (
            <span className="text-xs text-muted-foreground ml-auto">{new Date(item.second_approved_at).toLocaleString()}</span>
          )}
        </div>
      </div>
      {item.supporting_document_url && (
        <a href={item.supporting_document_url} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-sm text-primary underline">
          <FileText className="w-4 h-4" /> View Supporting Document
        </a>
      )}
      <p className="text-xs text-muted-foreground">Submitted: {new Date(item.created_at).toLocaleString()}</p>
    </div>
  );
}

export default function ApplicationsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { user } = useAuth();
  const { applications, applicationsCount, applicationsLoading } = useSelector((s: RootState) => s.leave);

  const role         = user?.role ?? "";
  const isSuperAdmin = role === "super_admin";
  const isAdmin      = ADMIN_ROLES.includes(role);
  const canApply     = APPLY_ROLES.includes(role);
  const canApprove   = APPROVE_ROLES.includes(role);

  // ── Dropdown data ────────────────────────────────────────────────────────
  const [branches, setBranches] = useState<{ id: string; name: string; city: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    if (isSuperAdmin) {
      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "GET",
        endPoint: "/api/v1/batches/dropdowns/",
        auth: true,
        getResponse: (res: any) => {
          const data = res?.data || res;
          if (data?.branches) setBranches(data.branches);
        },
        getError: () => {},
      });
    }
  }, [isSuperAdmin]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");

  // ── Drawer ───────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerItem, setDrawerItem]       = useState<LeaveApplication | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const handleRowClick = (app: LeaveApplication) => {
    setDrawerOpen(true);
    setDrawerItem(null);
    setDrawerLoading(true);
    dispatch({
      type: leaveActions.GET_LEAVE_DETAIL,
      method: "GET",
      endPoint: API.LEAVE.DETAIL(app.id),
      auth: true,
      getResponse: (res: any) => { setDrawerItem(res?.data ?? null); setDrawerLoading(false); },
      getError: (err: any) => { toast.error(err?.response?.data?.message || "Failed to load details"); setDrawerLoading(false); },
    });
  };

  // ── Apply form ────────────────────────────────────────────────────────────
  const [applyOpen, setApplyOpen]       = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyForm, setApplyForm]       = useState({
    leave_type: "casual", from_date: "", to_date: "",
    is_half_day: false, half_day_session: "morning",
    reason: "", supporting_document: null as File | null,
  });

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<LeaveApplication | null>(null);
  const [editLoading, setEditLoading]   = useState(false);

  // ── Reject dialog ─────────────────────────────────────────────────────────
  const [rejectTarget, setRejectTarget]   = useState<LeaveApplication | null>(null);
  const [rejectReason, setRejectReason]   = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── Confirm dialogs ───────────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget]     = useState<LeaveApplication | null>(null);
  const [approveTarget, setApproveTarget]   = useState<LeaveApplication | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchApplications = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (typeFilter)   params.append("leave_type", typeFilter);
    if (search)       params.append("search", search);
    const endPoint = `${API.LEAVE.LIST}${params.toString() ? "?" + params.toString() : ""}`;
    dispatch({
      type: leaveActions.GET_LEAVES,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setApplicationsLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
        const count = res?.count ?? data.length;
        dispatch(setApplications({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load applications"),
    });
  };

  useEffect(() => { fetchApplications(); }, [statusFilter, typeFilter]);

  // ── Submit leave — FIXED branch_id ───────────────────────────────────────
  const handleApply = () => {
    const formData = new FormData();
    if (role !== "student" && role !== "parents") {
      formData.append("leave_type", applyForm.leave_type);
    }
    formData.append("from_date", applyForm.from_date);
    formData.append("to_date", applyForm.to_date);
    formData.append("is_half_day", String(applyForm.is_half_day));
    if (applyForm.is_half_day) formData.append("half_day_session", applyForm.half_day_session);
    formData.append("reason", applyForm.reason);
    if (applyForm.supporting_document) formData.append("supporting_document", applyForm.supporting_document);
    // ONLY send branch_id for super_admin
    if (isSuperAdmin && selectedBranch) formData.append("branch_id", selectedBranch);

    dispatch({
      type: leaveActions.SUBMIT_LEAVE,
      method: "POST",
      endPoint: API.LEAVE.LIST,
      body: formData,
      auth: true,
      setLoading: (v: boolean) => setApplyLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addApplication(res.data));
          toast.success("Leave application submitted.");
          setApplyOpen(false);
          setApplyForm({ leave_type: "casual", from_date: "", to_date: "", is_half_day: false, half_day_session: "morning", reason: "", supporting_document: null });
        } else toast.error("Failed to submit application.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to submit leave application"),
    });
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_LEAVE,
      method: "PATCH",
      endPoint: API.LEAVE.DETAIL(editTarget.id),
      body: { from_date: editTarget.from_date, to_date: editTarget.to_date, reason: editTarget.reason },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateApplicationInList(res.data)); toast.success("Application updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update application"),
    });
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    if (!cancelTarget) return;
    dispatch({
      type: leaveActions.CANCEL_LEAVE,
      method: "DELETE",
      endPoint: API.LEAVE.DETAIL(cancelTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeApplication(cancelTarget.id)); toast.success("Leave cancelled."); setCancelTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to cancel leave"),
    });
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = () => {
    if (!approveTarget) return;
    dispatch({
      type: leaveActions.APPROVE_LEAVE,
      method: "POST",
      endPoint: API.LEAVE.APPROVE(approveTarget.id),
      auth: true,
      setLoading: (v: boolean) => setApproveLoading(v),
      getResponse: (res: any) => { toast.success(res?.message || "Leave approved."); setApproveTarget(null); fetchApplications(); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Approval failed"),
    });
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = () => {
    if (!rejectTarget) return;
    dispatch({
      type: leaveActions.REJECT_LEAVE,
      method: "POST",
      endPoint: API.LEAVE.REJECT(rejectTarget.id),
      body: { reason: rejectReason },
      auth: true,
      setLoading: (v: boolean) => setRejectLoading(v),
      getResponse: (res: any) => { toast.success(res?.message || "Leave rejected."); setRejectTarget(null); setRejectReason(""); fetchApplications(); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Rejection failed"),
    });
  };

  const filtered = applications.filter(a => {
    if (!search) return true;
    return a.applied_by_name?.toLowerCase().includes(search.toLowerCase()) ||
           a.reason?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Super admin branch selector */}
      {isSuperAdmin && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Label className="text-xs whitespace-nowrap font-medium">Branch *</Label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-9 text-sm w-56">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name} — {b.city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-blue-600">Required for super admin context</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search applicant / reason..." className="pl-8 h-9 text-sm w-56"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approval_pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {role !== "student" && role !== "parents" && (
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {LEAVE_TYPE_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" className="h-9 text-sm"
            onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); fetchApplications(); }}>
            Clear
          </Button>
        </div>
        {canApply && (
          <Button onClick={() => setApplyOpen(true)}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
            <Plus className="w-4 h-4" /> Apply for Leave
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{applicationsCount} application(s) total · {filtered.length} shown</p>

      {/* Table */}
      {applicationsLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Applicant", "Type", "From", "To", "Days", "Status", "1st Approval", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No applications found.</td></tr>
              ) : filtered.map((app, i) => (
                <motion.tr
                  key={app.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  onClick={() => handleRowClick(app)}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-sm">{app.applied_by_name}</td>
                  <td className="px-4 py-3 capitalize">{app.leave_type_display}</td>
                  <td className="px-4 py-3">{app.from_date}</td>
                  <td className="px-4 py-3">{app.to_date}</td>
                  <td className="px-4 py-3">{app.total_days}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_BADGE[app.status] ?? ""} text-xs capitalize`}>{app.status_display}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {app.is_first_approval_done
                      ? <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done</span>
                      : <span className="text-yellow-600 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
                  </td>
                  {/* STOP propagation so row click doesn't fire from button clicks */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {canApprove && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600 hover:text-green-700"
                          onClick={() => setApproveTarget(app)} title="Approve">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {canApprove && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:text-red-600"
                          onClick={() => setRejectTarget(app)} title="Reject">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {!isAdmin && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7"
                          onClick={() => { setEditTarget(app); setEditOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {!isAdmin && app.status === "approval_pending" && (
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500"
                          onClick={() => setCancelTarget(app)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {app.supporting_document_url && (
                        <a href={app.supporting_document_url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="w-7 h-7" title="View Document">
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Leave Application Details</SheetTitle>
          </SheetHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-muted-foreground text-sm animate-pulse">Loading…</span>
            </div>
          ) : drawerItem ? (
            <LeaveApplicationDetail item={drawerItem} />
          ) : (
            <p className="text-sm text-muted-foreground mt-4">No data found.</p>
          )}
        </SheetContent>
      </Sheet>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {role !== "student" && role !== "parents" && (
              <div>
                <Label className="text-xs mb-1 block">Leave Type *</Label>
                <Select value={applyForm.leave_type} onValueChange={v => setApplyForm(f => ({ ...f, leave_type: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAVE_TYPE_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">From Date *</Label>
                <Input type="date" value={applyForm.from_date} onChange={e => setApplyForm(f => ({ ...f, from_date: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">To Date *</Label>
                <Input type="date" value={applyForm.to_date} onChange={e => setApplyForm(f => ({ ...f, to_date: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="half_day" checked={applyForm.is_half_day}
                onChange={e => setApplyForm(f => ({ ...f, is_half_day: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              <Label htmlFor="half_day" className="text-sm cursor-pointer">Half Day Leave</Label>
            </div>
            {applyForm.is_half_day && (
              <div>
                <Label className="text-xs mb-1 block">Session *</Label>
                <Select value={applyForm.half_day_session} onValueChange={v => setApplyForm(f => ({ ...f, half_day_session: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Reason *</Label>
              <Textarea value={applyForm.reason} onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                rows={3} placeholder="Describe the reason for your leave..." className="text-sm resize-none" />
            </div>
            {(applyForm.leave_type === "sick" || role === "student" || role === "parents") && (
              <div>
                <Label className="text-xs mb-1 block">Supporting Document (required if &gt; 2 days)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setApplyForm(f => ({ ...f, supporting_document: e.target.files?.[0] ?? null }))}
                  className="h-9 text-sm" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)} disabled={applyLoading}>Cancel</Button>
            <Button onClick={handleApply}
              disabled={applyLoading || !applyForm.from_date || !applyForm.to_date || !applyForm.reason.trim() || (isSuperAdmin && !selectedBranch)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {applyLoading ? "Submitting…" : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Leave Application</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">From Date</Label>
                  <Input type="date" value={editTarget.from_date}
                    onChange={e => setEditTarget(p => p ? { ...p, from_date: e.target.value } : null)} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">To Date</Label>
                  <Input type="date" value={editTarget.to_date}
                    onChange={e => setEditTarget(p => p ? { ...p, to_date: e.target.value } : null)} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Reason</Label>
                <Textarea value={editTarget.reason}
                  onChange={e => setEditTarget(p => p ? { ...p, reason: e.target.value } : null)}
                  rows={3} className="text-sm resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={o => { if (!o) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Leave Application</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1 block">Rejection Reason *</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="Explain the reason for rejection..." className="text-sm resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }} disabled={rejectLoading}>Cancel</Button>
            <Button onClick={handleReject} disabled={rejectLoading || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white">
              {rejectLoading ? "Rejecting…" : "Reject Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={o => !o && setApproveTarget(null)}
        title={`Approve leave for ${approveTarget?.applied_by_name}?`}
        description={`Step ${role === "admin_senior_executive" ? "1 of 2" : "2 — Final"}. ${role !== "admin_senior_executive" ? "Leave balance will be deducted automatically." : "Branch Manager will complete final approval."}`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={o => !o && setCancelTarget(null)}
        title="Cancel this leave application?"
        description="This will withdraw your application. This action cannot be undone."
        confirmLabel="Cancel Leave"
        variant="danger"
        onConfirm={handleCancel}
      />
    </div>
  );
}