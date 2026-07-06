import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Search, RefreshCw, Filter, CheckCircle2, XCircle, Pencil, Trash2, Users, FileText, Clock, AlertCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";

import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";

interface PapersTabProps {
  examId: string;
}

export default function PapersTab({ examId }: PapersTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  // Checker Status State
  const [checkerStatus, setCheckerStatus] = useState<any | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Edit & Delete State
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    marks_obtained: "",
    remarks: "",
    notes: ""
  });

  // Query State
  const [queryTarget, setQueryTarget] = useState<any | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryForm, setQueryForm] = useState({
    query_type: "",
    description: ""
  });

  const [viewQueriesTarget, setViewQueriesTarget] = useState<any | null>(null);
  const [activeResolveQueryId, setActiveResolveQueryId] = useState<string | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    marks_obtained: "",
    remarks: ""
  });

  // Filters
  const [search, setSearch] = useState("");
  const [isSubmitted, setIsSubmitted] = useState("all");
  const [isPass, setIsPass] = useState("all");
  const [isAbsent, setIsAbsent] = useState("all");
  const [isRechecked, setIsRechecked] = useState("all");

  const fetchPapers = () => {
    setLoading(true);
    let qs = ``;
    if (search) qs += `&search=${search}`;
    if (isSubmitted !== "all") qs += `&is_submitted=${isSubmitted}`;
    if (isPass !== "all") qs += `&is_pass=${isPass}`;
    if (isAbsent !== "all") qs += `&is_absent=${isAbsent}`;
    if (isRechecked !== "all") qs += `&is_rechecked=${isRechecked}`;

    let endPoint = API.EXAMS.PAPERS(examId);
    if (qs) {
      endPoint += `?${qs.substring(1)}`;
    }

    dispatch({
      type: examActions.GET_PAPERS,
      method: "GET",
      endPoint,
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          setPapers(data);
          setCount(res.count ?? data.length);
        } else {
          toast.error("Failed to load papers.");
        }
        setLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Error loading papers");
        setLoading(false);
      },
    });
  };

  const fetchCheckerStatus = () => {
    setStatusLoading(true);
    dispatch({
      type: examActions.GET_CHECKER_STATUS,
      method: "GET",
      endPoint: API.EXAMS.CHECKER_STATUS(examId),
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          setCheckerStatus(res.data);
        }
        setStatusLoading(false);
      },
      getError: () => {
        setStatusLoading(false);
      },
    });
  };

  useEffect(() => {
    if (examId) {
      fetchPapers();
      fetchCheckerStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, isSubmitted, isPass, isAbsent, isRechecked]);

  const clearFilters = () => {
    setSearch("");
    setIsSubmitted("all");
    setIsPass("all");
    setIsAbsent("all");
    setIsRechecked("all");
    // it will refetch automatically since dependencies change
  };

  const openEdit = (paper: any) => {
    if (paper.has_open_query) {
      toast.error("This marksheet has an open query. Please resolve the query first.");
      return;
    }
    setEditTarget(paper);
    setEditForm({
      marks_obtained: paper.marks_obtained !== null && paper.marks_obtained !== undefined ? String(paper.marks_obtained) : "",
      remarks: paper.remarks || "",
      notes: ""
    });
  };

  const handleUpdateMarks = () => {
    if (!editTarget) return;
    
    setEditLoading(true);
    dispatch({
      type: examActions.UPDATE_PAPER_MARKS,
      method: "POST", // The backend allows POST/PUT, POST is fine.
      endPoint: API.EXAMS.PAPER_MARKS(examId, editTarget.id),
      body: {
        marks_obtained: editForm.marks_obtained ? Number(editForm.marks_obtained) : null,
        remarks: editForm.remarks,
        notes: editForm.notes
      },
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Marks updated successfully.");
          setEditTarget(null);
          fetchPapers(); // refresh data
        } else {
          toast.error(res?.message || "Failed to update marks.");
        }
        setEditLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Error updating marks");
        setEditLoading(false);
      },
    });
  };

  const handleRaiseQuery = () => {
    if (!queryTarget || !queryForm.query_type) {
       toast.error("Please select a query type.");
       return;
    }
    
    setQueryLoading(true);
    dispatch({
      type: examActions.RAISE_PAPER_QUERY,
      method: "POST",
      endPoint: API.EXAMS.PAPER_QUERY(examId, queryTarget.id),
      body: {
        query_type: queryForm.query_type,
        description: queryForm.description
      },
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Query raised successfully.");
          setQueryTarget(null);
          fetchPapers(); // refresh data
        } else {
          toast.error(res?.message || "Failed to raise query.");
        }
        setQueryLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Error raising query");
        setQueryLoading(false);
      },
    });
  };

  const handleResolveQuery = (queryId: string) => {
    if (!viewQueriesTarget) return;

    setResolveLoading(true);
    dispatch({
      type: examActions.RESOLVE_PAPER_QUERY,
      method: "PATCH",
      endPoint: API.EXAMS.RESOLVE_QUERY(examId, queryId),
      body: {
        ...(resolveForm.marks_obtained !== "" ? { marks_obtained: Number(resolveForm.marks_obtained) } : {}),
        ...(resolveForm.remarks ? { remarks: resolveForm.remarks } : {})
      },
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Query resolved successfully.");
          setActiveResolveQueryId(null);
          setViewQueriesTarget(null);
          fetchPapers(); // refresh data
        } else {
          toast.error(res?.message || "Failed to resolve query.");
        }
        setResolveLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Error resolving query");
        setResolveLoading(false);
      },
    });
  };

  const handleDeletePaper = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_PAPER,
      method: "DELETE",
      endPoint: API.EXAMS.PAPER_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Marksheet deleted.");
          setDeleteTarget(null);
          fetchPapers();
        } else {
          toast.error(res?.message || "Failed to delete marksheet.");
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Error deleting marksheet");
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search student or checker..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPapers()}
          />
        </div>

        <Select value={isPass} onValueChange={setIsPass}>
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue placeholder="Pass/Fail" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="true">Passed</SelectItem>
            <SelectItem value="false">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isAbsent} onValueChange={setIsAbsent}>
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue placeholder="Attendance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="true">Absent</SelectItem>
            <SelectItem value="false">Present</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={clearFilters}>
          <Filter className="w-3.5 h-3.5" /> Clear
        </Button>

        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={fetchPapers}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">{count} paper(s) found</p>

      {/* Checker Status Widget */}
      {checkerStatus && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Checker Status & Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Total Papers</span>
              </div>
              <div className="text-2xl font-bold">{checkerStatus.total_papers || 0}</div>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Submitted</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{checkerStatus.submitted || 0}</div>
            </div>
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Pending</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">
                {checkerStatus.approval_pending || 0}
              </div>
            </div>
            <div className="bg-red-50/50 p-3 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Overdue</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{checkerStatus.overdue || 0}</div>
            </div>
          </div>

          {checkerStatus.checkers && checkerStatus.checkers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2 rounded-tl-lg">Checker Name</th>
                    <th className="px-3 py-2 text-center">Assigned</th>
                    <th className="px-3 py-2 text-center">Submitted</th>
                    <th className="px-3 py-2 text-center">Pending</th>
                    <th className="px-3 py-2 rounded-tr-lg">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {checkerStatus.checkers.map((chk: any) => (
                    <tr key={chk.checker_id}>
                      <td className="px-3 py-2 font-medium">{chk.checker_name || "—"}</td>
                      <td className="px-3 py-2 text-center font-mono">{chk.assigned_count || 0}</td>
                      <td className="px-3 py-2 text-center font-mono text-blue-600">
                        {chk.submitted_count || 0}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-amber-600">
                        {chk.pending_count || 0}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {chk.last_activity
                          ? format(new Date(chk.last_activity), "dd MMM, hh:mm a")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {[
                  "Student",
                  "Checker",
                  "Marks",
                  "Status",
                  "Flags",
                  "Checked At",
                  "Remarks",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {papers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground text-sm">
                    No papers found matching the criteria.
                  </td>
                </tr>
              ) : (
                papers.map((paper, i) => (
                  <motion.tr
                    key={paper.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground">
                        {paper.student_name}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Roll: {paper.roll_number || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{paper.checker_name || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {paper.is_absent ? "—" : (paper.marks_obtained ?? "—")}
                    </td>
                    <td className="px-4 py-3">
                      {paper.is_absent ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Absent
                        </Badge>
                      ) : paper.is_pass ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px] hover:bg-green-100">
                          Pass
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-[10px] hover:bg-red-100">
                          Fail
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {paper.is_submitted && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Submitted
                          </Badge>
                        )}
                        {paper.is_rechecked && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-purple-50 text-purple-700 border-purple-200"
                          >
                            Rechecked
                          </Badge>
                        )}
                        {paper.has_open_query && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Open Query
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {paper.checked_at
                        ? format(new Date(paper.checked_at), "dd MMM, hh:mm a")
                        : "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate"
                      title={paper.remarks}
                    >
                      {paper.remarks || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => openEdit(paper)}
                          disabled={paper.is_absent}
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => {
                            setQueryTarget(paper);
                            setQueryForm({ query_type: "", description: "" });
                          }}
                          title="Raise Query"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        </Button>
                        {paper.queries && paper.queries.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => {
                              setViewQueriesTarget(paper);
                              setActiveResolveQueryId(null);
                            }}
                            title="View Queries"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => setDeleteTarget(paper)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Marks Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Update Marks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm font-medium text-muted-foreground">
              Student: <span className="text-foreground">{editTarget?.student_name}</span>
              {editTarget?.roll_number && ` (Roll: ${editTarget.roll_number})`}
            </div>

            <div>
              <Label className="text-xs font-semibold">Marks Obtained *</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.marks_obtained}
                onChange={(e) => setEditForm({ ...editForm, marks_obtained: e.target.value })}
                className="h-9 text-sm mt-1"
                placeholder="e.g. 78.5"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Remarks</Label>
              <Textarea
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                className="text-sm resize-none mt-1"
                rows={2}
                placeholder="e.g. Excellent performance..."
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Internal Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="text-sm resize-none mt-1"
                rows={2}
                placeholder="e.g. Recheck verification complete..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMarks}
              disabled={editLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editLoading ? "Saving…" : "Save Marks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raise Query Dialog */}
      <Dialog open={!!queryTarget} onOpenChange={(o) => !o && setQueryTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Raise Query</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm font-medium text-muted-foreground">
              Student: <span className="text-foreground">{queryTarget?.student_name}</span>
              {queryTarget?.roll_number && ` (Roll: ${queryTarget.roll_number})`}
            </div>

            <div>
              <Label className="text-xs font-semibold">Query Type *</Label>
              <Select
                value={queryForm.query_type}
                onValueChange={(val) => setQueryForm((prev) => ({ ...prev, query_type: val }))}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Select query type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="answer_key_not_available">Answer Key Not Available</SelectItem>
                  <SelectItem value="marksheet_not_clear">Marksheet Not Clear/Illegible</SelectItem>
                  <SelectItem value="discrepancy_found">
                    Discrepancy in Answer Key or Marks
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                value={queryForm.description}
                onChange={(e) => setQueryForm({ ...queryForm, description: e.target.value })}
                className="text-sm resize-none mt-1"
                rows={3}
                placeholder="Describe the issue in detail..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQueryTarget(null)} disabled={queryLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleRaiseQuery}
              disabled={queryLoading || !queryForm.query_type}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {queryLoading ? "Submitting…" : "Raise Query"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View & Resolve Queries Dialog */}
      <Dialog open={!!viewQueriesTarget} onOpenChange={(o) => !o && setViewQueriesTarget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Queries</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="text-sm font-medium text-muted-foreground">
              Student: <span className="text-foreground">{viewQueriesTarget?.student_name}</span>
              {viewQueriesTarget?.roll_number && ` (Roll: ${viewQueriesTarget.roll_number})`}
            </div>

            {viewQueriesTarget?.queries && viewQueriesTarget.queries.length > 0 ? (
              <div className="space-y-4">
                {viewQueriesTarget.queries.map((q: any) => (
                  <div key={q.id} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-sm">{q.query_type_display}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Raised by: <span className="font-medium">{q.raised_by_name}</span> on {format(new Date(q.created_at), "dd MMM, yyyy")}
                        </p>
                      </div>
                      <Badge variant={q.status === "open" ? "default" : "secondary"} className={q.status === "open" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : ""}>
                        {q.status_display}
                      </Badge>
                    </div>
                    
                    {q.description && (
                      <div className="text-sm bg-white p-3 rounded-md border border-border/50">
                        {q.description}
                      </div>
                    )}

                    {q.status === "open" && isSuperAdmin && (
                      <div className="pt-2">
                        {activeResolveQueryId === q.id ? (
                          <div className="space-y-3 border-t border-border pt-3 mt-2">
                            <h5 className="text-xs font-semibold">Resolve Query</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-[10px] uppercase">Update Marks (Optional)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder={`Current: ${viewQueriesTarget.marks_obtained}`}
                                  value={resolveForm.marks_obtained}
                                  onChange={(e) => setResolveForm({ ...resolveForm, marks_obtained: e.target.value })}
                                  className="h-8 text-xs mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase">Remarks (Optional)</Label>
                              <Textarea
                                rows={2}
                                placeholder="Add resolution remarks..."
                                value={resolveForm.remarks}
                                onChange={(e) => setResolveForm({ ...resolveForm, remarks: e.target.value })}
                                className="text-xs resize-none mt-1"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setActiveResolveQueryId(null)}
                                disabled={resolveLoading}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleResolveQuery(q.id)}
                                disabled={resolveLoading}
                              >
                                {resolveLoading ? "Saving..." : "Confirm Resolution"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              setActiveResolveQueryId(q.id);
                              setResolveForm({ marks_obtained: "", remarks: "" });
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    )}
                    {q.status === "resolved" && q.resolved_by_name && (
                      <div className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2">
                        Resolved by: <span className="font-medium text-foreground">{q.resolved_by_name}</span> on {format(new Date(q.resolved_at), "dd MMM, yyyy")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">No queries found.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewQueriesTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Marksheet?"
        description="Are you sure you want to delete this marksheet? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeletePaper}
      />
    </div>
  );
}
