import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, CheckCircle2, Circle, X, ChevronLeft, Database, FileText } from "lucide-react";
import { subjectAction } from "@/redux/actions";
import { API } from "@/service/api";
import { setSubjectQuestions, setSubjectQuestionsLoading } from "@/redux/slices/levelsSlice";
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
import PageHeader from "@/components/layout/PageHeader";

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
  question_type: "mcq" as "mcq" | "subjective" | "paragraph_mcq" | "true_false",
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

export default function SubjectQuestionBankPage() {
  const { subjectId } = useParams<{ subjectId: string }>();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  
  const { subjectQuestions, subjectQuestionsLoading } = useSelector((s: RootState) => s.levels);

  const [addOpen, setAddOpen]           = useState(false);
  const [drafts, setDrafts]             = useState<DraftQuestion[]>([blankQuestion()]);
  const [addLoading, setAddLoading]     = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Question | null>(null);
  const [editLoading, setEditLoading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const canManage = user && ["super_admin", "branch_manager", "admin", "faculty"].includes(user.role ?? "");

  const groupedQuestions = useMemo(() => {
    const groups: any[] = [];
    subjectQuestions.forEach(q => {
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
  }, [subjectQuestions]);

  const fetchQuestions = () => {
    if (!subjectId) return;
    dispatch({
      type: subjectAction.GET_QUESTIONS,
      method: "GET",
      endPoint: API.SUBJECTS.QUESTIONS(subjectId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSubjectQuestionsLoading(v)),
      getResponse: (res: any) => {
        const data = res?.data ?? res?.results ?? (Array.isArray(res) ? res : []);
        dispatch(setSubjectQuestions(Array.isArray(data) ? data : []));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load questions"),
    });
  };

  useEffect(() => {
    fetchQuestions();
  }, [subjectId]);

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
    if (!subjectId) return;
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
        choices: ["mcq", "true_false"].includes(d.question_type) ? d.choices.filter(c => c.text.trim()) : [],
      }];
    });

    dispatch({
      type: subjectAction.ADD_QUESTIONS,
      method: "POST",
      endPoint: API.SUBJECTS.QUESTIONS(subjectId),
      body: payload,
      auth: true,
      setLoading: (v: boolean) => setAddLoading(v),
      getResponse: (res: any) => {
        if (res?.success) {
          toast.success(`${drafts.length} question(s) added.`);
          setAddOpen(false);
          setDrafts([blankQuestion()]);
          fetchQuestions();
        } else toast.error("Failed to add questions.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add questions"),
    });
  };

  const handleUpdateQuestion = () => {
    if (!editTarget || !subjectId) return;
    dispatch({
      type: subjectAction.UPDATE_QUESTION,
      method: "PATCH",
      endPoint: API.SUBJECTS.QUESTION_DETAIL(subjectId, editTarget.id),
      body: {
        question_text: editTarget.question_text,
        question_type: editTarget.question_type,
        paragraph_text: editTarget.question_type === "paragraph_mcq" ? editTarget.paragraph_text : undefined,
        marks: Number(editTarget.marks),
        order: Number(editTarget.order),
        choices: ["mcq", "paragraph_mcq", "true_false"].includes(editTarget.question_type) ? editTarget.choices : [],
      },
      auth: true,
      setLoading: (v: boolean) => setEditLoading(v),
      getResponse: (res: any) => {
        if (res?.data) { 
          toast.success("Question updated."); 
          setEditOpen(false);
          fetchQuestions();
        }
        else toast.error("Unexpected response.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update question"),
    });
  };

  const handleDeleteQuestion = () => {
    if (!deleteTarget || !subjectId) return;
    dispatch({
      type: subjectAction.DELETE_QUESTION,
      method: "DELETE",
      endPoint: API.SUBJECTS.QUESTION_DETAIL(subjectId, deleteTarget.id),
      auth: true,
      getResponse: () => { 
        toast.success("Question deleted."); 
        setDeleteTarget(null); 
        fetchQuestions();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete question"),
    });
  };

  return (
    <div className="mx-auto space-y-6">
      <PageHeader
        title="Subject Question Bank"
        subtitle="Manage reusable questions for this subject."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {canManage && (
              <Button onClick={() => { setDrafts([blankQuestion()]); setAddOpen(true); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                <Plus className="w-4 h-4" /> Add Questions
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Database className="w-4 h-4" /> {subjectQuestions.length} Total Question(s)
          </p>
        </div>

        {subjectQuestionsLoading ? <TableSkeleton rows={4} columns={4} /> : (
          <div className="space-y-4">
            {groupedQuestions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm bg-white rounded-xl border border-border shadow-sm">
                No questions found in this bank. Click "Add Questions" to get started.
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
                    className="rounded-xl border border-border bg-white p-5 flex items-start gap-4 group hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-muted-foreground mt-0.5 shrink-0">Q{q.order}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium leading-relaxed">{q.question_text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="text-[10px] uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">{q.question_type.replace('_', ' ')}</Badge>
                            <span className="text-xs font-semibold text-muted-foreground">{q.marks} Mark{q.marks !== 1 ? "s" : ""}</span>
                          </div>
                          {["mcq", "true_false"].includes(q.question_type) && q.choices?.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.choices.map((c: any, ci: number) => (
                                <div key={ci} className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 border ${c.is_correct ? "bg-green-50/50 border-green-200 text-green-800" : "bg-muted/10 border-border/50 text-muted-foreground"}`}>
                                  {c.is_correct
                                    ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                    : <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                                  <span>{c.text || c.choice_text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-primary/10 hover:text-primary" onClick={() => { setEditTarget(q); setEditOpen(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(q)}>
                          <Trash2 className="w-4 h-4" />
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
                  className="rounded-xl border border-border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-indigo-50/50 p-5 border-b border-indigo-100">
                    <Label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 block flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Comprehension Paragraph
                    </Label>
                    <p className="text-sm text-foreground leading-relaxed">
                      {group.paragraph_text}
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    {group.questions.map((q: any) => (
                      <div key={q.id} className="flex items-start gap-4 group/sub hover:bg-muted/30 p-3 rounded-lg transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-muted-foreground mt-0.5 shrink-0">Q{q.order}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-relaxed">{q.question_text}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="text-[10px] uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">{q.question_type.replace('_', ' ')}</Badge>
                                <span className="text-xs font-semibold text-muted-foreground">{q.marks} Mark{q.marks !== 1 ? "s" : ""}</span>
                              </div>
                              {q.choices?.length > 0 && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.choices.map((c: any, ci: number) => (
                                    <div key={ci} className={`flex items-center gap-2 text-xs rounded-md px-2 py-1.5 border ${c.is_correct ? "bg-green-50/50 border-green-200 text-green-800" : "bg-muted/10 border-border/50 text-muted-foreground"}`}>
                                      {c.is_correct
                                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                        : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />}
                                      <span>{c.text || c.choice_text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-primary/10 hover:text-primary" onClick={() => { setEditTarget(q); setEditOpen(true); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(q)}>
                              <Trash2 className="w-4 h-4" />
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
        )}
      </div>

      {/* Add Questions Dialog */}
      <Dialog open={addOpen} onOpenChange={o => setAddOpen(o)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Questions to Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {drafts.map((draft, idx) => (
              <div key={idx} className="relative rounded-lg border border-border bg-muted/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">Question {idx + 1}</span>
                  {drafts.length > 1 && (
                    <Button variant="ghost" size="icon" className="w-6 h-6 absolute top-3 right-3 text-muted-foreground hover:text-destructive" onClick={() => removeDraft(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {draft.question_type !== "paragraph_mcq" && (
                  <div>
                    <Label className="text-xs font-semibold">Question Text *</Label>
                    <Textarea
                      value={draft.question_text}
                      onChange={e => updateDraft(idx, "question_text", e.target.value)}
                      rows={2} className="text-sm resize-none mt-1 focus:ring-primary/20"
                      placeholder="Enter the question..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Label className="text-xs font-semibold">Type</Label>
                    <Select value={draft.question_type} onValueChange={v => updateDraft(idx, "question_type", v)}>
                      <SelectTrigger className="h-9 text-sm mt-1 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">MCQ</SelectItem>
                        <SelectItem value="paragraph_mcq">Paragraph MCQ</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {draft.question_type !== "paragraph_mcq" && (
                    <>
                      <div>
                        <Label className="text-xs font-semibold">Marks</Label>
                        <Input type="number" min="0" value={draft.marks} onChange={e => updateDraft(idx, "marks", e.target.value)} className="h-9 text-sm mt-1 focus:ring-primary/20" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Order</Label>
                        <Input type="number" min="0" value={draft.order} onChange={e => updateDraft(idx, "order", e.target.value)} className="h-9 text-sm mt-1 focus:ring-primary/20" />
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
                        rows={3} className="text-sm resize-none mt-1 focus:ring-primary/20"
                        placeholder="Enter the paragraph for comprehension..."
                      />
                    </div>
                    <div className="space-y-3 bg-white p-4 rounded-lg border border-border shadow-sm">
                      <Label className="text-xs font-bold text-primary uppercase tracking-wider block mb-2">Internal Questions</Label>
                      {draft.sub_questions?.map((sq, si) => (
                        <div key={si} className="relative bg-muted/10 rounded-md border border-border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Sub-question {si + 1}</span>
                            {draft.sub_questions.length > 1 && (
                              <Button variant="ghost" size="icon" className="w-5 h-5 absolute top-2 right-2 hover:bg-destructive/10 hover:text-destructive" onClick={() => removeSubQuestion(idx, si)}>
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Question Text *</Label>
                            <Input value={sq.question_text} onChange={e => updateSubQuestion(idx, si, "question_text", e.target.value)} className="h-8 text-sm mt-1 focus:ring-primary/20" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-semibold">Marks</Label>
                              <Input type="number" min="0" value={sq.marks} onChange={e => updateSubQuestion(idx, si, "marks", e.target.value)} className="h-8 text-sm mt-1 focus:ring-primary/20" />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold">Order</Label>
                              <Input type="number" min="0" value={sq.order} onChange={e => updateSubQuestion(idx, si, "order", e.target.value)} className="h-8 text-sm mt-1 focus:ring-primary/20" />
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
                                  className="h-8 text-sm flex-1 focus:ring-primary/20"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full text-xs mt-2" onClick={() => addSubQuestion(idx)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Sub-question
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {["mcq", "true_false"].includes(draft.question_type) && (
                      <div className="space-y-2 mt-4 bg-white p-4 rounded-lg border border-border shadow-sm">
                        <Label className="text-xs font-semibold block mb-2">Choices (click radio to mark correct)</Label>
                        {draft.choices.slice(0, draft.question_type === "true_false" ? 2 : 4).map((choice, ci) => (
                          <div key={ci} className="flex items-center gap-3">
                            <button type="button" onClick={() => updateChoice(idx, ci, "is_correct", true)}
                              className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer
                                ${choice.is_correct ? "bg-green-500 border-green-500" : "border-muted-foreground"}`} />
                            <Input
                              value={choice.text}
                              onChange={e => updateChoice(idx, ci, "text", e.target.value)}
                              placeholder={draft.question_type === "true_false" ? (ci === 0 ? "True" : "False") : `Option ${String.fromCharCode(65 + ci)}`}
                              className="h-9 text-sm flex-1 focus:ring-primary/20"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            <Button variant="outline" className="w-full text-sm gap-2 border-dashed h-12 text-primary hover:bg-primary/5" onClick={addDraft}>
              <Plus className="w-4 h-4" /> Add Another Question
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
            <Button onClick={handleAddQuestions} disabled={addLoading || drafts.some(d => d.question_type === 'paragraph_mcq' ? (!d.paragraph_text.trim() || d.sub_questions.some(sq => !sq.question_text.trim())) : !d.question_text.trim())}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]">
              {addLoading ? "Saving…" : `Save ${drafts.length} Question${drafts.length > 1 ? "s" : ""}`}
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
                  rows={3} className="text-sm resize-none mt-1 focus:ring-primary/20"
                />
              </div>
              
              {editTarget.question_type === "paragraph_mcq" && (
                <div>
                  <Label className="text-xs font-semibold">Paragraph Text</Label>
                  <Textarea
                    value={editTarget.paragraph_text || ""}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, paragraph_text: e.target.value } : null)}
                    rows={3} className="text-sm resize-none mt-1 focus:ring-primary/20"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Marks</Label>
                  <Input type="number" min="0" value={editTarget.marks}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, marks: Number(e.target.value) } : null)}
                    className="h-9 text-sm mt-1 focus:ring-primary/20" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Order</Label>
                  <Input type="number" min="0" value={editTarget.order}
                    onChange={e => setEditTarget(prev => prev ? { ...prev, order: Number(e.target.value) } : null)}
                    className="h-9 text-sm mt-1 focus:ring-primary/20" />
                </div>
              </div>
              {["mcq", "paragraph_mcq", "true_false"].includes(editTarget.question_type) && (
                <div className="space-y-2 mt-4 bg-muted/10 p-4 rounded-lg border border-border">
                  <Label className="text-xs font-semibold block mb-2">Choices</Label>
                  {editTarget.choices?.map((c, ci) => (
                    <div key={ci} className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => setEditTarget(prev => prev ? {
                          ...prev, choices: prev.choices.map((ch, i) => ({ ...ch, is_correct: i === ci }))
                        } : null)}
                        className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer
                          ${c.is_correct ? "bg-green-500 border-green-500" : "border-muted-foreground"}`} />
                      <Input value={c.text || c.choice_text}
                        onChange={e => setEditTarget(prev => prev ? {
                          ...prev, choices: prev.choices.map((ch, i) => i === ci ? { ...ch, text: e.target.value, choice_text: e.target.value } : ch)
                        } : null)}
                        className="h-8 text-sm flex-1 focus:ring-primary/20"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button onClick={handleUpdateQuestion} disabled={editLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]">
              {editLoading ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete this question?"
        description="This action cannot be undone. Are you sure you want to remove it from the bank?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteQuestion}
      />
    </div>
  );
}
