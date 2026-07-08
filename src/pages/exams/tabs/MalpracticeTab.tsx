import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, ShieldAlert } from "lucide-react";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setMalpractice, setMalpracticeLoading,
  addMalpracticeReport, updateMalpracticeReport, removeMalpracticeReport,
} from "@/redux/slices/examSlice";
import type { MalpracticeReport } from "@/redux/slices/examSlice";
import type { RootState } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const SEVERITY_BADGE: Record<string, string> = {
  minor:        "bg-yellow-100 text-yellow-700",
  major:        "bg-red-100 text-red-700",
  disqualified: "bg-red-200 text-red-900",
};

interface MalpracticeTabProps { examId: string; }

export default function MalpracticeTab({ examId }: MalpracticeTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { malpractice, malpracticeLoading } = useSelector((s: RootState) => s.exams);

  const [reportOpen, setReportOpen]         = useState(false);
  const [reportLoading, setReportLoading]   = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState<MalpracticeReport | null>(null);
  const [editLoading, setEditLoading]       = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<MalpracticeReport | null>(null);

  const [form, setForm] = useState({ student_id: "", description: "", severity: "minor" as "minor" | "major" | "disqualified" });

  const canManage = user && ["super_admin", "branch_manager", "admin", "faculty", "exam_supervisor"].includes(user.role ?? "");

  useEffect(() => {
    dispatch({
      type: examActions.GET_MALPRACTICE,
      method: "GET",
      endPoint: API.EXAMS.MALPRACTICE(examId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setMalpracticeLoading(v)),
      getResponse: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        dispatch(setMalpractice(Array.isArray(data) ? data : []));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load malpractice reports"),
    });
  }, [examId]);

  const handleReport = () => {
    dispatch({
      type: examActions.REPORT_MALPRACTICE,
      method: "POST",
      endPoint: API.EXAMS.MALPRACTICE(examId),
      body: form,
      auth: true,
      setLoading: (v: boolean) => setReportLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(addMalpracticeReport(res.data));
          toast.success("Malpractice reported.");
          setReportOpen(false);
          setForm({ student_id: "", description: "", severity: "minor" });
        } else toast.error("Failed to submit report.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to report malpractice"),
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_MALPRACTICE,
      method: "PATCH",
      endPoint: API.EXAMS.MALPRACTICE_DETAIL(examId, editTarget.id),
      body: { description: editTarget.description, severity: editTarget.severity },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateMalpracticeReport(res.data)); toast.success("Report updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update report"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_MALPRACTICE,
      method: "DELETE",
      endPoint: API.EXAMS.MALPRACTICE_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeMalpracticeReport(deleteTarget.id)); toast.success("Report deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete report"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{malpractice.length} report(s)</p>
        {canManage && (
          <Button onClick={() => setReportOpen(true)} className="h-9 bg-red-600 hover:bg-red-700 text-white text-sm gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Report Malpractice
          </Button>
        )}
      </div>

      {malpracticeLoading ? <TableSkeleton rows={3} columns={4} /> : (
        <div className="space-y-3">
          {malpractice.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm bg-white rounded-xl border border-border">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p>No malpractice reports for this exam.</p>
            </div>
          ) : malpractice.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-white p-4 flex items-start gap-4 group hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <Badge className={`text-[10px] capitalize font-semibold ${SEVERITY_BADGE[r.severity] ?? "bg-gray-100 text-gray-700"}`}>
                    {r.severity}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {r.student_name || r.student_id} · {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{r.description}</p>
              </div>
              {canManage && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(r); setEditOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(r)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={o => setReportOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Report Malpractice</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">Student UUID *</Label>
              <Input value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                placeholder="student-uuid" className="h-9 text-sm font-mono mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Severity *</Label>
              <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Description *</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Describe the incident..." className="text-sm resize-none mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reportLoading}>Cancel</Button>
            <Button onClick={handleReport} disabled={reportLoading || !form.student_id.trim() || !form.description.trim()}
              className="bg-red-600 hover:bg-red-700 text-white">
              {reportLoading ? "Submitting…" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Report</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs font-semibold">Severity</Label>
                <Select value={editTarget.severity} onValueChange={v => setEditTarget(p => p ? { ...p, severity: v as any } : null)}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="disqualified">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea value={editTarget.description}
                  onChange={e => setEditTarget(p => p ? { ...p, description: e.target.value } : null)}
                  rows={3} className="text-sm resize-none mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete this malpractice report?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
