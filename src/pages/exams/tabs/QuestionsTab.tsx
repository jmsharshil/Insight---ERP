import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, CheckCircle2, Circle, X } from "lucide-react";
import { examActions } from "@/redux/actions";
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
const blankQuestion = () => ({
  question_text: "",
  question_type: "mcq" as "mcq" | "subjective",
  marks: 1,
  order: 1,
  choices: [
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ],
});

type DraftQuestion = ReturnType<typeof blankQuestion>;

export default function QuestionsTab({ examId }: QuestionsTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  const { questions, questionsLoading } = useSelector((s: RootState) => s.exams);

  const [addOpen, setAddOpen]           = useState(false);
  const [drafts, setDrafts]             = useState<DraftQuestion[]>([blankQuestion()]);
  const [addLoading, setAddLoading]     = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Question | null>(null);
  const [editLoading, setEditLoading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const canManage = user && ["super_admin", "branch_manager", "admin", "faculty"].includes(user.role ?? "");

  useEffect(() => {
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
  }, [examId]);

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
  const addDraft    = () => setDrafts(prev => [...prev, { ...blankQuestion(), order: prev.length + 1 }]);
  const removeDraft = (idx: number) => setDrafts(prev => prev.filter((_, i) => i !== idx));

  const handleAddQuestions = () => {
    const payload = drafts.map(d => ({
      question_text: d.question_text,
      question_type: d.question_type,
      marks: Number(d.marks),
      order: Number(d.order),
      choices: d.question_type === "mcq" ? d.choices.filter(c => c.text.trim()) : [],
    }));
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
        marks: Number(editTarget.marks),
        order: Number(editTarget.order),
        choices: editTarget.choices,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{questions.length} question(s)</p>
        {canManage && (
          <Button onClick={() => { setDrafts([blankQuestion()]); setAddOpen(true); }}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Questions
          </Button>
        )}
      </div>

      {questionsLoading ? <TableSkeleton rows={4} columns={4} /> : (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm bg-white rounded-xl border border-border">
              No questions yet. Click "Add Questions" to get started.
            </div>
          ) : questions.map((q, i) => (
            <motion.div
              key={q.id}
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
                    {q.question_type === "mcq" && q.choices?.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {q.choices.map((c, ci) => (
                          <div key={ci} className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${c.is_correct ? "bg-green-50 text-green-700" : "text-muted-foreground"}`}>
                            {c.is_correct
                              ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                              : <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                            <span>{c.text}</span>
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
          ))}
        </div>
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

                <div>
                  <Label className="text-xs font-semibold">Question Text *</Label>
                  <Textarea
                    value={draft.question_text}
                    onChange={e => updateDraft(idx, "question_text", e.target.value)}
                    rows={2} className="text-sm resize-none mt-1"
                    placeholder="Enter the question..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Type</Label>
                    <Select value={draft.question_type} onValueChange={v => updateDraft(idx, "question_type", v)}>
                      <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">MCQ</SelectItem>
                        <SelectItem value="subjective">Subjective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Marks</Label>
                    <Input type="number" value={draft.marks} onChange={e => updateDraft(idx, "marks", e.target.value)} className="h-9 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Order</Label>
                    <Input type="number" value={draft.order} onChange={e => updateDraft(idx, "order", e.target.value)} className="h-9 text-sm mt-1" />
                  </div>
                </div>

                {draft.question_type === "mcq" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Choices (click radio to mark correct)</Label>
                    {draft.choices.map((choice, ci) => (
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
              </div>
            ))}

            <Button variant="outline" className="w-full text-sm gap-1.5" onClick={addDraft}>
              <Plus className="w-3.5 h-3.5" /> Add Another Question
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
            <Button onClick={handleAddQuestions} disabled={addLoading || drafts.some(d => !d.question_text.trim())}
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
              {editTarget.question_type === "mcq" && editTarget.choices?.map((c, ci) => (
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
    </div>
  );
}
