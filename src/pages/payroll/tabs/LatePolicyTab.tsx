import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setLatePolicies, setLatePoliciesLoading,
  addLatePolicy, updateLatePolicyInList, removeLatePolicy
} from "@/redux/slices/payrollSlice";
import type { LatePolicy } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface LatePolicyTabProps {
  branches: { id: string; name: string }[];
}

export default function LatePolicyTab({ branches }: LatePolicyTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { latePolicies, latePoliciesLoading } = useSelector((s: RootState) => s.payroll);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<LatePolicy | null>(null);
  const [form, setForm] = useState<Partial<LatePolicy>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetch = () => {
    dispatch({
      type: payrollActions.GET_LATE_POLICY,
      method: "GET",
      endPoint: API.PAYROLL.LATE_POLICY,
      auth: true,
      setLoading: (v: boolean) => dispatch(setLatePoliciesLoading(v)),
      getResponse: (res: any) => dispatch(setLatePolicies(res?.data || [])),
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load policies"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const handleOpenSheet = (pol?: LatePolicy) => {
    if (pol) {
      setEditing(pol);
      setForm({ ...pol, branch_id: (pol as any).branch_id || (pol as any).branch });
    } else {
      setEditing(null);
      setForm({ branch_id: "", grace_period_minutes: 15, deduction_per_minute: 10, max_deduction_per_session: 500, auto_halfday_deduction: true, is_active: true } as any);
    }
    setSheetOpen(true);
  };

  const handleSave = () => {
    const branchId = (form as any).branch_id || (form as any).branch;
    if (!branchId) return toast.error("Select a branch");
    const isNew = !editing;
    dispatch({
      type: isNew ? payrollActions.CREATE_LATE_POLICY : payrollActions.UPDATE_LATE_POLICY,
      method: isNew ? "POST" : "PATCH",
      endPoint: isNew ? API.PAYROLL.LATE_POLICY : API.PAYROLL.LATE_POLICY_DETAIL(editing.id),
      body: { ...form, branch_id: branchId },
      auth: true,
      setLoading: setSaveLoading,
      getResponse: (res: any) => {
        const d = res?.data ?? res;
        if (d?.id) {
          if (isNew) dispatch(addLatePolicy(d));
          else dispatch(updateLatePolicyInList(d));
          toast.success(`Policy ${isNew ? "created" : "updated"}.`);
          setSheetOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: payrollActions.DELETE_LATE_POLICY,
      method: "DELETE",
      endPoint: API.PAYROLL.LATE_POLICY_DETAIL(deleteTarget),
      auth: true,
      getResponse: () => {
        dispatch(removeLatePolicy(deleteTarget));
        toast.success("Policy deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete.");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => handleOpenSheet()} className="h-9 bg-primary hover:bg-primary/90 gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Add Policy
        </Button>
      </div>

      {latePoliciesLoading ? <TableSkeleton columns={6} rows={4} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Branch", "Grace Period", "Deduction/Min", "Max Deduction", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {latePolicies.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No late policies configured.</td></tr>
              ) : latePolicies.map(pol => (
                <tr key={pol.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-xs">{pol.branch_name ?? pol.branch}</td>
                  <td className="px-4 py-3 text-xs">{pol.grace_period_minutes} min</td>
                  <td className="px-4 py-3 text-xs text-red-600 font-mono">₹{pol.deduction_per_minute}</td>
                  <td className="px-4 py-3 text-xs font-mono">₹{pol.max_deduction_per_session}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] ${pol.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {pol.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenSheet(pol)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteTarget(pol.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>{editing ? "Edit Late Policy" : "New Late Policy"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Branch <span className="text-red-500">*</span></Label>
              <Select value={(form as any).branch_id || (form as any).branch} onValueChange={v => setForm({ ...form, branch_id: v } as any)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Grace Period (mins)</Label>
                <Input type="number" min="0" value={form.grace_period_minutes} onChange={e => setForm({...form, grace_period_minutes: Number(e.target.value)})} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Deduction per min (₹)</Label>
                <Input type="number" min="0" value={form.deduction_per_minute} onChange={e => setForm({...form, deduction_per_minute: Number(e.target.value)})} className="h-9" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max Deduction per session (₹)</Label>
              <Input type="number" min="0" value={form.max_deduction_per_session} onChange={e => setForm({...form, max_deduction_per_session: Number(e.target.value)})} className="h-9" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="autoHalfday" checked={form.auto_halfday_deduction} onCheckedChange={(c: boolean) => setForm({...form, auto_halfday_deduction: c})} />
              <Label htmlFor="autoHalfday" className="text-sm font-normal">Auto Half-Day Deduction if very late</Label>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="isActive" checked={form.is_active} onCheckedChange={(c: boolean) => setForm({...form, is_active: c})} />
              <Label htmlFor="isActive" className="text-sm font-normal">Active</Label>
            </div>
          </div>
          <SheetFooter className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setSheetOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saveLoading} className="flex-1 bg-primary text-primary-foreground">
              {saveLoading ? "Saving…" : "Save Policy"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete Policy?"
        description="Are you sure? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
