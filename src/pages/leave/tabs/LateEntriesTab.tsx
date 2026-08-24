import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, AlertCircle } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setLateEntries, setLateEntriesLoading, addLateEntry, updateLateEntryInList, removeLateEntry } from "@/redux/slices/leaveSlice";
import type { LateEntry } from "@/redux/slices/leaveSlice";
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
import { dropdownActions } from "@/redux/actions";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const PENALTY_OPTS = [
  { value: "half_day_deduction", label: "Half Day Deduction" },
  { value: "salary_deduction",   label: "Salary Deduction" },
  { value: "warning",            label: "Warning" },
];

const PENALTY_BADGE: Record<string, string> = {
  half_day_deduction: "bg-orange-100 text-orange-700",
  salary_deduction:   "bg-red-100 text-red-700",
  warning:            "bg-yellow-100 text-yellow-700",
};

const ADMIN_MANAGE_ROLES = ["super_admin", "branch_manager", "admin_senior_executive"];


function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right">{value}</p>
    </div>
  );
}

function LateEntryDetail({ item }: { item: LateEntry }) {
  const PENALTY_BADGE: Record<string, string> = {
    half_day_deduction: "bg-orange-100 text-orange-700",
    salary_deduction:   "bg-red-100 text-red-700",
    warning:            "bg-yellow-100 text-yellow-700",
  };
  return (
    <div className="space-y-3 mt-4 text-sm">
      <DetailRow label="Staff"           value={item.user_name} />
      <DetailRow label="Date"            value={item.date} />
      <DetailRow label="Expected Time"   value={item.expected_time} />
      <DetailRow label="Actual Time"     value={item.actual_time} />
      <DetailRow label="Late Minutes"    value={`${item.late_minutes} min`} />
      <DetailRow label="Grace Minutes"   value={`${item.grace_minutes} min`} />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Penalty</p>
        {item.penalty_type
          ? <Badge className={`${PENALTY_BADGE[item.penalty_type] ?? ""} text-xs`}>{item.penalty_type_display}</Badge>
          : <span className="text-muted-foreground text-xs">None</span>}
      </div>
      <DetailRow label="Auto Deducted"   value={item.auto_deduction_triggered ? "Yes ⚠" : "No"} />
      {item.notes && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm bg-muted/30 rounded p-2">{item.notes}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Recorded: {new Date(item.created_at).toLocaleString()}</p>
    </div>
  );
}

export default function LateEntriesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { user } = useAuth();
  const { lateEntries, lateEntriesCount, lateEntriesLoading } = useSelector((s: RootState) => s.leave);

  const canManage = ADMIN_MANAGE_ROLES.includes(user?.role ?? "");

  const [search, setSearch]           = useState("");
  const [penaltyFilter, setPenaltyFilter] = useState("");
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");

  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<LateEntry | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LateEntry | null>(null);

  const isSuperAdmin = user?.role === "super_admin";
  const [branches,  setBranches]  = useState<{ id: string; name: string; city: string }[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role?: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerItem, setDrawerItem]       = useState<LateEntry | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
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

    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: API.USERS.LIST,
      auth: true,
      getResponse: (res: any) => {
        const raw = res?.data?.results || res?.results || res?.data || res || [];
        const users = Array.isArray(raw) ? raw : [];
        const filtered = users.filter((u: any) => 
          !["super_admin", "student", "parent", "parents"].includes(u.role)
        );
        setStaffList(filtered.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || u.email,
          role: u.role
        })));
      },
      getError: () => {},
    });
  }, [dispatch]);

  const handleRowClick = (entry: LateEntry) => {
    setDrawerOpen(true);
    setDrawerItem(null);
    setDrawerLoading(true);
    dispatch({
      type: leaveActions.GET_LATE_ENTRY_DETAIL,
      method: "GET",
      endPoint: API.LEAVE.LATE_ENTRY_DETAIL(entry.id),
      auth: true,
      getResponse: (res: any) => { setDrawerItem(res?.data ?? null); setDrawerLoading(false); },
      getError: (err: any) => { toast.error(err?.response?.data?.message || "Failed to load details"); setDrawerLoading(false); },
    });
  };

  const [form, setForm] = useState({
    user_id: "", date: "", expected_time: "09:00:00",
    actual_time: "", penalty_type: "warning", notes: "",
  });

  const fetchLateEntries = () => {
    const params = new URLSearchParams();
    if (search)        params.append("search", search);
    if (penaltyFilter) params.append("penalty_type", penaltyFilter);
    if (fromDate)      params.append("from_date", fromDate);
    if (toDate)        params.append("to_date", toDate);
    const endPoint = `${API.LEAVE.LATE_ENTRIES}${params.toString() ? "?" + params.toString() : ""}`;

    dispatch({
      type: leaveActions.GET_LATE_ENTRIES,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setLateEntriesLoading(v)),
      getResponse: (res: any) => {
        const data  = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
        const count = res?.count ?? data.length;
        dispatch(setLateEntries({ data, count }));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load late entries"),
    });
  };

  useEffect(() => { fetchLateEntries(); }, [penaltyFilter]);

  const handleCreate = () => {
    dispatch({
      type: leaveActions.CREATE_LATE_ENTRY,
      method: "POST",
      endPoint: API.LEAVE.LATE_ENTRIES,
      body: {
        ...form,
        ...(isSuperAdmin && selectedBranch ? { branch_id: selectedBranch } : {}),
      },
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addLateEntry(res.data));
          toast.success("Late entry recorded.");
          if (res.data.auto_deduction_triggered) {
            toast.warning("Auto deduction triggered — a half-day leave was applied.");
          }
          setCreateOpen(false);
          setForm({ user_id: "", date: "", expected_time: "09:00:00", actual_time: "", penalty_type: "warning", notes: "" });
        } else toast.error("Failed to record late entry.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create late entry"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_LATE_ENTRY,
      method: "PATCH",
      endPoint: API.LEAVE.LATE_ENTRY_DETAIL(editTarget.id),
      body: { is_penalized: editTarget.is_penalized, penalty_type: editTarget.penalty_type, notes: editTarget.notes },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateLateEntryInList(res.data)); toast.success("Late entry updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update late entry"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: leaveActions.DELETE_LATE_ENTRY,
      method: "DELETE",
      endPoint: API.LEAVE.LATE_ENTRY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeLateEntry(deleteTarget.id)); toast.success("Late entry deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete late entry"),
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      
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

      <div className="flex flex-wrap items-end gap-2 justify-between">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-medium">Search</Label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search staff / notes..." className="pl-8 h-9 text-sm w-52"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-medium">Penalty Type</Label>
            <Select value={penaltyFilter} onValueChange={v => setPenaltyFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Penalties" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Penalties</SelectItem>
                {PENALTY_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-medium">From Date</Label>
            <Input type="date" className="h-9 text-sm w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground font-medium">To Date</Label>
            <Input type="date" className="h-9 text-sm w-36" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <Button variant="outline" className="h-9 text-sm"
            onClick={() => { setSearch(""); setPenaltyFilter(""); setFromDate(""); setToDate(""); fetchLateEntries(); }}>
            Clear
          </Button>
          <Button variant="outline" className="h-9 text-sm" onClick={fetchLateEntries}>Search</Button>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
            <Plus className="w-4 h-4" /> Record Late Entry
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{lateEntriesCount} record(s)</p>

      {lateEntriesLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Staff", "Date", "Expected", "Actual", "Late (min)", "Penalty", "Auto Deducted", "Notes", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lateEntries.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">No late entry records found.</td></tr>
              ) : lateEntries.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => handleRowClick(e)}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{e.user_name}</p>
                  </td>
                  <td className="px-4 py-3">{e.date}</td>
                  <td className="px-4 py-3">{e.expected_time}</td>
                  <td className="px-4 py-3">{e.actual_time}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${e.late_minutes > 30 ? "text-red-600" : "text-yellow-600"}`}>
                      {e.late_minutes}m
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.penalty_type
                      ? <Badge className={`${PENALTY_BADGE[e.penalty_type] ?? ""} text-xs`}>{e.penalty_type_display}</Badge>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.auto_deduction_triggered
                      ? <span className="text-orange-600 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Yes</span>
                      : <span className="text-muted-foreground text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-muted-foreground truncate">{e.notes || "—"}</p>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(e); setEditOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(e)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={o => setCreateOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Late Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
{staffList.length > 0 ? (
              <div>
                <Label className="text-xs mb-1 block">Staff Member *</Label>
                <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {staffList.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <span>{s.name}</span>
                          {s.role && (
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded capitalize whitespace-nowrap">
                              {s.role.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="text-xs mb-1 block">Staff User UUID *</Label>
                <Input value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  placeholder="user-uuid" className="h-9 text-sm font-mono" />
              </div>
            )}
            <div>
              <Label className="text-xs mb-1 block">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Expected Time *</Label>
                <Input type="time" value={form.expected_time} onChange={e => setForm(f => ({ ...f, expected_time: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Actual Time *</Label>
                <Input type="time" value={form.actual_time} onChange={e => setForm(f => ({ ...f, actual_time: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Penalty Type *</Label>
              <Select value={form.penalty_type} onValueChange={v => setForm(f => ({ ...f, penalty_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{PENALTY_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Optional context..." className="text-sm resize-none" />
            </div>
            <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 rounded p-2">
              ⚠ If this staff member has exceeded the monthly late threshold, a half-day deduction may be auto-triggered.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate}
              disabled={createLoading || !form.user_id.trim() || !form.date || !form.actual_time || (isSuperAdmin && !selectedBranch)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Recording…" : "Record Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Late Entry — {editTarget?.user_name}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="edit_penalized" checked={editTarget.is_penalized}
                  onChange={e => setEditTarget(p => p ? { ...p, is_penalized: e.target.checked } : null)}
                  className="w-4 h-4 accent-primary" />
                <Label htmlFor="edit_penalized" className="text-sm cursor-pointer">Is Penalized</Label>
              </div>
              {editTarget.is_penalized && (
                <div>
                  <Label className="text-xs mb-1 block">Penalty Type</Label>
                  <Select value={editTarget.penalty_type} onValueChange={v => setEditTarget(p => p ? { ...p, penalty_type: v } : null)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{PENALTY_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs mb-1 block">Notes</Label>
                <Textarea value={editTarget.notes} onChange={e => setEditTarget(p => p ? { ...p, notes: e.target.value } : null)}
                  rows={2} className="text-sm resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Late Entry Details</SheetTitle></SheetHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
            </div>
          ) : drawerItem ? <LateEntryDetail item={drawerItem} /> : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete this late entry record?"
        description="This action cannot be undone. Any auto-deduction already triggered will not be reversed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
