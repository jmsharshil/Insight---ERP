import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setHistory, setHistoryLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

const STATUS_BADGE: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
  half_day: "bg-blue-100 text-blue-700",
  on_leave: "bg-gray-100 text-gray-700",
};

export default function HistoryTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const isBranchManager = user && user.role === "branch_manager";
  const isParentOrStudent = user?.role === "parents" || user?.role === "student";

  const { history, historyLoading, historyCount } = useSelector((s: RootState) => s.attendance);

  const branches = dropdowns?.branches || [];
  const batches = dropdowns?.batches || [];
  const studentsList = dropdowns?.students?.filter((s: any) => {
    if (user && user.role === "branch_manager" && user.branch) {
      return !s.branch_id || s.branch_id === user.branch;
    }
    return true;
  }) || [];
  const facultyList = dropdowns?.faculty?.filter((f: any) => {
    if (user && user.role === "branch_manager" && user.branch) {
      return !f.branch_id || f.branch_id === user.branch;
    }
    return true;
  }) || [];

  const [f, setF] = useState({
    student_id: "", branch_id: isBranchManager && user.branch ? user.branch : "", batch_id: "", date: "", status: "",
  });

  const [correctionModal, setCorrectionModal] = useState({ isOpen: false, recordId: "", status: "", note: "", submitting: false });

  useEffect(() => {
    if (isBranchManager && user.branch && f.branch_id !== user.branch) {
      setF(prev => ({ ...prev, branch_id: user.branch }));
    }
  }, [user]);

  const filteredBatches = f.branch_id && f.branch_id !== "all"
    ? batches.filter((b: any) => b.branch === f.branch_id || b.branch_id === f.branch_id)
    : batches;

  useEffect(() => {
    if (f.batch_id && f.batch_id !== "all" && f.branch_id && f.branch_id !== "all") {
       if (!filteredBatches.find((b: any) => b.id === f.batch_id)) {
         setF(prev => ({ ...prev, batch_id: "" }));
       }
    }
  }, [f.branch_id, batches]);

  const fetch = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_HISTORY,
      method: "GET",
      endPoint: `${API.ATTENDANCE.HISTORY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setHistoryLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setHistory({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load history.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const handleCorrectionSubmit = () => {
    setCorrectionModal((p) => ({ ...p, submitting: true }));
    dispatch({
      type: "GET_DROPDOWN", // Using a generic action type to fire PATCH
      method: "PATCH",
      endPoint: `/api/v1/attendance/${correctionModal.recordId}/`,
      body: { 
        status: correctionModal.status, 
        correction_note: correctionModal.note,
        is_corrected: true 
      },
      auth: true,
      getResponse: () => {
        toast.success("Attendance record corrected successfully.");
        setCorrectionModal({ isOpen: false, recordId: "", status: "", note: "", submitting: false });
        fetch(); // Re-fetch the history list
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to correct attendance record.");
        setCorrectionModal((p) => ({ ...p, submitting: false }));
      },
    } as any);
  };

  const clear = () => setF({ student_id: "", branch_id: isBranchManager && user.branch ? user.branch : "", batch_id: "", date: "", status: "" });

  const filteredBranches = useMemo(() => {
    if (!isBranchManager) return branches;
    return branches.filter((b: any) => b.id === user.branch);
  }, [branches, user]);

  const filteredHistory = useMemo(() => {
    if (!isBranchManager) return history;
    return history.filter((h: any) => {
      const bId = typeof h.branch === "object" && h.branch !== null ? h.branch.id : (h.branch_id || h.branch);
      return bId === user.branch;
    });
  }, [history, user]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {!isParentOrStudent && (
            <>
              <Select
                value={f.student_id}
                onValueChange={(v) => setF((p) => ({ ...p, student_id: v === "all" ? "" : v }))}
              >
                <SelectTrigger className="h-9 text-sm w-44 bg-muted/10">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {studentsList.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={f.branch_id}
                onValueChange={(v) => setF((p) => ({ ...p, branch_id: v === "all" ? "" : v }))}
              >
                <SelectTrigger className="h-9 text-sm w-44 bg-muted/10">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  {!isBranchManager && <SelectItem value="all">All Branches</SelectItem>}
                  {filteredBranches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={f.batch_id}
                onValueChange={(v) => setF((p) => ({ ...p, batch_id: v === "all" ? "" : v }))}
              >
                <SelectTrigger className="h-9 text-sm w-44 bg-muted/10">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches?.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Input
            type="date"
            className="h-9 text-sm w-40"
            value={f.date}
            onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))}
          />
          {!isParentOrStudent && (
            <Select
              value={f.status}
              onValueChange={(v) => setF((p) => ({ ...p, status: v === "all" ? "" : v }))}
            >
              <SelectTrigger className="h-9 text-sm w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={fetch}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
          >
            Apply
          </Button>
          <Button variant="outline" className="h-9 text-sm" onClick={clear}>
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {historyLoading ? (
        <TableSkeleton columns={7} rows={8} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Attendance History</span>
            <span className="text-xs text-muted-foreground">{historyCount} records</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {[
                  "Student",
                  "Roll Number",
                  "Batch",
                  "Branch",
                  "Date",
                  "Check-in",
                  "Check-out",
                  "Status",
                  "Marked By",
                  "Actions"
                ].map((h) => {
                  if (h === "Actions" && isParentOrStudent) return null;
                  return (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No records found.</td></tr>
              ) : filteredHistory.map((row, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium">{row.student_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.roll_number || "—"}</td>
                  <td className="px-4 py-3 text-xs">{row.batch_name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.branch_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.checked_in_at ? new Date(row.checked_in_at).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.checked_out_at ? new Date(row.checked_out_at).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_BADGE[row.status] ?? "bg-gray-100 text-gray-700"}`}>{row.status_display || row.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.marked_by_name || "—"}</td>
                  {!isParentOrStudent && (
                    <td className="px-4 py-3 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700"
                        onClick={() => setCorrectionModal({ isOpen: true, recordId: row.id, status: row.status, note: row.correction_note || "", submitting: false })}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Correct
                      </Button>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={correctionModal.isOpen} onOpenChange={(open) => !correctionModal.submitting && setCorrectionModal(p => ({ ...p, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Correct Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance status if it was marked incorrectly. You can also provide a note for the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={correctionModal.status} onValueChange={(v) => setCorrectionModal(p => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 mt-2">
              <label className="text-sm font-medium">Correction Note (Optional)</label>
              <Textarea
                placeholder="e.g., Marked absent by mistake..."
                value={correctionModal.note}
                onChange={(e) => setCorrectionModal(p => ({ ...p, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionModal(p => ({ ...p, isOpen: false }))} disabled={correctionModal.submitting}>
              Cancel
            </Button>
            <Button onClick={handleCorrectionSubmit} disabled={correctionModal.submitting}>
              {correctionModal.submitting ? "Saving..." : "Save Correction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
