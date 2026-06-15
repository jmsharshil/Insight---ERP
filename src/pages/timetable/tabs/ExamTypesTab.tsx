import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { timetableActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setExamTypes, setExamTypesLoading, addExamType, updateExamTypeInList, removeExamType } from "@/redux/slices/timetableNewSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function ExamTypesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { examTypes, examTypesLoading } = useSelector((s: RootState) => s.timetableNew);

  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", is_active: true });

  const canEdit = user && ["super_admin", "branch_manager", "admin_senior_exec", "admin"].includes(user.role ?? "");

  useEffect(() => {
    dispatch({
      type: timetableActions.GET_EXAM_TYPES,
      method: "GET",
      endPoint: API.TIMETABLE.EXAM_TYPES,
      auth: true,
      setLoading: (v: boolean) => dispatch(setExamTypesLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setExamTypes(Array.isArray(res.data) ? res.data : []));
        else toast.error("Failed to load exam types.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "", is_active: true }); setFormOpen(true); };
  const openEdit = (et: any) => { setEditing(et); setForm({ name: et.name, description: et.description, is_active: et.is_active }); setFormOpen(true); };

  const handleSave = () => {
    const isEdit = !!editing;
    dispatch({
      type: isEdit ? timetableActions.UPDATE_EXAM_TYPE : timetableActions.CREATE_EXAM_TYPE,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.TIMETABLE.EXAM_TYPE_DETAIL(editing.id) : API.TIMETABLE.EXAM_TYPES,
      body: form,
      auth: true,
      setLoading: (v: boolean) => setFormLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          if (isEdit) { dispatch(updateExamTypeInList(res.data)); toast.success("Exam type updated."); }
          else { dispatch(addExamType(res.data)); toast.success("Exam type created."); }
          setFormOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save exam type"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: timetableActions.DELETE_EXAM_TYPE,
      method: "DELETE",
      endPoint: API.TIMETABLE.EXAM_TYPE_DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeExamType(deleteTarget.id));
        toast.success("Exam type deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete exam type"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{examTypes.length} exam type(s)</span>
        {canEdit && (
          <Button onClick={openCreate} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
            <Plus className="w-4 h-4" /> Add Exam Type
          </Button>
        )}
      </div>

      {examTypesLoading ? <TableSkeleton columns={4} rows={4} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Name", "Description", "Status", "Created", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {examTypes.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">No exam types yet. Create one to get started.</td></tr>
              ) : examTypes.map((et, i) => (
                <motion.tr key={et.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{et.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px] truncate">{et.description || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={et.is_active ? "bg-green-100 text-green-700 text-xs" : "bg-red-100 text-red-700 text-xs"}>
                      {et.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(et.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(et)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(et)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Exam Type" : "Create Exam Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Internal Assessment" className="h-9 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="text-sm resize-none" placeholder="Optional description..." />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: !!v }))} />
              <label htmlFor="is_active" className="text-sm cursor-pointer">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button onClick={handleSave} disabled={formLoading || !form.name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {formLoading ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete exam type "${deleteTarget?.name}"?`}
        description="Any timetable slots referencing this exam type will lose the association."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
