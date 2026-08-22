import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { X, ShieldAlert, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const VIOLATION_BADGE: Record<string, string> = {
  absent:       "bg-red-100 text-red-700",
  late:         "bg-yellow-100 text-yellow-700",
  unauthorized: "bg-orange-100 text-orange-700",
  missing_checkout: "bg-blue-100 text-blue-700",
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

  const facultyList = dropdowns?.faculty?.filter((f: any) => {
    if (isBranchManager && user?.branch) {
      return !f.branch_id || f.branch_id === user.branch;
    }
    return true;
  }) || [];

  const [violationType, setViolationType] = useState<"student" | "employee">("student");

  const filteredViolations = useMemo(() => {
    if (!isBranchManager) return violations;
    if (violationType === "student") {
      const validStudentIds = new Set(studentsList.map((s: any) => s.id));
      return violations.filter((v: any) => {
        const bId = typeof v.branch === "object" && v.branch !== null ? v.branch.id : (v.branch_id || v.branch);
        if (bId) return bId === user?.branch;
        
        const sId = typeof v.student === 'string' ? v.student : (v.student_id || v.student?.id);
        if (sId) return validStudentIds.has(sId);
        
        return false;
      });
    } else {
      const validFacultyIds = new Set(facultyList.map((f: any) => f.id));
      return violations.filter((v: any) => {
        const bId = typeof v.branch === "object" && v.branch !== null ? v.branch.id : (v.branch_id || v.branch);
        if (bId) return bId === user?.branch;
        
        const eId = typeof v.user === 'string' ? v.user : (v.user_id || v.user?.id);
        if (eId) return validFacultyIds.has(eId);
        
        return false;
      });
    }
  }, [violations, isBranchManager, user, studentsList, facultyList, violationType]);

  const [f, setF] = useState({
    student_id: "", employee_id: "", branch_id: (isBranchManager && user?.branch) ? user.branch : "", violation_type: "", is_resolved: "", date_from: "", date_to: "", search: "",
  });

  const [resolveModal, setResolveModal] = useState({ isOpen: false, violationId: "", note: "", submitting: false });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const totalPages = Math.max(1, Math.ceil(violationsCount / pageSize));

  const fetchViolations = (page = currentPage, overrideFilters = f, type = violationType) => {
    const p = new URLSearchParams();
    Object.entries(overrideFilters).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set("page", page.toString());
    p.set("page_size", pageSize.toString());

    const endpoint = type === "employee" ? API.ATTENDANCE.EMPLOYEE_VIOLATIONS : API.ATTENDANCE.VIOLATIONS;

    dispatch({
      type: attendanceActions.GET_VIOLATIONS,
      method: "GET",
      endPoint: `${endpoint}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setViolationsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success || res?.data) {
          dispatch(setViolations({ data: res.data || res, count: res.count ?? res.data?.length ?? 0 }));
        } else {
          toast.error("Failed to load violations.");
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { 
    fetchViolations(currentPage, f, violationType); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, violationType]);

  const handleApply = () => {
    if (currentPage === 1) fetchViolations(1, f, violationType);
    else setCurrentPage(1);
  };

  const handleClear = () => {
    const newF = { student_id: "", employee_id: "", branch_id: (isBranchManager && user?.branch) ? user.branch : "", violation_type: "", is_resolved: "", date_from: "", date_to: "", search: "" };
    setF(newF);
    if (currentPage === 1) fetchViolations(1, newF, violationType);
    else setCurrentPage(1);
  };

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
        fetchViolations(currentPage, f, violationType);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to resolve violation.");
        setResolveModal(p => ({ ...p, submitting: false }));
      },
    } as any);
  };

  return (
    <div className="space-y-4">
      <Tabs value={violationType} onValueChange={(v: any) => {
        setViolationType(v);
        setCurrentPage(1);
        setF(prev => ({ ...prev, student_id: "", employee_id: "", search: "" }));
      }}>
        <TabsList>
          <TabsTrigger value="student">Student Violations</TabsTrigger>
          <TabsTrigger value="employee">Employee Violations</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, roll no, description..."
              className="pl-9 h-9 text-sm"
              value={f.search}
              onChange={e => setF(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
        {!isParentOrStudent && !isFaculty && violationType === "student" && (
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
        {!isParentOrStudent && !isFaculty && violationType === "employee" && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Employee</Label>
            <Select value={f.employee_id} onValueChange={v => setF(p => ({ ...p, employee_id: v === "all" ? "" : v }))}>
              <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Select Employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {facultyList.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
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
            {violationType === "employee" && <SelectItem value="missing_checkout">Missing Checkout</SelectItem>}
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
        <Button onClick={handleApply} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={handleClear}><X className="w-3 h-3 mr-1" />Clear</Button>
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
                {(violationType === "employee" 
                  ? ["Employee", "Role", "Violation Type", "Date", "Description", "Status", "Created At", "Actions"] 
                  : ["Student", "Roll No.", "Violation Type", "Date", "Description", "Status", "Created At", "Actions"]
                ).map(h => {
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
                        {(violationType === "employee" ? (v.user?.name || "E") : (v.student_name || "S"))?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{violationType === "employee" ? (v.user?.name || "Unknown") : (v.student_name || "Unknown")}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{violationType === "employee" ? (v.user?.role || "-").replace(/_/g, " ") : (v.roll_number || "-")}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${VIOLATION_BADGE[v.violation_type] ?? "bg-gray-100 text-gray-700"}`}>
                      {v.violation_type_display || v.violation_type}
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
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
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
