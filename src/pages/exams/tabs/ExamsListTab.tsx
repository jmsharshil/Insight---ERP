import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, Trash2, Pencil, Search, X, RefreshCw, Info, Calendar } from "lucide-react";
import { examActions, studentActions, dropdownActions, subjectAction } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setExams, setExamsLoading,
  updateExamInList, removeExam,
} from "@/redux/slices/examSlice";
import type { Exam } from "@/redux/slices/examSlice";
import type { RootState } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const EXAM_MODE_BADGE: Record<string, string> = {
  online:  "bg-blue-100 text-blue-700",
  offline: "bg-gray-100 text-gray-700",
};

const EXAM_TYPE_BADGE: Record<string, string> = {
  mcq:  "bg-blue-100 text-blue-700",
  subjective: "bg-purple-100 text-purple-700",
};

const RELEASE_BADGE: Record<string, string> = {
  instant: "bg-green-100 text-green-700",
  manual:  "bg-yellow-100 text-yellow-700",
};

interface ExamsListTabProps {
  onSelectExam: (exam: Exam) => void;
  selectedExamId: string | null;
  resolvedFacultyId?: string;
}

export default function ExamsListTab({ onSelectExam, selectedExamId, resolvedFacultyId = "" }: ExamsListTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { exams, examsLoading, examsCount } = useSelector((s: RootState) => s.exams);
  const { students } = useSelector((state: RootState) => state.students);

  const [selectedLinkedStudentId, setSelectedLinkedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.linked_students && user.linked_students.length > 0 && !selectedLinkedStudentId) {
      setSelectedLinkedStudentId(user.linked_students[0]);
    }
  }, [user?.linked_students, selectedLinkedStudentId]);

  const [search, setSearch]                 = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [examModeFilter, setExamModeFilter] = useState("");
  const [editOpen, setEditOpen]             = useState(false);
  const [editTarget, setEditTarget]         = useState<Exam | null>(null);
  const [editLoading, setEditLoading]       = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<Exam | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", instructions: "", total_marks: "", pass_marks: "",
    exam_type: "mcq", exam_mode: "offline", result_release_mode: "manual",
    selected_papers: [] as string[],
  });

  const [availablePapers, setAvailablePapers] = useState<any[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);

  const isAdmin   = user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");
  const isStudent = user?.role === "student";
  const isParent  = user?.role === "parent" || user?.role === "parents";
  const canEdit   = isAdmin;
  const canDelete = isAdmin;

  // Student details for filtering exams by batch
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  useEffect(() => {
    const targetStudentId = selectedLinkedStudentId || user?.linked_students?.[0] || user?.id;
    if ((isStudent || isParent) && targetStudentId) {
      setStudentDetailLoading(true);
      dispatch({
        type: studentActions.GET_STUDENT_DETAIL,
        method: "GET",
        endPoint: API.STUDENTS.GET(targetStudentId),
        auth: true,
        setLoading: (val: boolean) => setStudentDetailLoading(val),
        getResponse: (res: any) => {
          const data = res?.data ?? res;
          setStudentDetail(data);
          setStudentDetailLoading(false);
        },
        getError: () => {
          setStudentDetailLoading(false);
        },
      } as any);
    }
  }, [isStudent, isParent, selectedLinkedStudentId, user?.linked_students, user?.id, dispatch]);

  const studentBatchIds = useMemo(() => {
    if (!studentDetail) return new Set<string>();
    const ids = new Set<string>();
    
    const getBatchId = (b: any) => (typeof b === "object" && b !== null) ? b.id || b.batch_id : b;

    const currentBatchId = getBatchId(studentDetail.batch);
    if (currentBatchId) ids.add(String(currentBatchId));

    if (studentDetail.batch_history) {
      studentDetail.batch_history.forEach((bh: any) => {
        const bhId = getBatchId(bh.batch || bh.batch_id);
        if (bhId) ids.add(String(bhId));
      });
    }
    return ids;
  }, [studentDetail]);

  const fetchExams = () => {
    let endPoint = API.EXAMS.LIST;

    if (user?.role === "faculty") {
      // Use the resolved Faculty Profile UUID passed from ExamsPage
      if (resolvedFacultyId) {
        endPoint = `${API.EXAMS.LIST}?faculty=${resolvedFacultyId}&faculty_id=${resolvedFacultyId}`;
      }
      // else: no facultyId yet (still loading), fetch will retry via useEffect below
    } else if (user?.role === "branch_manager" && user?.branch) {
      endPoint = `${API.EXAMS.LIST}?branch_id=${user.branch}`;
    }

    dispatch({
      type: examActions.GET_EXAMS,
      method: "GET",
      endPoint: endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setExamsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          dispatch(setExams({ data, count: res.count ?? data.length }));
        } else toast.error("Failed to load exams.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading exams"),
    });
  };

  // Re-fetch when resolvedFacultyId arrives (async after faculty list loads)
  useEffect(() => {
    fetchExams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedFacultyId]);

  const openEdit = (exam: Exam) => {
    // We trigger fetching all subjects to extract their papers
    dispatch({
      type: subjectAction.GET_SUBJECTS,
      method: "GET",
      endPoint: API.SUBJECTS.CREATE,
      auth: true,
      setLoading: (v: boolean) => setPapersLoading(v),
      getResponse: (res: any) => {
        const subs = res?.data?.results || res?.results || res?.data || [];
        const allPapers: any[] = [];
        subs.forEach((s: any) => {
          if (s.papers && Array.isArray(s.papers)) {
            s.papers.forEach((p: any) => {
              allPapers.push({ ...p, subject_name: s.name, subject_id: s.id });
            });
          }
        });
        setAvailablePapers(allPapers);
      }
    } as any);

    setEditTarget(exam);
    setEditForm({
      title:               exam.title ?? "",
      instructions:        exam.instructions ?? "",
      total_marks:         String(exam.total_marks ?? ""),
      pass_marks:          String(exam.pass_marks ?? ""),
      exam_type:           exam.exam_type ?? "mcq",
      exam_mode:           exam.exam_mode ?? "offline",
      result_release_mode: exam.result_release_mode ?? "manual",
      selected_papers:     (exam.selected_papers || []).map((p: any) => typeof p === "string" ? p : p.id)
    });
    setEditOpen(true);
  };

  const togglePaper = (paperId: string) => {
    setEditForm(f => {
      const isSelected = f.selected_papers.includes(paperId);
      return {
        ...f,
        selected_papers: [paperId]
      };
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_EXAM,
      method: "PATCH",
      endPoint: API.EXAMS.DETAIL(editTarget.id),
      body: {
        ...editForm,
        result_release_mode: (editForm.exam_mode === "online" && editForm.exam_type === "mcq") ? "instant" : "manual",
        total_marks: Number(editForm.total_marks),
        pass_marks:  Number(editForm.pass_marks),
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(updateExamInList(res.data));
          toast.success("Exam updated.");
          setEditOpen(false);
        } else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update exam"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_EXAM,
      method: "DELETE",
      endPoint: API.EXAMS.DETAIL(deleteTarget.id),
      auth: true,
      getResponse: () => {
        dispatch(removeExam(deleteTarget.id));
        toast.success("Exam deleted.");
        setDeleteTarget(null);
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete exam"),
    });
  };

  const handleSchedule = () => {
    if (!scheduleTarget) return;
    // We can use GET or POST based on standard integration, let's use POST by default for triggers.
    dispatch({
      type: "SCHEDULE_EXAM",
      method: "POST",
      endPoint: API.EXAMS.SCHEDULE(scheduleTarget.id),
      auth: true,
      getResponse: (res: any) => {
        toast.success("Exam scheduled successfully.");
        setScheduleTarget(null);
        // refresh list if needed or let the server logic handle it
        fetchExams();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to schedule exam"),
    });
  };

  const filtered = exams.filter(e => {
    // Branch filter — apply only for branch_manager / admin who are tied to a specific branch
    if (user && ["branch_manager", "admin"].includes(user.role ?? "") && user.branch) {
      const branchId = typeof e.branch === "object" && e.branch !== null ? (e.branch as any).id : e.branch;
      if (branchId !== user.branch) return false;
    }
    if ((isStudent || isParent) && studentDetail) {
      const examBatchId = typeof e.batch === "object" && e.batch !== null ? (e.batch as any).id || (e.batch as any).batch_id : e.batch;
      if (examBatchId && !studentBatchIds.has(String(examBatchId))) {
        return false;
      }
    }
    if (user?.role === "faculty") {
      let isAssigned = false;
      try {
        const strExam = JSON.stringify(e).toLowerCase();
        
        // Match by Name (most reliable — faculty_name is always stored in the exam)
        if (user.name) {
          const uNameStr = String(user.name).trim().toLowerCase();
          if (uNameStr && strExam.includes(uNameStr)) {
            isAssigned = true;
          }
        }
        
        // Match by resolved Faculty Profile UUID (passed from ExamsPage)
        if (!isAssigned && resolvedFacultyId) {
          if (strExam.includes(resolvedFacultyId.toLowerCase())) {
            isAssigned = true;
          }
        }
        
        // Match by Auth user ID just in case
        if (!isAssigned && user.id) {
          const uIdStr = String(user.id).trim().toLowerCase();
          if (uIdStr && strExam.includes(uIdStr)) {
            isAssigned = true;
          }
        }
      } catch (err) {
        // Fallback
      }
      
      if (!isAssigned) {
        return false;
      }
    }
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchType   = !examTypeFilter || e.exam_type === examTypeFilter;
    const matchMode   = !examModeFilter || e.exam_mode === examModeFilter;
    return matchSearch && matchType && matchMode;
  });


  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {isParent && user?.linked_students && user.linked_students.length > 1 && (
          <Select value={selectedLinkedStudentId || ""} onValueChange={setSelectedLinkedStudentId}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="Select Student" />
            </SelectTrigger>
            <SelectContent>
              {user.linked_students.map((id) => {
                const stu = students?.find((s: any) => s.id === id);
                return (
                  <SelectItem key={id} value={id}>
                    {stu ? stu.full_name || stu.first_name : `Student (${id.slice(0, 4)})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={examModeFilter || "all"} onValueChange={v => setExamModeFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="All Modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        <Select value={examTypeFilter || "all"} onValueChange={v => setExamTypeFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mcq">MCQ</SelectItem>
            <SelectItem value="subjective">Subjective</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={() => { setSearch(""); setExamTypeFilter(""); setExamModeFilter(""); }}>
          <X className="w-3.5 h-3.5" /> Clear
        </Button>

        <Button variant="outline" className="h-9 text-sm gap-1.5" onClick={fetchExams}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Info banner for students/parents/faculty */}
      {(isStudent || isParent || user?.role === "faculty") && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs text-blue-700">
            {isStudent 
              ? "Showing your enrolled exams. Exam-taking is available on the mobile app." 
              : isParent 
                ? "Showing exams for your child. Exam-taking is available on the mobile app."
                : "Showing exams assigned to you."}
          </span>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {examsCount} exam(s) total · {filtered.length} shown
      </p>

      {examsLoading ? <TableSkeleton rows={5} columns={7} /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["Title", "Mode", "Type", "Marks", "Pass Marks", "Result Release", "Subject / Batch", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-muted-foreground text-sm">No exams found.</td></tr>
              ) : filtered.map((exam, i) => (
                <motion.tr
                  key={exam.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className={`border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors
                    ${selectedExamId === exam.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  onClick={() => onSelectExam(exam)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{exam.title}</div>
                    {exam.session_date && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {exam.session_date}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] capitalize font-semibold ${EXAM_MODE_BADGE[exam.exam_mode] ?? "bg-gray-100 text-gray-700"}`}>
                      {exam.exam_mode || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] capitalize font-semibold ${EXAM_TYPE_BADGE[exam.exam_type] ?? "bg-gray-100 text-gray-700"}`}>
                      {exam.exam_type || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">{exam.total_marks}</td>
                  <td className="px-4 py-3 text-xs font-mono">{exam.pass_marks}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] capitalize font-semibold ${RELEASE_BADGE[exam.result_release_mode] ?? "bg-gray-100 text-gray-700"}`}>
                      {exam.result_release_mode}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">{exam.subject_name ?? "—"}</div>
                    <div className="text-[10px] text-muted-foreground">{exam.batch_name ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="w-7 h-7" title="Schedule Exam" onClick={e => { e.stopPropagation(); setScheduleTarget(exam); }}>
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={e => { e.stopPropagation(); onSelectExam(exam); }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={e => { e.stopPropagation(); openEdit(exam); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={e => { e.stopPropagation(); setDeleteTarget(exam); }}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Exam Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Title *</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="h-9 text-sm mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Total Marks</Label>
                <Input type="number" value={editForm.total_marks} onChange={e => setEditForm(f => ({ ...f, total_marks: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Pass Marks</Label>
                <Input type="number" value={editForm.pass_marks} onChange={e => setEditForm(f => ({ ...f, pass_marks: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Exam Type</Label>
                <Select value={editForm.exam_type} onValueChange={v => setEditForm(f => ({ ...f, exam_type: v }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">MCQ</SelectItem>
                    <SelectItem value="subjective">Subjective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Exam Mode</Label>
                <Select value={editForm.exam_mode} onValueChange={v => setEditForm(f => ({ ...f, exam_mode: v }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Result Release</Label>
                <Select value={(editForm.exam_mode === "online" && editForm.exam_type === "mcq") ? "instant" : "manual"} onValueChange={v => setEditForm(f => ({ ...f, result_release_mode: v }))} disabled>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="instant">Instant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Link Subject Papers</Label>
              <div className="border border-border rounded-md p-2 h-40 overflow-y-auto bg-muted/10 space-y-2">
                {papersLoading ? (
                  <div className="text-center text-xs text-muted-foreground mt-4">Loading papers...</div>
                ) : availablePapers.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground mt-4">No papers available across subjects.</div>
                ) : (
                  availablePapers
                    .filter(p => {
                      const examSubjId = typeof editTarget?.subject === "object" ? editTarget?.subject?.id : editTarget?.subject;
                      return p.subject_id === examSubjId || p.subject === examSubjId || p.subject_name === editTarget?.subject_name;
                    })
                    .map(p => (
                    <label key={p.id} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-muted/30">
                      <Checkbox
                        checked={editForm.selected_papers.includes(p.id)}
                        onCheckedChange={() => togglePaper(p.id)}
                        className="mt-0.5"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{p.set_name}</span>
                        <span className="text-xs text-muted-foreground mt-1">Subject: {p.subject_name || p.subject || "—"}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Instructions</Label>
              <Textarea value={editForm.instructions} onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))} rows={3} className="text-sm resize-none mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently deletes the exam and all associated questions, seating, and malpractice reports."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!scheduleTarget}
        onOpenChange={o => !o && setScheduleTarget(null)}
        title={`Schedule "${scheduleTarget?.title}"?`}
        description="Are you sure you want to schedule this exam now? This action will generate the schedule."
        confirmLabel="Schedule"
        variant="default"
        onConfirm={handleSchedule}
      />
    </div>
  );
}
