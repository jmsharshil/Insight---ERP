import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { examActions, userActions } from "@/redux/actions";
import { API } from "@/service/api";
import type { Exam } from "@/redux/slices/examSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Key, BookOpen, Smartphone, Clock, CheckCircle, Trash2, HelpCircle, FileText, Upload, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { downloadCsv } from "@/lib/exportUtils";

interface ResultsTabProps {
  exam: Exam;
}

export default function ResultsTab({ exam }: ResultsTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  const [distributeLoading, setDistributeLoading] = useState(false);
  const [distributeConfirm, setDistributeConfirm] = useState(false);

  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportingExam, setExportingExam] = useState(false);

  const [recheckRequests, setRecheckRequests] = useState<any[]>([]);

  const [recheckModal, setRecheckModal] = useState(false);
  const [recheckForm, setRecheckForm] = useState<{ reason: string; file: File | null }>({ reason: "", file: null });
  const [recheckSubmitLoading, setRecheckSubmitLoading] = useState(false);

  const [recheckActionModal, setRecheckActionModal] = useState<any>(null);
  const [recheckActionForm, setRecheckActionForm] = useState({ action: "", reason: "", new_checker_id: "" });
  const [recheckActionLoading, setRecheckActionLoading] = useState(false);
  const [checkers, setCheckers] = useState<any[]>([]);
  const [checkersLoading, setCheckersLoading] = useState(false);

  const isAdmin   = user && ["super_admin", "branch_manager", "admin", "admin_senior_executive"].includes(user.role ?? "");
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";
  const isParent  = user?.role === "parent" || user?.role === "parents";
  const isPaperChecker = user?.role === "paper_checker";

  const canDistribute = isAdmin || isFaculty;

  const handleDistributeAnswerKey = () => {
    dispatch({
      type: examActions.DISTRIBUTE_ANSWER_KEY,
      method: "POST",
      endPoint: API.EXAMS.DISTRIBUTE_ANSWER_KEY(exam.id),
      auth: true,
      setLoading: (v: boolean) => setDistributeLoading(v),
      getResponse: () => {
        toast.success("Answer key distributed to paper checkers via email.");
        setDistributeConfirm(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to distribute answer key.");
        setDistributeConfirm(false);
      },
    });
  };

  const fetchResults = () => {
    dispatch({
      type: examActions.GET_RESULTS,
      method: "GET",
      endPoint: API.EXAMS.RESULTS(exam.id),
      auth: true,
      setLoading: (v: boolean) => setResultsLoading(v),
      getResponse: (res: any) => {
        const data = res?.data || [];
        setResults(data);
        const extractedRecheckRequests = data.flatMap((r: any) => 
          (r.recheck_requests || []).map((req: any) => ({
            ...req,
            student_name: r.student_name,
            roll_number: r.roll_number
          }))
        );
        setRecheckRequests(extractedRecheckRequests);
      },
      getError: () => {
        toast.error("Failed to fetch results.");
      }
    });
  };

  useEffect(() => {
    fetchResults();
  }, [exam.id]);

  useEffect(() => {
    if (recheckActionModal && checkers.length === 0 && !checkersLoading) {
      setCheckersLoading(true);
      dispatch({
        type: userActions.GET_USERS,
        method: "GET",
        endPoint: API.USERS.LIST,
        auth: true,
        getResponse: (res: any) => {
          const data = Array.isArray(res) ? res : res?.results ?? res?.data ?? [];
          setCheckers(data.filter((u: any) => u.role === "paper_checker"));
          setCheckersLoading(false);
        },
        getError: () => {
          setCheckersLoading(false);
        },
      } as any);
    }
  }, [recheckActionModal, checkers.length, dispatch]);

  const handlePublishResults = () => {
    dispatch({
      type: examActions.PUBLISH_RESULTS,
      method: "POST",
      endPoint: API.EXAMS.PUBLISH_RESULTS(exam.id),
      auth: true,
      setLoading: (v: boolean) => setPublishLoading(v),
      getResponse: () => {
        toast.success("Results published successfully.");
        setPublishConfirm(false);
        fetchResults();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to publish results.");
        setPublishConfirm(false);
      }
    });
  };

  const handleDeleteResult = () => {
    if (!deleteId) return;
    dispatch({
      type: examActions.DELETE_RESULT,
      method: "DELETE",
      endPoint: API.EXAMS.RESULT_DETAIL(exam.id, deleteId),
      auth: true,
      setLoading: (v: boolean) => setDeleteLoading(v),
      getResponse: () => {
        toast.success("Result deleted.");
        setDeleteId(null);
        fetchResults();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete result.");
        setDeleteId(null);
      }
    });
  };

  const handleExportExamResults = async () => {
    setExportingExam(true);
    try {
      await downloadCsv(API.RESULTS_ANALYTICS.EXPORT, { type: "exam", exam_id: exam.id }, `exam_${exam.id}_results.csv`);
      toast.success("Exam results exported successfully");
    } catch (err) {
      toast.error("Failed to export exam results");
    } finally {
      setExportingExam(false);
    }
  };

  const handleSubmitRecheck = () => {
    if (!recheckForm.reason) {
      toast.error("Reason is required.");
      return;
    }
    
    const formData = new FormData();
    formData.append("reason", recheckForm.reason);
    if (recheckForm.file) {
      formData.append("uploaded_marksheet", recheckForm.file);
    }

    dispatch({
      type: examActions.CREATE_RECHECK_REQUEST,
      method: "POST",
      endPoint: API.EXAMS.CREATE_RECHECK_REQUEST(exam.id),
      body: formData,
      isMultipart: true,
      auth: true,
      setLoading: (v: boolean) => setRecheckSubmitLoading(v),
      getResponse: (res: any) => {
        toast.success(res.message || "Recheck request submitted.");
        setRecheckModal(false);
        setRecheckForm({ reason: "", file: null });
        fetchResults();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to submit recheck request.");
      }
    });
  };

  const handleActionRecheck = () => {
    if (!recheckActionForm.action) {
      toast.error("Please select an action.");
      return;
    }
    if (recheckActionForm.action === "approve" && !recheckActionForm.new_checker_id) {
      toast.error("New Checker ID is required for approval.");
      return;
    }
    if (recheckActionForm.action === "reject" && !recheckActionForm.reason) {
      toast.error("Reason is required for rejection.");
      return;
    }

    dispatch({
      type: examActions.RECHECK_REQUEST_ACTION,
      method: "PATCH",
      endPoint: API.EXAMS.RECHECK_REQUEST_ACTION(exam.id, recheckActionModal.id),
      body: {
        action: recheckActionForm.action,
        ...(recheckActionForm.action === "approve" ? { new_checker_id: recheckActionForm.new_checker_id } : { reason: recheckActionForm.reason })
      },
      auth: true,
      setLoading: (v: boolean) => setRecheckActionLoading(v),
      getResponse: (res: any) => {
        toast.success(res.message || "Action completed.");
        setRecheckActionModal(null);
        fetchResults();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to perform action.");
      }
    });
  };

  if (resultsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Fetching your results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Exam Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-white p-5 shadow-sm"
      >
        <h3 className="text-sm font-heading font-semibold mb-3">Exam Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Marks",   value: exam.total_marks,          color: "text-foreground" },
            { label: "Passing Marks",    value: exam.pass_marks,           color: "text-foreground" },
            { label: "Exam Type",     value: exam.exam_type,            color: "text-blue-600"   },
            { label: "Result Mode",   value: exam.result_release_mode,  color: exam.result_release_mode === "instant" ? "text-green-600" : "text-yellow-600" },
          ].map(item => (
            <div key={item.label} className="text-center rounded-lg bg-muted/30 p-3">
              <div className={`text-lg font-bold capitalize ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {exam.instructions && (
          <div className="mt-4 rounded-lg bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Instructions</p>
            <p className="text-sm text-foreground leading-relaxed">{exam.instructions}</p>
          </div>
        )}
      </motion.div>

      {/* Answer Key Distribution — admin/faculty only */}
      {/* {canDistribute && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 shrink-0">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-heading font-semibold text-purple-900">Distribute Answer Key</h4>
                <p className="text-xs text-purple-700/80 mt-0.5">
                  Sends a secure email link to all assigned paper checkers.
                  They can view the answer key without logging in.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setDistributeConfirm(true)}
              disabled={distributeLoading}
              className="h-9 bg-purple-600 hover:bg-purple-700 text-white text-sm gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              {distributeLoading ? "Sending…" : "Distribute"}
            </Button>
          </div>
        </motion.div>
      )} */}

      {/* Admin / Faculty / Paper Checker Results List */}
      {(isAdmin || isFaculty || isPaperChecker) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-white shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-heading font-semibold">Exam Results</h3>
            <div className="flex items-center gap-2">
              {results.length > 0 && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={handleExportExamResults}
                  disabled={exportingExam}
                >
                  {exportingExam ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Export CSV
                </Button>
              )}
              {results.length === 0 && (isAdmin || isFaculty || isPaperChecker) && (
                <Button 
                  onClick={() => setPublishConfirm(true)}
                  disabled={publishLoading}
                  className="h-8 gap-1.5"
                  size="sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {publishLoading ? "Publishing…" : "Publish Results"}
                </Button>
              )}
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            {results.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Roll No</th>
                    <th className="px-4 py-3 font-medium">Marks</th>
                    <th className="px-4 py-3 font-medium">%</th>
                    <th className="px-4 py-3 font-medium">Percentile</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Rank</th>
                    {isAdmin && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((res: any) => (
                    <tr key={res.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{res.student_name}</td>
                      <td className="px-4 py-3">{res.roll_number || "-"}</td>
                      <td className="px-4 py-3">
                        {res.marks_obtained} / {res.total_marks}
                      </td>
                      <td className="px-4 py-3">{res.percentage}%</td>
                      <td className="px-4 py-3">{res.percentile != null ? res.percentile : "-"}</td>
                      <td className="px-4 py-3">
                        {res.is_pass ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Pass</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Fail</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {res.rank ? `#${res.rank}` : "-"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => setDeleteId(res.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No results published yet.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Admin / Faculty / Paper Checker Recheck Requests List */}
      {(isAdmin || isFaculty || isPaperChecker) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-white shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-heading font-semibold">Recheck Requests</h3>
            <Badge variant="secondary">{recheckRequests.length} Total</Badge>
          </div>
          <div className="p-0 overflow-x-auto">
            {recheckRequests.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Roll No</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Checkers</th>
                    <th className="px-4 py-3 font-medium">File</th>
                    {recheckRequests.some((r: any) => r.status === "approval_pending") && (
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recheckRequests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{req.student_name}</td>
                      <td className="px-4 py-3">{req.roll_number || "-"}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {req.status_display || req.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {req.new_checker_name ? `New: ${req.new_checker_name}` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {req.uploaded_marksheet_url ? (
                          <a href={req.uploaded_marksheet_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> View
                          </a>
                        ) : "-"}
                      </td>
                      {recheckRequests.some((r: any) => r.status === "approval_pending") && (
                        <td className="px-4 py-3 text-right">
                          {req.status === "approval_pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                setRecheckActionModal(req);
                                setRecheckActionForm({ action: "", reason: "", new_checker_id: "" });
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No recheck requests.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Student / Parent view — exam-taking info */}
      {(isStudent || isParent) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm space-y-6"
        >
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100 shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-heading font-semibold text-blue-900">Exam Information</h4>
              </div>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>This exam is taken on the mobile app. Open the mobile application to start.</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Results will be released <strong className="capitalize">{exam.result_release_mode}</strong> after submission.</span>
              </div>
              {isParent && (
                <div className="flex items-center gap-2 text-blue-600">
                  <span>👤 You are viewing this exam as a parent/guardian.</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              <div className="text-center rounded-lg bg-white/60 p-3 border border-blue-100">
                <div className="text-lg font-bold text-foreground">{exam.total_marks}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Marks</div>
              </div>
              <div className="text-center rounded-lg bg-white/60 p-3 border border-blue-100">
                <div className="text-lg font-bold text-foreground">{exam.pass_marks}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Pass Marks</div>
              </div>
              <div className="text-center rounded-lg bg-white/60 p-3 border border-blue-100">
                <div className="text-lg font-bold text-foreground">{exam.duration_minutes || "-"}m</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</div>
              </div>
            </div>
            
            <div className="mt-4 bg-white/60 p-4 rounded-lg border border-blue-100 space-y-2 text-sm text-blue-900">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <span className="text-muted-foreground">Subject</span>
                <span className="font-semibold text-right">{exam.subject_name || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-100 py-2">
                <span className="text-muted-foreground">Faculty</span>
                <span className="font-semibold text-right">{exam.faculty_name || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-blue-100 py-2">
                <span className="text-muted-foreground">Schedule</span>
                <span className="font-semibold text-right">
                  {exam.scheduled_date ? new Date(exam.scheduled_date).toLocaleDateString() : "N/A"} 
                  {exam.start_time && exam.end_time ? ` (${exam.start_time.slice(0,5)} - ${exam.end_time.slice(0,5)})` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Batch</span>
                <span className="font-semibold text-right">{exam.batch_name || "N/A"}</span>
              </div>
            </div>
          </div>
          
          {results.length > 0 && (
            <div className="pt-4 border-t border-blue-200">
              <h4 className="text-sm font-heading font-semibold text-blue-900 mb-3">Your Result</h4>
              {results.map((res: any) => (
                <div key={res.id} className="mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white/60 p-4 rounded-lg border border-blue-100">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Marks Obtained</span>
                      <span className="font-bold text-lg">{res.marks_obtained} / {res.total_marks}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Percentage</span>
                      <span className="font-bold text-lg">{res.percentage}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Percentile</span>
                      <span className="font-bold text-lg">{res.percentile != null ? res.percentile : "-"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                      <div className="mt-1">
                        {res.is_pass ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Pass</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Fail</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Rank</span>
                      <span className="font-bold text-lg">{res.rank ? `#${res.rank}` : "-"}</span>
                    </div>
                  </div>

                  {res.mcq_breakdown && res.mcq_breakdown.length > 0 && (
                    <div className="mt-4 bg-white/60 p-4 rounded-lg border border-blue-100">
                      <h5 className="text-sm font-semibold text-blue-900 mb-3">MCQ Breakdown</h5>
                      <div className="space-y-3">
                        {res.mcq_breakdown.map((mcq: any, index: number) => (
                          <div key={mcq.question_id || index} className="p-3 bg-white rounded-md border border-border shadow-sm">
                            <p className="text-sm font-medium mb-2">Q{index + 1}. {mcq.question_text}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Your Answer: </span>
                                <span className={mcq.is_student_correct ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                  {mcq.student_answer || "Not Answered"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Correct Answer: </span>
                                <span className="text-green-600 font-semibold">{mcq.correct_answer}</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-muted-foreground">Marks: </span>
                                <span className="font-semibold">{mcq.marks_awarded} / {mcq.question_marks}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {res.question_marks && Array.isArray(res.question_marks) && res.question_marks.length > 0 && (
                    <div className="mt-4 bg-white/60 p-4 rounded-lg border border-blue-100">
                      <h5 className="text-sm font-semibold text-blue-900 mb-3">Subjective Marks Breakdown</h5>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {res.question_marks
                           .slice()
                           .sort((a: any, b: any) => a.question_no - b.question_no)
                           .map((qm: any) => (
                             <div key={qm.question_no} className="p-3 bg-white rounded-md border border-border shadow-sm text-center">
                               <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Q {qm.question_no}</p>
                               <p className="text-lg font-semibold text-blue-700">{qm.obtained_marks}</p>
                             </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isStudent && results.length > 0 && (
            <div className="pt-4 border-t border-blue-200">
              {!(exam?.exam_mode === "online" && exam?.exam_type === "mcq") && (
               <div className="flex items-center justify-between">
                 <h4 className="text-sm font-heading font-semibold text-blue-900">Re-evaluation</h4>
                   <Button
                     variant="outline"
                     size="sm"
                     className="h-8 gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-100"
                     onClick={() => setRecheckModal(true)}
                   >
                     <HelpCircle className="w-3.5 h-3.5" />
                     Request Recheck
                   </Button>
               </div>
              )}
               {recheckRequests.length > 0 && (
                 <div className="mt-3 space-y-2">
                   {recheckRequests.map((req: any) => (
                     <div key={req.id} className="p-3 bg-white/60 rounded-lg border border-blue-100 text-sm flex justify-between items-center">
                       <div>
                         <span className="font-semibold text-blue-900">Status: </span>
                         <span className="capitalize">{req.status_display || req.status.replace("_", " ")}</span>
                       </div>
                       <div className="text-xs text-muted-foreground">
                         {new Date(req.created_at).toLocaleDateString()}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </motion.div>
      )}

      <ConfirmDialog
        open={distributeConfirm}
        onOpenChange={o => setDistributeConfirm(o)}
        title="Distribute Answer Key?"
        description="This will send a secure email with the answer key to all assigned paper checkers. This action cannot be undone."
        confirmLabel="Send Now"
        onConfirm={handleDistributeAnswerKey}
      />

      <ConfirmDialog
        open={publishConfirm}
        onOpenChange={o => setPublishConfirm(o)}
        title="Publish Results?"
        description="This will calculate and publish the final results for all students. They will be notified and can view their scores."
        confirmLabel="Publish"
        onConfirm={handlePublishResults}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={o => !o && setDeleteId(null)}
        title="Delete Result?"
        description="Are you sure you want to delete this result? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteResult}
      />

      {/* Submit Recheck Dialog (Student) */}
      <Dialog open={recheckModal} onOpenChange={setRecheckModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Request Recheck</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Reason for Recheck *</Label>
              <Textarea
                value={recheckForm.reason}
                onChange={(e) => setRecheckForm({ ...recheckForm, reason: e.target.value })}
                className="text-sm resize-none mt-1"
                rows={3}
                placeholder="Describe the discrepancy..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold flex items-center gap-2">
                Upload Marksheet <span className="text-muted-foreground font-normal">(Optional PDF/Image)</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setRecheckForm({ ...recheckForm, file: e.target.files?.[0] || null })}
                className="h-9 mt-1 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecheckModal(false)} disabled={recheckSubmitLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRecheck}
              disabled={recheckSubmitLoading || !recheckForm.reason}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {recheckSubmitLoading ? "Submitting…" : <><Upload className="w-4 h-4" /> Submit</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Recheck Dialog (Admin) */}
      <Dialog open={!!recheckActionModal} onOpenChange={(o) => !o && setRecheckActionModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Review Recheck Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm bg-muted/30 p-3 rounded-lg border border-border">
              <p><span className="font-semibold text-muted-foreground">Student:</span> {recheckActionModal?.student_name}</p>
              <p><span className="font-semibold text-muted-foreground">Reason:</span> {recheckActionModal?.reason}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Action *</Label>
              <Select
                value={recheckActionForm.action}
                onValueChange={(val) => setRecheckActionForm({ action: val, reason: "", new_checker_id: "" })}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve & Reassign</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recheckActionForm.action === "approve" && (
              <div>
                <Label className="text-xs font-semibold">Assign to New Checker *</Label>
                <Select
                  value={recheckActionForm.new_checker_id}
                  onValueChange={(val) => setRecheckActionForm({ ...recheckActionForm, new_checker_id: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue placeholder={checkersLoading ? "Loading checkers..." : "Select paper checker"} />
                  </SelectTrigger>
                  <SelectContent>
                    {checkers.length === 0 && !checkersLoading && (
                      <SelectItem value="none" disabled>No paper checkers found</SelectItem>
                    )}
                    {checkers.map(checker => (
                      <SelectItem key={checker.id} value={checker.id}>
                        {checker.name || checker.full_name || checker.first_name || checker.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {recheckActionForm.action === "reject" && (
              <div>
                <Label className="text-xs font-semibold">Reason for Rejection *</Label>
                <Textarea
                  value={recheckActionForm.reason}
                  onChange={(e) => setRecheckActionForm({ ...recheckActionForm, reason: e.target.value })}
                  className="text-sm resize-none mt-1"
                  rows={2}
                  placeholder="e.g. Insufficient evidence..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecheckActionModal(null)} disabled={recheckActionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleActionRecheck}
              disabled={recheckActionLoading || !recheckActionForm.action}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {recheckActionLoading ? "Processing…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
