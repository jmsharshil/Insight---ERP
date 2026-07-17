import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, ShieldAlert, User, Clock, AlertTriangle, Gavel } from "lucide-react";
import { examActions, studentActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setMalpractice,
  setMalpracticeLoading,
  addMalpracticeReport,
  updateMalpracticeReport,
  removeMalpracticeReport,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const SEVERITY_BADGE: Record<string, string> = {
  minor: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  major: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  disqualified: "bg-red-500/10 text-red-700 border-red-500/20",
};

interface MalpracticeTabProps {
  examId: string;
}

export default function MalpracticeTab({ examId }: MalpracticeTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { malpractice, malpracticeLoading, seating } = useSelector((s: RootState) => s.exams);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MalpracticeReport | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MalpracticeReport | null>(null);

  const [form, setForm] = useState({
    student_id: "",
    description: "",
    severity: "minor" as "minor" | "major" | "disqualified",
  });

  const [apiStudents, setApiStudents] = useState<any[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  const canManage =
    user &&
    ["super_admin", "branch_manager", "admin", "faculty", "exam_supervisor"].includes(
      user.role ?? "",
    );

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
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to load malpractice reports"),
    });
  }, [examId]);

  useEffect(() => {
    if (reportOpen && apiStudents.length === 0) {
      const endPoint =
        user && user.role === "branch_manager" && user.branch
          ? `${API.STUDENTS.LIST}${API.STUDENTS.LIST.includes("?") ? "&" : "?"}branch_id=${user.branch}`
          : API.STUDENTS.LIST;

      dispatch({
        type: studentActions.GET_STUDENTS,
        method: "GET",
        endPoint,
        auth: true,
        setLoading: setFetchingStudents,
        getResponse: (res: any) => {
          const data = res?.data || res?.results || res || [];
          setApiStudents(Array.isArray(data) ? data : []);
        },
        getError: () => toast.error("Failed to load students"),
      });
    }
  }, [reportOpen, user, apiStudents.length]);

  const handleReport = () => {
    dispatch({
      type: examActions.REPORT_MALPRACTICE,
      method: "POST",
      endPoint: API.EXAMS.MALPRACTICE(examId),
      body: form,
      auth: true,
      setLoading: (v: boolean) => setReportLoading(v),
      getResponse: (res: any) => {
        if (res?.success || res?.id) {
          const newReport = res.data || (res.id ? res : null);
          if (newReport) {
            dispatch(addMalpracticeReport(newReport));
          }
          toast.success("Malpractice reported.");
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
            getError: (err: any) =>
              toast.error(err?.response?.data?.message || "Failed to load malpractice reports"),
          });
          setReportOpen(false);
          setForm({ student_id: "", description: "", severity: "minor" });
        } else toast.error("Failed to submit report.");
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to report malpractice"),
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
        if (res?.data) {
          dispatch(updateMalpracticeReport(res.data));
          toast.success("Report updated.");
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
            getError: (err: any) =>
              toast.error(err?.response?.data?.message || "Failed to load malpractice reports"),
          });
          setEditOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to update report"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_MALPRACTICE,
      method: "DELETE",
      endPoint: API.EXAMS.MALPRACTICE_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeMalpracticeReport(deleteTarget.id));
        toast.success("Report deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to delete report"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{malpractice.length} report(s)</p>
        {/* {canManage && (
          <Button
            onClick={() => setReportOpen(true)}
            className="h-9 bg-red-600 hover:bg-red-700 text-white text-sm gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Report Malpractice
          </Button>
        )} */}
      </div>

      {malpracticeLoading ? (
        <TableSkeleton rows={3} columns={4} />
      ) : (
        <div className="space-y-3">
          {malpractice.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm bg-white rounded-xl border border-border">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p>No violations for this exam.</p>
            </div>
          ) : (
            malpractice.filter(Boolean).map((r, i) => {
              const isTerminated = r.action_taken === "exam_terminated" || r.severity === "disqualified";
              const accentColor = isTerminated ? "bg-red-500" : (r.action_taken === "warning_issued" ? "bg-yellow-500" : "bg-orange-500");
              const bgBadge = isTerminated ? "bg-red-500/10 text-red-600 border-red-500/20" : (r.action_taken === "warning_issued" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20");

              return (
              <motion.div
                key={r.id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-border bg-card p-5 group hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                {/* Subtle side accent based on severity */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${isTerminated ? "bg-red-500/10 text-red-600" : "bg-orange-500/10 text-orange-600"}`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <Badge
                          variant="outline"
                          className={`capitalize font-semibold text-[11px] ${bgBadge}`}
                        >
                          {r.event_type_display || r.event_type || r.severity_display || r.severity || "Violation"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {r.occurred_at
                            ? new Date(r.occurred_at).toLocaleString()
                            : r.reported_at
                              ? r.reported_at
                              : r.created_at
                                ? new Date(r.created_at).toLocaleString()
                                : ""}
                        </span>
                      </div>
                    </div>

                    {/* People involved */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                            Student
                          </p>
                          <p className="font-medium text-foreground truncate">
                            {r.student_name || r.student || r.student_id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                            {r.session_id ? "Session ID" : "Reported By"}
                          </p>
                          <p className={`font-medium text-foreground truncate ${r.session_id ? "font-mono text-xs" : ""}`}>
                            {r.session_id || r.reported_by_name || r.reported_by || "System Auto-detected"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description & Action Taken */}
                    {(r.action_taken_display || r.action_taken || r.description) && (
                      <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                          <Gavel className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-red-700/80 mb-0.5 uppercase tracking-wider">
                            {r.action_taken_display || r.action_taken ? "Action Taken" : "Incident Details"}
                          </h5>
                          <p className="text-sm text-red-900/90 leading-relaxed font-medium capitalize">
                            {(r.action_taken_display || r.action_taken || "").replace(/_/g, " ")}
                            {!r.action_taken_display && !r.action_taken && r.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {/* {canManage && (
                    <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 pt-3 sm:pt-0 sm:border-l sm:border-border sm:pl-4 border-t sm:border-t-0 border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto h-8 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:mr-1.5 text-destructive" />
                        <span className="hidden sm:inline text-xs font-semibold">Delete</span>
                      </Button>
                    </div>
                  )} */}
                </div>
              </motion.div>
            )})
          )}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={(o) => setReportOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Report Malpractice</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">Student *</Label>
              <Select
                value={form.student_id}
                onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
              >
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue
                    placeholder={fetchingStudents ? "Loading students..." : "Select a student"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {apiStudents && apiStudents.length > 0 ? (
                    apiStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name || s.name || s.id}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {fetchingStudents ? "Loading..." : "No students found"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Severity *</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => setForm((f) => ({ ...f, severity: v as any }))}
              >
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Describe the incident..."
                className="text-sm resize-none mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reportLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={reportLoading || !form.student_id.trim() || !form.description.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {reportLoading ? "Submitting…" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Report</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs font-semibold">Severity</Label>
                <Select
                  value={editTarget.severity}
                  onValueChange={(v) =>
                    setEditTarget((p) => (p ? { ...p, severity: v as any } : null))
                  }
                >
                  <SelectTrigger className="h-9 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="disqualified">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  value={editTarget.description}
                  onChange={(e) =>
                    setEditTarget((p) => (p ? { ...p, description: e.target.value } : null))
                  }
                  rows={3}
                  className="text-sm resize-none mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={editLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this malpractice report?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
