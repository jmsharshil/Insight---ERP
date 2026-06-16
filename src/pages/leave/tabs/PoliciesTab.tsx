import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { leaveActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setPolicies, setPoliciesLoading, addPolicy, updatePolicyInList, removePolicy } from "@/redux/slices/leaveSlice";
import type { LeavePolicy } from "@/redux/slices/leaveSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { dropdownActions } from "@/redux/actions";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const LEAVE_TYPE_OPTS = ["paid", "sick", "casual", "club", "unpaid"];

const blankForm = () => ({
  leave_type: "casual",
  annual_quota: "",
  max_club_days: "",
  min_advance_days: "",
  max_carry_days: "",
  allow_half_day: true,
  sandwich_rule: false,
  carry_forward: false,
});


function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
      <p className="text-xs font-medium text-right">{value}</p>
    </div>
  );
}

function PolicyDetail({ item }: { item: LeavePolicy }) {
  const BoolBadge = ({ v }: { v: boolean }) => (
    <Badge className={v ? "bg-green-100 text-green-700 text-xs" : "bg-gray-100 text-gray-500 text-xs"}>
      {v ? "Yes" : "No"}
    </Badge>
  );
  return (
    <div className="space-y-3 mt-4 text-sm">
      <DetailRow label="Leave Type"      value={item.leave_type_display} />
      <DetailRow label="Annual Quota"    value={`${item.annual_quota} days`} />
      <DetailRow label="Max Club Days"   value={`${item.max_club_days} days`} />
      <DetailRow label="Min Advance"     value={`${item.min_advance_days} days`} />
      <DetailRow label="Carry Forward"   value={<BoolBadge v={item.carry_forward} />} />
      <DetailRow label="Max Carry Days"  value={`${item.max_carry_days} days`} />
      <DetailRow label="Allow Half Day"  value={<BoolBadge v={item.allow_half_day} />} />
      <DetailRow label="Sandwich Rule"   value={<BoolBadge v={item.sandwich_rule} />} />
      <DetailRow label="Active"          value={<BoolBadge v={item.is_active} />} />
    </div>
  );
}

