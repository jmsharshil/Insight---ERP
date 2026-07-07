import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, CheckCircle2, Circle, X, FileText, Database, Search } from "lucide-react";
import { examActions, subjectAction } from "@/redux/actions";
import { API } from "@/service/api";
import { setQuestions, setQuestionsLoading, updateQuestion, removeQuestion } from "@/redux/slices/examSlice";
import type { Question } from "@/redux/slices/examSlice";
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

interface QuestionsTabProps { examId: string; }

// ─── New Question Builder (local state) ──────────────────────────────────────
const blankSubQuestion = () => ({
  question_text: "",
  marks: 1,
  order: 1,
  choices: [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ],
});

const blankQuestion = () => ({
  question_text: "",
  question_type: "mcq" as "mcq" | "paragraph_mcq",
  paragraph_text: "",
  marks: 1,
  order: 1,
  choices: [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ],
  sub_questions: [blankSubQuestion()],
});

type DraftQuestion = ReturnType<typeof blankQuestion>;

export default function QuestionsTab({ examId }: QuestionsTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { questions, questionsLoading, selectedExam, exams } = useSelector((s: RootState) => s.exams);
  const currentExam = selectedExam?.id === examId ? selectedExam : exams.find((e: any) => e.id === examId);

  const [addOpen, setAddOpen]           = useState(false);
  const [drafts, setDrafts]             = useState<DraftQuestion[]>([blankQuestion()]);
  const [addLoading, setAddLoading]     = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Question | null>(null);
  const [editLoading, setEditLoading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  // Import from Bank State
  const [importOpen, setImportOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const canManage = user && ["super_admin", "branch_manager", "admin", "faculty"].includes(user.role ?? "");
  const isPaperBased = currentExam?.exam_mode === "offline" || (currentExam?.exam_mode === "online" && currentExam?.exam_type === "subjective");

  const groupedQuestions = useMemo(() => {
    const groups: any[] = [];
    if (isPaperBased) return groups;
    questions.forEach(q => {
      if (q.question_type === "paragraph_mcq" && Array.isArray(q.questions)) {
        groups.push({ type: "paragraph", paragraph_text: q.paragraph_text, questions: q.questions, id: `para-${q.questions[0]?.id || Math.random()}` });
      } else if (q.question_type === "paragraph_mcq" && q.paragraph_text) {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup?.type === "paragraph" && lastGroup.paragraph_text === q.paragraph_text) {
          lastGroup.questions.push(q);
        } else {
          groups.push({ type: "paragraph", paragraph_text: q.paragraph_text, questions: [q], id: `para-${q.id}` });
        }
      } else {
        groups.push({ type: "single", question: q, id: `single-${q.id}` });
      }
    });
    return groups;
  }, [questions, isPaperBased]);

  const filteredBankQuestions = useMemo(() => {
    if (!searchTerm.trim()) return bankQuestions;
    const lower = searchTerm.toLowerCase();
    return bankQuestions.filter(q => 
      q.question_text?.toLowerCase().includes(lower) || 
      q.paragraph_text?.toLowerCase().includes(lower)
    );
  }, [bankQuestions, searchTerm]);

  const groupedBankQuestions = useMemo(() => {
    const groups: any[] = [];
    filteredBankQuestions.forEach(q => {
      if (q.question_type === "paragraph_mcq" && Array.isArray(q.questions)) {
        groups.push({ type: "paragraph", paragraph_text: q.paragraph_text, questions: q.questions, id: `para-bank-${q.questions[0]?.id || Math.random()}` });
      } else if (q.question_type === "paragraph_mcq" && q.paragraph_text) {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup?.type === "paragraph" && lastGroup.paragraph_text === q.paragraph_text) {
          lastGroup.questions.push(q);
        } else {
          groups.push({ type: "paragraph", paragraph_text: q.paragraph_text, questions: [q], id: `para-bank-${q.id}` });
        }
      } else {
        groups.push({ type: "single", question: q, id: `single-bank-${q.id}` });
      }
    });
    return groups;
  }, [filteredBankQuestions]);

  useEffect(() => {
    if (isPaperBased) return;
    dispatch({
      type: examActions.GET_QUESTIONS,
      method: "GET",
      endPoint: API.EXAMS.QUESTIONS(examId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setQuestionsLoading(v)),
      getResponse: (res: any) => {
        const data = res?.data ?? res?.results ?? (Array.isArray(res) ? res : []);
        dispatch(setQuestions(Array.isArray(data) ? data : []));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load questions"),
    });
  }, [examId, isPaperBased]);

  // ── Draft management ──────────────────────────────────────────────────────
  const updateDraft = (idx: number, field: keyof DraftQuestion, value: any) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };
  const updateChoice = (draftIdx: number, choiceIdx: number, field: "text" | "is_correct", value: any) => {
    setDrafts(prev => prev.map((d, i) => {
      if (i !== draftIdx) return d;
      const choices = d.choices.map((c, ci) => {
        if (field === "is_correct" && value === true) return { ...c, is_correct: ci === choiceIdx };
        if (ci === choiceIdx) return { ...c, [field]: value };
        return c;
      });
      return { ...d, choices };
    }));
  };

  const updateSubQuestion = (draftIdx: number, subIdx: number, field: keyof ReturnType<typeof blankSubQuestion>, value: any) => {
    setDrafts(prev => prev.map((d, i) => {
      if (i !== draftIdx) return d;
      const sub_questions = d.sub_questions.map((sq, si) => si === subIdx ? { ...sq, [field]: value } : sq);
      return { ...d, sub_questions };
    }));
  };
  const updateSubChoice = (draftIdx: number, subIdx: number, choiceIdx: number, field: "text" | "is_correct", value: any) => {
    setDrafts(prev => prev.map((d, i) => {
      if (i !== draftIdx) return d;
      const sub_questions = d.sub_questions.map((sq, si) => {
        if (si !== subIdx) return sq;
        const choices = sq.choices.map((c, ci) => {
          if (field === "is_correct" && value === true) return { ...c, is_correct: ci === choiceIdx };
          if (ci === choiceIdx) return { ...c, [field]: value };
          return c;
        });
        return { ...sq, choices };
      });
      return { ...d, sub_questions };
    }));
  };
  const addSubQuestion = (draftIdx: number) => {
    setDrafts(prev => prev.map((d, i) => i === draftIdx ? { ...d, sub_questions: [...d.sub_questions, { ...blankSubQuestion(), order: d.sub_questions.length + 1 }] } : d));
  };
  const removeSubQuestion = (draftIdx: number, subIdx: number) => {
    setDrafts(prev => prev.map((d, i) => i === draftIdx ? { ...d, sub_questions: d.sub_questions.filter((_, si) => si !== subIdx) } : d));
  };

  const addDraft    = () => setDrafts(prev => [...prev, { ...blankQuestion(), order: prev.length + 1 }]);
  const removeDraft = (idx: number) => setDrafts(prev => prev.filter((_, i) => i !== idx));

  const handleAddQuestions = () => {
    const payload = drafts.flatMap(d => {
      if (d.question_type === "paragraph_mcq") {
        return d.sub_questions.map(sq => ({
          question_text: sq.question_text,
          question_type: "paragraph_mcq",
          paragraph_text: d.paragraph_text,
          marks: Number(sq.marks),
          order: Number(sq.order),
          choices: sq.choices.filter(c => c.text.trim())
        }));
      }
      return [{
        question_text: d.question_text,
        question_type: d.question_type,
        marks: Number(d.marks),
        order: Number(d.order),
        choices: ["mcq"].includes(d.question_type) ? d.choices.filter(c => c.text.trim()) : [],
      }];
    });
    dispatch({
      type: examActions.ADD_QUESTIONS,
      method: "POST",
      endPoint: API.EXAMS.QUESTIONS(examId),
      body: payload,
      auth: true,
      setLoading: (v: boolean) => setAddLoading(v),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(`${drafts.length} question(s) added.`);
          setAddOpen(false);
          setDrafts([blankQuestion()]);
          // Refresh questions list
          dispatch({
            type: examActions.GET_QUESTIONS,
            method: "GET",
            endPoint: API.EXAMS.QUESTIONS(examId),
            auth: true,
            setLoading: (v: boolean) => dispatch(setQuestionsLoading(v)),
            getResponse: (res2: any) => {
              const data = res2?.data ?? (Array.isArray(res2) ? res2 : []);
              dispatch(setQuestions(Array.isArray(data) ? data : []));
            },
            getError: () => {},
          });
        } else toast.error("Failed to add questions.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add questions"),
    });
  };

  const handleUpdateQuestion = () => {
    if (!editTarget) return;
    dispatch({
      type: examActions.UPDATE_QUESTION,
      method: "PATCH",
      endPoint: API.EXAMS.QUESTION_DETAIL(examId, editTarget.id),
      body: {
        question_text: editTarget.question_text,
        question_type: editTarget.question_type,
        paragraph_text: editTarget.question_type === "paragraph_mcq" ? editTarget.paragraph_text : undefined,
        marks: Number(editTarget.marks),
        order: Number(editTarget.order),
        choices: ["mcq", "paragraph_mcq"].includes(editTarget.question_type) ? editTarget.choices : [],
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { dispatch(updateQuestion(res.data)); toast.success("Question updated."); setEditOpen(false); }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update question"),
    });
  };

  const handleDeleteQuestion = () => {
    if (!deleteTarget) return;
    dispatch({
      type: examActions.DELETE_QUESTION,
      method: "DELETE",
      endPoint: API.EXAMS.QUESTION_DETAIL(examId, deleteTarget.id),
      auth: true,
      getResponse: () => { dispatch(removeQuestion(deleteTarget.id)); toast.success("Question deleted."); setDeleteTarget(null); },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete question"),
    });
  };

  const openImportModal = () => {
    setImportOpen(true);
    const subId = typeof currentExam?.subject === 'object' && currentExam?.subject !== null 
      ? currentExam?.subject?.id 
      : (currentExam?.subject || currentExam?.subject_id);
    console.log("subId",subId);
    
    if (subId) {
      // Immediately fetch questions for this subject
      fetchBankQuestions(subId);
    } else {
      // Fetch subjects if not already fetched
      if (subjects.length === 0) {
        dispatch({
          type: subjectAction.GET_QUESTIONS,
          method: "GET",
          endPoint: API.SUBJECTS.QUESTIONS(subId),
          auth: true,
          getResponse: (res: any) => {
            const data = res?.data?.results || res?.results || res?.data || [];
            setBankQuestions(Array.isArray(data) ? data : []);
          },
        });
      }
    }
  };

  const fetchBankQuestions = (subId: string) => {
    setSelectedSubjectId(subId);
    setSelectedBankQuestionIds([]);
    setSearchTerm("");
    if (!subId) return;
    dispatch({
      type: subjectAction.GET_QUESTIONS,
      method: "GET",
      endPoint: API.SUBJECTS.QUESTIONS(subId),
      auth: true,
      setLoading: (v: boolean) => setBankLoading(v),
      getResponse: (res: any) => {
        console.log(res)
        // const data = res?.data?.results || res?.results || res?.data || [];
        setBankQuestions(Array.isArray(res) ? res : []);
      },
    });
  };

  const toggleBankQuestion = (qId: string) => {
    setSelectedBankQuestionIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleImport = () => {
    if (selectedBankQuestionIds.length === 0) return toast.error("Select at least one question.");
    dispatch({
      type: examActions.IMPORT_QUESTIONS,
      method: "POST",
      endPoint: API.EXAMS.IMPORT_QUESTIONS(examId),
      body: { question_ids: selectedBankQuestionIds },
      auth: true,
      setLoading: (v: boolean) => setImporting(v),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(res.message || "Questions imported successfully.");
          setImportOpen(false);
          setSelectedBankQuestionIds([]);
          // Refresh exam questions
          dispatch({
            type: examActions.GET_QUESTIONS,
            method: "GET",
            endPoint: API.EXAMS.QUESTIONS(examId),
            auth: true,
            setLoading: (v: boolean) => dispatch(setQuestionsLoading(v)),
            getResponse: (res2: any) => {
              const data = res2?.data ?? (Array.isArray(res2) ? res2 : []);
              dispatch(setQuestions(Array.isArray(data) ? data : []));
            }
          });
        } else {
          toast.error("Failed to import questions.");
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Import failed."),
    });
  };

  return (
    <div className="space-y-4">
      {!isPaperBased && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{questions.length} question(s) configured via API</p>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImportModal}
                className="h-9 text-sm gap-1.5 border-primary/20 text-primary hover:bg-primary/5">
                <Database className="w-3.5 h-3.5" /> Import from Bank
              </Button>
              <Button onClick={() => { setDrafts([blankQuestion()]); setAddOpen(true); }}
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Questions
              </Button>
            </div>
          )}
        </div>
      )}

      {currentExam?.selected_papers && currentExam.selected_papers.length > 0 && (
        <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl space-y-3 mb-4">
          <Label className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Attached Question Papers</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentExam.selected_papers.map((paper: any) => {
              const p = typeof paper === "string" ? { id: paper, set_name: `Paper ${paper.substring(0, 5)}...`, file: "#" } : paper;
              const fileUrl = p.file || p.file_url || "#";
              return (
                <a
                  key={p.id}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-white rounded border border-blue-100 hover:border-blue-300 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">{p.set_name || "Question Paper"}</p>
                    <p className="text-[10px] text-blue-600/70 truncate">{fileUrl !== "#" ? "View Document" : "ID Reference"}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {!isPaperBased && (
        questionsLoading ? <TableSkeleton rows={4} columns={4} /> : (
          <div className="space-y-3">
            {groupedQuestions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm bg-white rounded-xl border border-border">
                No questions yet. Click "Add Questions" to get started.
              </div>
            ) : groupedQuestions.map((group, i) => {
              if (group.type === "single") {
                const q = group.question;
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl border border-border bg-white p-4 flex items-start gap-4 group hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0">Q{q.order}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{q.question_text}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge className="text-[10px] capitalize bg-muted text-muted-foreground">{q.question_type}</Badge>
                            <span className="text-[10px] text-muted-foreground">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                          </div>
                          {["mcq"].includes(q.question_type) && q.choices?.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {q.choices.map((c: any, ci: number) => (
                                <div key={ci} className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${c.is_correct ? "bg-green-50 text-green-700" : "text-muted-foreground"}`}>
                                  {c.is_correct
                                    ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                    : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                                  <span>{c.choice_text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(q); setEditOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(q)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              }

              // Paragraph Group Render
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-white overflow-hidden shadow-sm"
                >
                  <div className="bg-muted/30 p-4 border-b border-border">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Comprehension Paragraph</Label>
                    <p className="text-sm italic text-foreground leading-relaxed">
                      {group.paragraph_text}
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    {group.questions.map((q: any) => (
                      <div key={q.id} className="flex items-start gap-4 group/sub hover:bg-muted/10 p-2 -mx-2 rounded transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0">Q{q.order}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug">{q.question_text}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge className="text-[10px] capitalize bg-muted text-muted-foreground">{q.question_type}</Badge>
                                <span className="text-[10px] text-muted-foreground">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                              </div>
                              {q.choices?.length > 0 && (
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {q.choices.map((c: any, ci: number) => (
                                    <div key={ci} className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${c.is_correct ? "bg-green-50 text-green-700" : "text-muted-foreground"}`}>
                                      {c.is_correct
                                        ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                        : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                                      <span>{c.choice_text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setEditTarget(q); setEditOpen(true); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setDeleteTarget(q)}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Add Questions Dialog */}
      <Dialog open={addOpen} onOpenChange={o => setAddOpen(o)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Questions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {drafts.map((draft, idx) => (
              <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Question {idx + 1}</span>
                  {drafts.length > 1 && (
                    <Button variant="ghost" size="icon" className="w-6 h-6 absolute top-3 right-3" onClick={() => removeDraft(idx)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {draft.question_type !== "paragraph_mcq" && (
                  <div>
                    <Label className="text-xs font-semibold">Question Text *</Label>
                    <Textarea
                      value={draft.question_text}
                      onChange={e => updateDraft(idx, "question_text", e.target.value)}
                      rows={2} className="text-sm resize-none mt-1"
                      placeholder="Enter the question..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Label className="text-xs font-semibold">Type</Label>
                    <Select value={draft.question_type} onValueChange={v => updateDraft(idx, "question_type", v)}>
                      <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">MCQ</SelectItem>
                        <SelectItem value="paragraph_mcq">Paragraph MCQ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {draft.question_type !== "paragraph_mcq" && (
                    <>
                      <div>
                        <Label className="text-xs font-semibold">Marks</Label>
                        <Input type="number" value={draft.marks} onChange={e => updateDraft(idx, "marks", e.target.value)} className="h-9 text-sm mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Order</Label>
                        <Input type="number" value={draft.order} onChange={e => updateDraft(idx, "order", e.target.value)} className="h-9 text-sm mt-1" />
                      </div>
                    </>
                  )}
                </div>

                {draft.question_type === "paragraph_mcq" ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">Paragraph Text *</Label>
                      <Textarea
                        value={draft.paragraph_text}
                        onChange={e => updateDraft(idx, "paragraph_text", e.target.value)}
                        rows={3} className="text-sm resize-none mt-1"
                        placeholder="Enter the paragraph for comprehension..."
                      />
                    </div>
                    <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border">
                      <Label className="text-xs font-bold text-foreground">Internal Questions</Label>
                      {draft.sub_questions?.map((sq, si) => (
                        <div key={si} className="relative bg-white rounded border border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">Sub-question {si + 1}</span>
                            {draft.sub_questions.length > 1 && (
                              <Button variant="ghost" size="icon" className="w-5 h-5 absolute top-2 right-2" onClick={() => removeSubQuestion(idx, si)}>
                                <X className="w-3 h-3 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Question Text *</Label>
                            <Input value={sq.question_text} onChange={e => updateSubQuestion(idx, si, "question_text", e.target.value)} className="h-8 text-sm mt-1" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-semibold">Marks</Label>
                              <Input type="number" value={sq.marks} onChange={e => updateSubQuestion(idx, si, "marks", e.target.value)} className="h-8 text-sm mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold">Order</Label>
                              <Input type="number" value={sq.order} onChange={e => updateSubQuestion(idx, si, "order", e.target.value)} className="h-8 text-sm mt-1" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Choices (click radio to mark correct)</Label>
                            {sq.choices.map((choice, ci) => (
                              <div key={ci} className="flex items-center gap-2">
                                <button type="button" onClick={() => updateSubChoice(idx, si, ci, "is_correct", true)}
                                  className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer
                                    ${choice.is_correct ? "bg-green-500 border-green-500" : "border-muted-foreground"}`} />
                                <Input
                                  value={choice.text}
                                  onChange={e => updateSubChoice(idx, si, ci, "text", e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + ci)}`}
                                  className="h-8 text-sm flex-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => addSubQuestion(idx)}>
                        <Plus className="w-3 h-3 mr-1" /> Add Sub-question
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {["mcq"].includes(draft.question_type) && (
                      <div className="space-y-2 mt-4">
                        <Label className="text-xs font-semibold">Choices (click radio to mark correct)</Label>
                        {draft.choices.slice(0, 4).map((choice, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <button type="button" onClick={() => updateChoice(idx, ci, "is_correct", true)}
                              className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer
                                ${choice.is_correct ? "bg-green-500 border-green-500" : "border-muted-foreground"}`} />
                            <Input
                              value={choice.text}
                              onChange={e => updateChoice(idx, ci, "text", e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + ci)}`}
                              className="h-8 text-sm flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            <Button variant="outline" className="w-full text-sm gap-1.5" onClick={addDraft}>
              <Plus className="w-3.5 h-3.5" /> Add Another Question
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
            <Button onClick={handleAddQuestions} disabled={addLoading || drafts.some(d => d.question_type === 'paragraph_mcq' ? (!d.paragraph_text.trim() || d.sub_questions.some(sq => !sq.question_text.trim())) : !d.question_text.trim())}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {addLoading ? "Saving…" : `Add ${drafts.length} Question${drafts.length > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Question</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold">Question Text</Label>
                <Textarea
                  value={editTarget.question_text}
                  onChange={e => setEditTarget(prev => prev ? { ...prev, question_text: e.target.value } : null)}
                  rows={3} className="text-sm resize-none mt-1"
                />
              </div>
              
              {editTarget.question_type === "paragraph_mcq" && (
                <div>
                  <Label className="text-xs font-semibold">Paragraph Text</Label>
                  <Textarea
                    value={editTarget.paragraph_text || ""}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, paragraph_text: e.target.value } : null)}
                    rows={3} className="text-sm resize-none mt-1"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Marks</Label>
                  <Input type="number" value={editTarget.marks}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, marks: Number(e.target.value) } : null)}
                    className="h-9 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Order</Label>
                  <Input type="number" value={editTarget.order}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, order: Number(e.target.value) } : null)}
                    className="h-9 text-sm mt-1" />
                </div>
              </div>
              {["mcq", "paragraph_mcq"].includes(editTarget.question_type) && editTarget.choices?.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setEditTarget(prev => prev ? {
                      ...prev, choices: prev.choices.map((ch, i) => ({ ...ch, is_correct: i === ci }))
                    } : null)}
                    className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer
                      ${c.is_correct ? "bg-green-500 border-green-500" : "border-muted-foreground"}`} />
                  <Input value={c.text}
                    onChange={e => setEditTarget(prev => prev ? {
                      ...prev, choices: prev.choices.map((ch, i) => i === ci ? { ...ch, text: e.target.value } : ch)
                    } : null)}
                    className="h-8 text-sm flex-1"
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdateQuestion} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete this question?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteQuestion}
      />

      {/* Import from Bank Dialog */}
      <Dialog open={importOpen} onOpenChange={o => setImportOpen(o)}>
        <DialogContent className="sm:max-w-6xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> Import Questions from Subject Bank
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2 overflow-hidden min-h-[300px]">
            {(() => {
              const subId = typeof currentExam?.subject === 'object' && currentExam?.subject !== null 
                ? currentExam?.subject?.id 
                : (currentExam?.subject || currentExam?.subject_id);

              if (subId) {
                return (
                  <div className="mb-2">
                    <Label className="text-xs font-semibold mb-1 block">Subject Bank</Label>
                    <div className="text-sm p-2 border rounded-md bg-muted/50 text-muted-foreground font-medium">
                      {currentExam?.subject_name || "Exam Subject"}
                    </div>
                  </div>
                );
              }
              
              return (
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Select Subject Bank</Label>
                  <Select value={selectedSubjectId} onValueChange={fetchBankQuestions}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name} {sub.code ? `(${sub.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions or paragraphs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-muted/5 border-border"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-muted/5 p-3 space-y-3">
              {!selectedSubjectId ? (
                <div className="text-center py-10 text-sm text-muted-foreground">Please select a subject to view its questions.</div>
              ) : bankLoading ? (
                <div className="text-center py-10 text-sm text-muted-foreground">Loading questions...</div>
              ) : bankQuestions.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">No questions found in this subject bank.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{bankQuestions.length} Available Questions</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" 
                      onClick={() => {
                        const allIds = groupedBankQuestions.flatMap(g => g.type === "single" ? [g.question.id] : g.questions.map((q: any) => q.id));
                        setSelectedBankQuestionIds(allIds);
                      }}>
                      Select All
                    </Button>
                  </div>
                  {groupedBankQuestions.map((group, i) => {
                    if (group.type === "single") {
                      const bq = group.question;
                      return (
                        <label key={bq.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBankQuestionIds.includes(bq.id) ? "bg-primary/5 border-primary/30" : "bg-white border-border hover:border-primary/20"}`}>
                          <div className="pt-0.5">
                            <input type="checkbox" className="rounded border-primary/50 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer" 
                              checked={selectedBankQuestionIds.includes(bq.id)}
                              onChange={() => toggleBankQuestion(bq.id)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{bq.question_text}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className="text-[9px] capitalize bg-muted text-muted-foreground">{bq.question_type.replace('_', ' ')}</Badge>
                              <span className="text-[9px] font-semibold text-muted-foreground">{bq.marks} Mark{bq.marks !== 1 ? "s" : ""}</span>
                            </div>
                            {["mcq", "true_false"].includes(bq.question_type) && bq.choices?.length > 0 && (
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {bq.choices.map((c: any, ci: number) => (
                                  <div key={ci} className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${c.is_correct ? "bg-green-50 text-green-700" : "text-muted-foreground"}`}>
                                    {c.is_correct
                                      ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                      : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                                    <span>{c.choice_text || c.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    }

                    // Paragraph Group Render
                    return (
                      <div key={group.id} className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
                        <div className="bg-indigo-50/50 p-4 border-b border-indigo-100">
                          <Label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 block flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Comprehension Paragraph
                          </Label>
                          <p className="text-sm text-foreground leading-relaxed">
                            {group.paragraph_text}
                          </p>
                        </div>
                        <div className="p-3 space-y-2 bg-muted/5">
                          {group.questions.map((q: any) => (
                            <label key={q.id} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${selectedBankQuestionIds.includes(q.id) ? "bg-primary/5 border-primary/30" : "bg-white border-border hover:border-primary/20"}`}>
                              <div className="pt-0.5">
                                <input type="checkbox" className="rounded border-primary/50 text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer" 
                                  checked={selectedBankQuestionIds.includes(q.id)}
                                  onChange={() => toggleBankQuestion(q.id)}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-snug">{q.question_text}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge className="text-[9px] capitalize bg-muted text-muted-foreground">{q.question_type.replace('_', ' ')}</Badge>
                                  <span className="text-[9px] font-semibold text-muted-foreground">{q.marks} Mark{q.marks !== 1 ? "s" : ""}</span>
                                </div>
                                {q.choices?.length > 0 && (
                                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                    {q.choices.map((c: any, ci: number) => (
                                      <div key={ci} className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${c.is_correct ? "bg-green-50 text-green-700" : "text-muted-foreground"}`}>
                                        {c.is_correct
                                          ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                          : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                                        <span>{c.choice_text || c.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || selectedBankQuestionIds.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]">
              {importing ? "Importing…" : `Import ${selectedBankQuestionIds.length} Question(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
