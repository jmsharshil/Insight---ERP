import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CheckCircle2, Award, Eye, FileText, ChevronRight } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DUMMY_EXAMS, DUMMY_RESULTS, EXAM_STATUS_META,
  type Exam, type ExamResult, type Question,
} from "@/constants/dummy/exams";
import { DUMMY_STUDENTS, BATCH_LIST } from "@/constants/dummy/students";
import { cn, formatDate } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export default function ExamsPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  useEffect(() => { setPageTitle("Exams"); }, [setPageTitle]);

  const [exams, setExams] = useState<Exam[]>(DUMMY_EXAMS);
  const [results, setResults] = useState<ExamResult[]>(DUMMY_RESULTS);
  const [createOpen, setCreateOpen] = useState(false);
  const [takeExam, setTakeExam] = useState<Exam | null>(null);
  const [publishConfirm, setPublishConfirm] = useState<Exam | null>(null);

  const role = user?.role;
  const isStudent = role === "student";
  const isChecker = role === "paper_checker";
  const isFaculty = role === "faculty";
  const canCreate = role && ["super_admin","branch_manager","admin_senior_exec","faculty"].includes(role);

  if (isStudent) return <StudentExamView exams={exams} results={results} setResults={setResults} takeExam={takeExam} setTakeExam={setTakeExam} />;
  if (isChecker) return <CheckerView exams={exams} />;

  const upcoming = exams.filter(e => e.status === "scheduled" || e.status === "ongoing");
  const recheckList = results.filter(r => r.recheckStatus && r.recheckStatus !== "none" && r.recheckStatus !== "resolved");

  function publishResults(e: Exam) {
    setExams(prev => prev.map(x => x.id === e.id ? { ...x, status: "result_published" } : x));
    toast.success(`Results published. Students notified.`);
    setPublishConfirm(null);
  }

  return (
    <div>
      <PageHeader
        title="Exam Management"
        subtitle="Schedule, evaluate and publish exam results."
        actions={canCreate ? (
          <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
            <Plus className="w-4 h-4" /> Create Exam
          </Button>
        ) : undefined}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard title="Upcoming" value={upcoming.length} icon={Clock} index={0} />
        <StatCard title="Completed" value={exams.filter(e => e.status === "completed" || e.status === "result_published").length} icon={CheckCircle2} index={1} />
        <StatCard title="Published" value={exams.filter(e => e.status === "result_published").length} icon={Award} trendType="up" index={2} />
        <StatCard title="Recheck Requests" value={recheckList.length} icon={FileText} trendType="warning" index={3} />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="recheck">Recheck Requests ({recheckList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((e, i) => {
              const meta = EXAM_STATUS_META[e.status];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -3 }}
                  className="rounded-xl bg-card border border-border p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-semibold text-sm">{e.title}</h3>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded uppercase", e.type === "online" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
                      {e.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{e.subject}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {e.batch.map(b => <span key={b} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{b}</span>)}
                  </div>
                  <div className="mt-3 text-xs flex items-center justify-between">
                    <span>{formatDate(e.scheduledDate)} · {e.startTime}</span>
                    <span className={cn("px-2 py-0.5 rounded font-medium", meta.bg, meta.color)}>{meta.label}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info(`Viewing ${e.id}`)}>View</Button>
                    {(e.status === "completed") && (
                      <Button size="sm" onClick={() => setPublishConfirm(e)} className="bg-primary hover:bg-primary-dark text-primary-foreground flex-1">
                        Publish
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="results">
          <ResultsSummary exams={exams} results={results} onPublish={setPublishConfirm} />
        </TabsContent>

        <TabsContent value="recheck">
          <DataTable<ExamResult>
            columns={[
              { key: "studentName", header: "Student" },
              { key: "examId", header: "Exam", render: (r) => DUMMY_EXAMS.find(e => e.id === r.examId)?.title ?? r.examId },
              { key: "marksObtained", header: "Marks", render: (r) => `${r.marksObtained}/${r.totalMarks}` },
              { key: "recheckStatus", header: "Status", render: (r) => <span className="capitalize text-xs">{r.recheckStatus}</span> },
              { key: "actions", header: "", render: (r) => (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => {
                    setResults(prev => prev.map(x => x.id === r.id ? { ...x, recheckStatus: "in_review" } : x));
                    toast.success("Assigned to checker.");
                  }}>Assign</Button>
                  <Button size="sm" onClick={() => {
                    setResults(prev => prev.map(x => x.id === r.id ? { ...x, recheckStatus: "resolved" } : x));
                    toast.success("Recheck resolved.");
                  }} className="bg-primary hover:bg-primary-dark text-primary-foreground">Resolve</Button>
                </div>
              ) },
            ]}
            data={recheckList}
            emptyTitle="No recheck requests"
          />
        </TabsContent>
      </Tabs>

      <CreateExamDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(e) => {
          setExams(prev => [{ ...e, id: `EXM-2024-${String(prev.length + 1).padStart(3, "0")}` }, ...prev]);
          toast.success(`Exam created. Students will be notified on publish.`);
          setCreateOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!publishConfirm}
        onOpenChange={(o) => !o && setPublishConfirm(null)}
        title="Publish results?"
        description="Students will be notified immediately."
        confirmLabel="Publish"
        onConfirm={() => publishConfirm && publishResults(publishConfirm)}
      />
    </div>
  );
}

/* ---------- Results summary ---------- */
function ResultsSummary({ exams, results, onPublish }: {
  exams: Exam[]; results: ExamResult[]; onPublish: (e: Exam) => void;
}) {
  const rows = exams
    .filter(e => e.status === "completed" || e.status === "result_published")
    .map(e => {
      const rs = results.filter(r => r.examId === e.id);
      const passed = rs.filter(r => r.status === "pass").length;
      const failed = rs.filter(r => r.status === "fail").length;
      const avg = rs.length ? Math.round(rs.reduce((a, r) => a + r.marksObtained, 0) / rs.length) : 0;
      const highest = rs.length ? Math.max(...rs.map(r => r.marksObtained)) : 0;
      const lowest = rs.length ? Math.min(...rs.map(r => r.marksObtained)) : 0;
      return { e, appeared: rs.length, passed, failed, avg, highest, lowest };
    });

  return (
    <div className="rounded-xl bg-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="bg-muted/40 text-left">
          <th className="p-3">Exam</th><th className="p-3">Batch</th>
          <th className="p-3">Appeared</th><th className="p-3">Passed</th>
          <th className="p-3">Failed</th><th className="p-3">Avg</th>
          <th className="p-3">High</th><th className="p-3">Low</th>
          <th className="p-3"></th>
        </tr></thead>
        <tbody>
          {rows.map(({ e, appeared, passed, failed, avg, highest, lowest }) => (
            <tr key={e.id} className="border-t border-border">
              <td className="p-3 font-medium">{e.title}</td>
              <td className="p-3 text-xs">{e.batch.join(", ")}</td>
              <td className="p-3">{appeared}</td>
              <td className="p-3 text-success">{passed}</td>
              <td className="p-3 text-destructive">{failed}</td>
              <td className="p-3">{avg}</td>
              <td className="p-3">{highest}</td>
              <td className="p-3">{lowest}</td>
              <td className="p-3">
                {e.status === "completed" && (
                  <Button size="sm" onClick={() => onPublish(e)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                    Publish
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Create Exam ---------- */
function CreateExamDialog({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (e: Exam) => void;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const [type, setType] = useState<"online" | "offline">("online");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Accountancy");
  const [batch, setBatch] = useState<string[]>([BATCH_LIST[0]]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(50);
  const [geoFenced, setGeoFenced] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => { if (!open) { setTitle(""); setDate(""); setQuestions([]); } }, [open]);

  function submit() {
    if (!title || !date) { toast.error("Please fix the errors before submitting."); return; }
    onCreate({
      id: "TEMP",
      title, type, subject, batch,
      scheduledDate: date, startTime: time, duration,
      totalMarks, passingMarks: Math.round(totalMarks * 0.4),
      status: "scheduled",
      createdBy: user?.name ?? "—",
      geoFenced: type === "online" ? geoFenced : false,
      questions: type === "online" ? questions : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Create Exam</DialogTitle>
          <DialogDescription>Configure exam details and questions.</DialogDescription>
        </DialogHeader>
        <Tabs value={type} onValueChange={(v) => setType(v as any)}>
          <TabsList><TabsTrigger value="online">Online</TabsTrigger><TabsTrigger value="offline">Offline</TabsTrigger></TabsList>
        </Tabs>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="col-span-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div>
          <div>
            <Label>Subject *</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["Accountancy","Economics","Business Law","Mathematics","Taxation"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Batch</Label>
            <Select value={batch[0]} onValueChange={(v) => setBatch([v])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{BATCH_LIST.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Date *</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" /></div>
          <div><Label>Start Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" /></div>
          <div><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(+e.target.value)} className="mt-1" /></div>
          <div><Label>Total Marks</Label><Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(+e.target.value)} className="mt-1" /></div>
          {type === "online" && (
            <div className="col-span-2 flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div><Label>Geo-Fenced</Label><p className="text-xs text-muted-foreground">Restrict to campus</p></div>
              <Switch checked={geoFenced} onCheckedChange={setGeoFenced} />
            </div>
          )}
        </div>

        {type === "online" && (
          <div>
            <div className="flex items-center justify-between mt-2">
              <h4 className="font-heading font-semibold text-sm">Questions ({questions.length})</h4>
              <Button size="sm" variant="outline" onClick={() => setQuestions(q => [...q, {
                id: `q${q.length + 1}`, text: "", options: ["", "", "", ""], correctIndex: 0, marks: 2,
              }])}>+ Add Question</Button>
            </div>
            <Accordion type="single" collapsible className="mt-2">
              {questions.map((q, qi) => (
                <AccordionItem key={q.id} value={q.id}>
                  <AccordionTrigger className="text-sm">Q{qi + 1}: {q.text || "(untitled)"}</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <Input value={q.text} placeholder="Question text" onChange={(e) => {
                      const v = e.target.value;
                      setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, text: v } : x));
                    }} />
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex gap-2 items-center">
                        <input type="radio" checked={q.correctIndex === oi} onChange={() => {
                          setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, correctIndex: oi } : x));
                        }} />
                        <Input value={o} placeholder={`Option ${oi + 1}`} onChange={(e) => {
                          const v = e.target.value;
                          setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, options: x.options.map((y, i) => i === oi ? v : y) } : x));
                        }} />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} className="bg-primary hover:bg-primary-dark text-primary-foreground">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Student Exam View ---------- */
function StudentExamView({ exams, results, setResults, takeExam, setTakeExam }: {
  exams: Exam[]; results: ExamResult[];
  setResults: React.Dispatch<React.SetStateAction<ExamResult[]>>;
  takeExam: Exam | null;
  setTakeExam: (e: Exam | null) => void;
}) {
  const toast = useToast();
  const me = DUMMY_STUDENTS[0];
  const myResults = results.filter(r => r.studentId === me.id);
  const upcoming = exams.filter(e => e.status === "scheduled" || e.status === "ongoing");
  const submittedIds = new Set(myResults.map(r => r.examId));

  return (
    <div>
      <PageHeader title="My Exams" subtitle={`Hello ${me.name}`} />
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="results">My Results</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-2">
          {upcoming.length === 0 && <EmptyState icon={BookOpen} title="No upcoming exams" />}
          {upcoming.map(e => {
            const submitted = submittedIds.has(e.id);
            const live = e.status === "ongoing";
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card border border-border p-4 flex items-center gap-3"
              >
                <div className="flex-1">
                  <p className="font-heading font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.subject} · {formatDate(e.scheduledDate)} {e.startTime} · {e.duration} min</p>
                </div>
                {live && !submitted && e.type === "online" && (
                  <Button onClick={() => setTakeExam(e)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                    Take Exam
                  </Button>
                )}
                {submitted && <span className="text-xs text-success">Submitted ✓</span>}
                {!live && <span className="text-xs text-muted-foreground">Starts {formatDate(e.scheduledDate)}</span>}
              </motion.div>
            );
          })}
        </TabsContent>
        <TabsContent value="results">
          <DataTable<ExamResult>
            columns={[
              { key: "examId", header: "Exam", render: (r) => exams.find(e => e.id === r.examId)?.title },
              { key: "marksObtained", header: "Score", render: (r) => `${r.marksObtained}/${r.totalMarks}` },
              { key: "percentage", header: "%", render: (r) => `${r.percentage}%` },
              { key: "percentile", header: "%ile" },
              { key: "status", header: "Result", render: (r) => (
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                  r.status === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {r.status.toUpperCase()}
                </span>
              ) },
            ]}
            data={myResults}
            emptyTitle="No results yet"
          />
        </TabsContent>
      </Tabs>

      {takeExam && (
        <TakeExamModal
          exam={takeExam}
          onClose={() => setTakeExam(null)}
          onSubmit={(score) => {
            setResults(prev => [...prev, {
              id: `RES-${Date.now()}`, examId: takeExam.id, studentId: me.id, studentName: me.name,
              marksObtained: score, totalMarks: takeExam.totalMarks,
              percentage: Math.round((score / takeExam.totalMarks) * 100),
              percentile: 50 + Math.floor(Math.random() * 40),
              status: score >= takeExam.passingMarks ? "pass" : "fail",
              recheckStatus: "none",
              submittedAt: new Date().toISOString(),
            }]);
            toast.success("Exam submitted! Results coming soon.");
            setTakeExam(null);
          }}
        />
      )}
    </div>
  );
}

function TakeExamModal({ exam, onClose, onSubmit }: { exam: Exam; onClose: () => void; onSubmit: (score: number) => void }) {
  const qs = exam.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [time, setTime] = useState(exam.duration * 60);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(time / 60), secs = time % 60;
  const q = qs[idx];

  function compute() {
    let score = 0;
    qs.forEach(q => { if (answers[q.id] === q.correctIndex) score += q.marks; });
    return score;
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-heading">{exam.title}</DialogTitle>
            <span className={cn("font-mono text-xl font-bold px-3 py-1 rounded", time < 300 ? "bg-red-100 text-red-700 animate-pulse" : "bg-muted")}>
              {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
            </span>
          </div>
          <DialogDescription>Question {idx + 1} of {qs.length}</DialogDescription>
        </DialogHeader>

        {q && (
          <motion.div key={q.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <p className="font-medium">{q.text}</p>
            <div className="mt-3 space-y-2">
              {q.options.map((o, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 text-sm transition-all",
                    answers[q.id] === oi ? "border-primary bg-primary-light" : "border-border hover:bg-muted/40",
                  )}
                >
                  {String.fromCharCode(65 + oi)}. {o}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="text-xs text-success">Saved ✓</div>

        <div className="grid grid-cols-10 gap-1 mt-2">
          {qs.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setIdx(i)}
              className={cn(
                "h-8 rounded text-xs font-medium",
                i === idx ? "bg-primary text-black" :
                answers[qq.id] != null ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
              )}
            >{i + 1}</button>
          ))}
        </div>

        <DialogFooter className="!justify-between">
          <div className="flex gap-2">
            <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>Previous</Button>
            <Button variant="outline" disabled={idx === qs.length - 1} onClick={() => setIdx(i => i + 1)}>Next</Button>
          </div>
          <Button onClick={() => setConfirm(true)} className="bg-primary hover:bg-primary-dark text-primary-foreground">Submit</Button>
        </DialogFooter>

        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Submit exam?"
          description="You cannot make changes after submission."
          confirmLabel="Submit"
          onConfirm={() => onSubmit(compute())}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Paper Checker view ---------- */
function CheckerView({ exams }: { exams: Exam[] }) {
  const toast = useToast();
  const { user } = useAuth();
  const myExams = exams.filter(e => e.assignedCheckers?.includes(user?.id ?? ""));
  const [marking, setMarking] = useState<{ exam: Exam; studentId: string } | null>(null);

  return (
    <div>
      <PageHeader title="My Paper Checking" subtitle="Assigned papers awaiting evaluation." />
      <div className="space-y-3">
        {myExams.length === 0 && <EmptyState icon={FileText} title="No papers assigned" />}
        {myExams.map(e => {
          const totalStudents = DUMMY_STUDENTS.length;
          const done = Math.floor(totalStudents * 0.4);
          const pct = Math.round((done / totalStudents) * 100);
          return (
            <div key={e.id} className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">{e.subject} · {e.batch.join(", ")}</p>
                </div>
                <span className="text-xs">{done} / {totalStudents} checked</span>
              </div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-primary" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {DUMMY_STUDENTS.slice(0, 5).map(s => (
                  <Button key={s.id} size="sm" variant="outline"
                    onClick={() => setMarking({ exam: e, studentId: s.id })}>
                    {s.name.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {marking && (
        <MarksDialog
          exam={marking.exam}
          student={DUMMY_STUDENTS.find(s => s.id === marking.studentId)!}
          onClose={() => setMarking(null)}
          onSubmit={(marks) => {
            toast.success(`Marks submitted for ${DUMMY_STUDENTS.find(s => s.id === marking.studentId)?.name}.`);
            setMarking(null);
          }}
        />
      )}
    </div>
  );
}

function MarksDialog({ exam, student, onClose, onSubmit }: {
  exam: Exam; student: typeof DUMMY_STUDENTS[0]; onClose: () => void; onSubmit: (m: number) => void;
}) {
  const [marks, setMarks] = useState("");
  const [remarks, setRemarks] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Enter Marks — {student.name}</DialogTitle>
          <DialogDescription>{exam.title} · Total {exam.totalMarks}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Marks Obtained *</Label><Input type="number" max={exam.totalMarks} value={marks} onChange={(e) => setMarks(e.target.value)} className="mt-1" /></div>
          <div><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="mt-1" /></div>
          <div className="rounded-lg border-2 border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Upload wrong-answer query (UI only)
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(Number(marks))} className="bg-primary hover:bg-primary-dark text-primary-foreground">Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
