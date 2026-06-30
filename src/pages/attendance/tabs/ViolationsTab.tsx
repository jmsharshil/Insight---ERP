import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { X, ShieldAlert } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setViolations, setViolationsLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const VIOLATION_BADGE: Record<string, string> = {
  absent:       "bg-red-100 text-red-700",
  late:         "bg-yellow-100 text-yellow-700",
  unauthorized: "bg-orange-100 text-orange-700",
};

export default function ViolationsTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { violations, violationsLoading, violationsCount } = useSelector((s: RootState) => s.attendance);
  const { user } = useAuth();
  const isParentOrStudent = user?.role === "parents" || user?.role === "student";
  const isFaculty = user?.role === "faculty";
  const isBranchManager = user?.role === "branch_manager";

  const studentsList = dropdowns?.students?.filter((s: any) => {
    if (isBranchManager && user?.branch) {
      return !s.branch_id || s.branch_id === user.branch;
    }
    return true;
  }) || [];

  const filteredViolations = useMemo(() => {
    if (!isBranchManager) return violations;
    const validStudentIds = new Set(studentsList.map((s: any) => s.id));
    return violations.filter((v: any) => {
      const bId = typeof v.branch === "object" && v.branch !== null ? v.branch.id : (v.branch_id || v.branch);
      if (bId) return bId === user?.branch;
      
      const sId = typeof v.student === 'string' ? v.student : (v.student_id || v.student?.id);
      if (sId) return validStudentIds.has(sId);
      
      return false;
    });
  }, [violations, isBranchManager, user, studentsList]);

  const [f, setF] = useState({
    student_id: "", branch_id: (isBranchManager && user?.branch) ? user.branch : "", violation_type: "", is_resolved: "", date_from: "", date_to: "",
  });

  const [resolveModal, setResolveModal] = useState({ isOpen: false, violationId: "", note: "", submitting: false });

  const fetchViolations = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_VIOLATIONS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.VIOLATIONS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setViolationsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setViolations({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load violations.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetchViolations(); }, []);

  const clear = () => setF({ student_id: "", branch_id: (isBranchManager && user?.branch) ? user.branch : "", violation_type: "", is_resolved: "", date_from: "", date_to: "" });

  const handleResolveSubmit = () => {
    if (!resolveModal.note.trim()) {
      toast.error("Please provide a resolution note.");
      return;
    }

    setResolveModal(p => ({ ...p, submitting: true }));
    dispatch({
      type: "GET_DROPDOWN", // generic dispatch for simple API call
      method: "PATCH",
      endPoint: `/api/v1/attendance/violations/${resolveModal.violationId}/`,
      body: {
        is_resolved: true,
        resolution_note: resolveModal.note,
      },
      auth: true,
      getResponse: (res: any) => {
        toast.success("Violation resolved successfully.");
        setResolveModal({ isOpen: false, violationId: "", note: "", submitting: false });
        fetchViolations();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to resolve violation.");
        setResolveModal(p => ({ ...p, submitting: false }));
      },
    } as any);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        {!isParentOrStudent && !isFaculty && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Student</Label>
            <Select value={f.student_id} onValueChange={v => setF(p => ({ ...p, student_id: v === "all" ? "" : v }))}>
              <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Select Student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {studentsList.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Select value={f.violation_type} onValueChange={v => setF(p => ({ ...p, violation_type: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="unauthorized">Unauthorized</SelectItem>
          </SelectContent>
        </Select>
        {!isParentOrStudent && (
          <Select value={f.is_resolved} onValueChange={v => setF(p => ({ ...p, is_resolved: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Resolved</SelectItem>
              <SelectItem value="false">Unresolved</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" className="h-9 text-sm w-40" value={f.date_from} onChange={e => setF(p => ({ ...p, date_from: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" className="h-9 text-sm w-40" value={f.date_to} onChange={e => setF(p => ({ ...p, date_to: e.target.value }))} />
        </div>
        <Button onClick={fetchViolations} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={clear}><X className="w-3 h-3 mr-1" />Clear</Button>
      </div>

      {violationsLoading ? <TableSkeleton columns={6} rows={6} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-foreground">Violations</span>
            </div>
            <span className="text-xs text-muted-foreground">{isBranchManager ? filteredViolations.length : violationsCount} records</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {["Student", "Roll No.", "Violation Type", "Date", "Description", "Status", "Created At", "Actions"].map(h => {
                  const hasUnresolved = violations.some((v: any) => !v.is_resolved);
                  const showActions = !isParentOrStudent && hasUnresolved;
                  if (h === "Actions" && !showActions) return null;
                  return <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {filteredViolations.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No violations found.</td></tr>
              ) : filteredViolations.map((v: any, i: number) => (
                <motion.tr key={v.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-xs font-semibold">
                        {v.student_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{v.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.roll_number}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${VIOLATION_BADGE[v.violation_type] ?? "bg-gray-100 text-gray-700"}`}>
                      {v.violation_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{v.date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={v.description}>{v.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-xs w-max ${v.is_resolved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {v.is_resolved ? "Resolved" : "Unresolved"}
                      </Badge>
                      {v.is_resolved && v.resolution_note && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={v.resolution_note}>
                          Note: {v.resolution_note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</td>
                  {(!isParentOrStudent && violations.some((val: any) => !val.is_resolved)) && (
                    <td className="px-4 py-3 text-xs">
                      {!v.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setResolveModal({ isOpen: true, violationId: v.id, note: "", submitting: false })}
                        >
                          Resolve
                        </Button>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={resolveModal.isOpen} onOpenChange={(open) => !resolveModal.submitting && setResolveModal(p => ({ ...p, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Resolve Violation</DialogTitle>
            <DialogDescription>
              Mark this violation as resolved. Provide a note detailing the action taken (e.g., warning letter issued, meeting with parents).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note">Resolution Note</Label>
              <Textarea
                id="note"
                placeholder="Type resolution details here..."
                value={resolveModal.note}
                onChange={(e) => setResolveModal(p => ({ ...p, note: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveModal(p => ({ ...p, isOpen: false }))} disabled={resolveModal.submitting}>
              Cancel
            </Button>
            <Button onClick={handleResolveSubmit} disabled={resolveModal.submitting}>
              {resolveModal.submitting ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