export default function PoliciesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast    = useToast();
  const { policies, policiesLoading } = useSelector((s: RootState) => s.leave);

  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<LeavePolicy | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeavePolicy | null>(null);
  const [form, setForm]               = useState(blankForm());

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [branches, setBranches] = useState<{ id: string; name: string; city: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerItem, setDrawerItem]       = useState<LeavePolicy | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

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
  }, [isSuperAdmin, dispatch]);

  const handleRowClick = (policy: LeavePolicy) => {
    setDrawerOpen(true);
    setDrawerItem(null);
    setDrawerLoading(true);
    dispatch({
      type: leaveActions.GET_POLICY_DETAIL,
      method: "GET",
      endPoint: API.LEAVE.POLICY_DETAIL(policy.id),
      auth: true,
      getResponse: (res: any) => { setDrawerItem(res?.data ?? null); setDrawerLoading(false); },
      getError: (err: any) => { toast.error(err?.response?.data?.message || "Failed to load details"); setDrawerLoading(false); },
    });
  };


  useEffect(() => {
    dispatch({
      type: leaveActions.GET_LEAVE_POLICIES,
      method: "GET",
      endPoint: API.LEAVE.POLICIES,
      auth: true,
      setLoading: (v: boolean) => dispatch(setPoliciesLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        dispatch(setPolicies(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load policies"),
    });
  }, []);

  const handleCreate = () => {
    dispatch({
      type: leaveActions.CREATE_LEAVE_POLICY,
      method: "POST",
      endPoint: API.LEAVE.POLICIES,
      body: {
        ...form,
        annual_quota:    Number(form.annual_quota),
        max_club_days:   Number(form.max_club_days),
        min_advance_days: Number(form.min_advance_days),
        max_carry_days:  Number(form.max_carry_days),
        ...(isSuperAdmin && selectedBranch ? { branch_id: selectedBranch } : {}),
      },
      auth: true,
      setLoading: (v: boolean) => setCreateLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addPolicy(res.data));
          toast.success("Policy created.");
          setCreateOpen(false);
          setForm(blankForm());
        } else toast.error("Failed to create policy.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create policy"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: leaveActions.UPDATE_LEAVE_POLICY,
      method: "PATCH",
      endPoint: API.LEAVE.POLICY_DETAIL(editTarget.id),
      body: {
        annual_quota:    editTarget.annual_quota,
        max_club_days:   editTarget.max_club_days,
        min_advance_days: editTarget.min_advance_days,
        max_carry_days:  editTarget.max_carry_days,
        allow_half_day:  editTarget.allow_half_day,
        sandwich_rule:   editTarget.sandwich_rule,
        carry_forward:   editTarget.carry_forward,
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updatePolicyInList(res.data)); toast.success("Policy updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update policy"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: leaveActions.DELETE_LEAVE_POLICY,
      method: "DELETE",
      endPoint: API.LEAVE.POLICY_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removePolicy(deleteTarget.id)); toast.success("Policy deactivated."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to deactivate policy"),
    });
  };

  const BoolIcon = ({ v }: { v: boolean }) => v
    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
    : <XCircle className="w-4 h-4 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      
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

      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{policies.length} policy(ies)</p>
        <Button onClick={() => { setForm(blankForm()); setCreateOpen(true); }}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add Policy
        </Button>
      </div>

      {policiesLoading ? <TableSkeleton /> : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Leave Type", "Quota/yr", "Max Club", "Advance Days", "Carry Fwd", "Max Carry", "Half Day", "Sandwich", "Active", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">No policies configured.</td></tr>
              ) : policies.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => handleRowClick(p)}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium capitalize">{p.leave_type_display}</td>
                  <td className="px-4 py-3">{p.annual_quota}</td>
                  <td className="px-4 py-3">{p.max_club_days}</td>
                  <td className="px-4 py-3">{p.min_advance_days}d</td>
                  <td className="px-4 py-3"><BoolIcon v={p.carry_forward} /></td>
                  <td className="px-4 py-3">{p.max_carry_days}d</td>
                  <td className="px-4 py-3"><BoolIcon v={p.allow_half_day} /></td>
                  <td className="px-4 py-3"><BoolIcon v={p.sandwich_rule} /></td>
                  <td className="px-4 py-3"><BoolIcon v={p.is_active} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(p); setEditOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={o => setCreateOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Leave Policy</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs mb-1 block">Leave Type *</Label>
              <Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPE_OPTS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Annual Quota (days)", key: "annual_quota" },
                { label: "Max Club Days",       key: "max_club_days" },
                { label: "Min Advance Days",    key: "min_advance_days" },
                { label: "Max Carry Days",      key: "max_carry_days" },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-xs mb-1 block">{f.label}</Label>
                  <Input type="number" value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="h-9 text-sm" />
                </div>
              ))}
            </div>
            {[
              { label: "Allow Half Day", key: "allow_half_day" },
              { label: "Sandwich Rule",  key: "sandwich_rule" },
              { label: "Carry Forward",  key: "carry_forward" },
            ].map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <input type="checkbox" id={f.key} checked={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.checked }))}
                  className="w-4 h-4 accent-primary" />
                <Label htmlFor={f.key} className="text-sm cursor-pointer">{f.label}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLoading || !form.annual_quota || (isSuperAdmin && !selectedBranch)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createLoading ? "Creating…" : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Leave Policy — {editTarget?.leave_type_display}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Annual Quota",    key: "annual_quota" },
                  { label: "Max Club Days",   key: "max_club_days" },
                  { label: "Min Advance Days", key: "min_advance_days" },
                  { label: "Max Carry Days",  key: "max_carry_days" },
                ].map(f => (
                  <div key={f.key}>
                    <Label className="text-xs mb-1 block">{f.label}</Label>
                    <Input type="number" value={(editTarget as any)[f.key]}
                      onChange={e => setEditTarget(p => p ? { ...p, [f.key]: Number(e.target.value) } : null)}
                      className="h-9 text-sm" />
                  </div>
                ))}
              </div>
              {[
                { label: "Allow Half Day", key: "allow_half_day" },
                { label: "Sandwich Rule",  key: "sandwich_rule" },
                { label: "Carry Forward",  key: "carry_forward" },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <input type="checkbox" id={`edit_${f.key}`} checked={(editTarget as any)[f.key]}
                    onChange={e => setEditTarget(p => p ? { ...p, [f.key]: e.target.checked } : null)}
                    className="w-4 h-4 accent-primary" />
                  <Label htmlFor={`edit_${f.key}`} className="text-sm cursor-pointer">{f.label}</Label>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Policy Details</SheetTitle></SheetHeader>
          {drawerLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-muted-foreground animate-pulse">Loading…</span>
            </div>
          ) : drawerItem ? <PolicyDetail item={drawerItem} /> : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Deactivate "${deleteTarget?.leave_type_display}" policy?`}
        description="The policy will be deactivated. Existing applications are not affected."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
