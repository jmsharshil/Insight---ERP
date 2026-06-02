import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Phone, Mail, MapPin, Droplet, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";
import { DUMMY_STUDENTS, STUDENT_STATUS_META } from "@/constants/dummy/students";
import { DUMMY_ATTENDANCE, ATT_STATUS_META } from "@/constants/dummy/attendance";
import { DUMMY_FEE_TXNS, FEE_STATUS_META } from "@/constants/dummy/fees";
import { DUMMY_RESULTS, DUMMY_EXAMS } from "@/constants/dummy/exams";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import EmptyState from "@/components/common/EmptyState";
import { FileSearch } from "lucide-react";

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { setPageTitle } = useUI();

  const student = useMemo(() => DUMMY_STUDENTS.find(s => s.id === id), [id]);
  useEffect(() => { setPageTitle(student ? student.name : "Student"); }, [student, setPageTitle]);

  const myAtt = useMemo(() => DUMMY_ATTENDANCE.filter(a => a.studentId === id), [id]);
  const myFees = useMemo(() => DUMMY_FEE_TXNS.filter(t => t.studentId === id), [id]);
  const myResults = useMemo(() => DUMMY_RESULTS.filter(r => r.studentId === id), [id]);

  if (!student) {
    return (
      <div>
        <Button variant="ghost" onClick={() => navigate("/students")}><ArrowLeft className="w-4 h-4" /> Back</Button>
        <EmptyState icon={FileSearch} title="Student not found" />
      </div>
    );
  }

  const statusMeta = STUDENT_STATUS_META[student.status];
  const outstanding = student.feeTotal - student.feePaid;

  // 30-day attendance bins
  const attMap = new Map(myAtt.map(a => [a.date, a]));
  const last30: { date: string; status: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last30.push({ date: key, status: attMap.get(key)?.status ?? "—" });
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate("/students")} className="mb-3 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card border border-border p-5 mb-4 flex flex-wrap gap-4 items-center"
      >
        <div className="w-20 h-20 rounded-full bg-primary-light text-primary-dark grid place-items-center text-2xl font-bold">
          {student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="font-heading text-2xl font-bold">{student.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{student.admissionNumber}</p>
          <div className="flex gap-2 mt-2">
            <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", statusMeta.bg, statusMeta.color)}>
              {statusMeta.label}
            </span>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {student.course} · {student.batch}
            </span>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="digital-id">Digital ID</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card title="Personal Details">
              <Row icon={<Phone className="w-4 h-4" />} label="Phone" value={student.phone} />
              <Row icon={<Mail className="w-4 h-4" />} label="Email" value={student.email} />
              <Row icon={<Calendar className="w-4 h-4" />} label="DOB" value={formatDate(student.dob)} />
              <Row icon={<Droplet className="w-4 h-4" />} label="Blood Group" value={student.bloodGroup} />
              <Row icon={<MapPin className="w-4 h-4" />} label="Address" value={student.address} />
            </Card>
            <Card title="Guardian & Inventory">
              <Row label="Guardian Name" value={student.guardianName} />
              <Row label="Guardian Phone" value={student.guardianPhone} />
              <Row label="Linked Parent" value={student.linkedParentId ? `Yes (${student.linkedParentId})` : "—"} />
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Inventory Issued</p>
                <p className="text-sm">{student.inventory.uniforms} uniforms · {student.inventory.books.join(", ")}</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Present" value={myAtt.filter(a => a.status === "present").length} color="text-green-700" />
            <Stat label="Absent" value={myAtt.filter(a => a.status === "absent").length} color="text-red-700" />
            <Stat label="Late" value={myAtt.filter(a => a.status === "late").length} color="text-amber-700" />
          </div>
          <Card title="Last 30 Days">
            <div className="grid grid-cols-10 gap-1.5">
              {last30.map((d, i) => {
                const m = d.status !== "—" ? ATT_STATUS_META[d.status as keyof typeof ATT_STATUS_META] : null;
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.status}`}
                    className={cn(
                      "h-9 rounded text-[10px] grid place-items-center font-medium",
                      m ? m.bg : "bg-muted",
                      m ? m.color : "text-muted-foreground",
                    )}
                  >
                    {new Date(d.date).getDate()}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total Fee" value={formatCurrency(student.feeTotal)} />
            <Stat label="Paid" value={formatCurrency(student.feePaid)} color="text-green-700" />
            <Stat label="Outstanding" value={formatCurrency(outstanding)} color={outstanding > 0 ? "text-red-700" : "text-success"} />
          </div>
          <Card title="Payment History">
            {myFees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead><TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead><TableHead>Status</TableHead>
                    <TableHead>Date</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myFees.map(t => {
                    const m = FEE_STATUS_META[t.status];
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell>{formatCurrency(t.amount)}</TableCell>
                        <TableCell className="uppercase text-xs">{t.paymentMode}</TableCell>
                        <TableCell><span className={cn("px-2 py-0.5 rounded text-xs", m.bg, m.color)}>{m.label}</span></TableCell>
                        <TableCell>{formatDate(t.submittedAt)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => toast.info("Receipt download started.")}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="exams">
          <Card title="Exam Results">
            {myResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results yet.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Subject</TableHead><TableHead>Type</TableHead>
                  <TableHead>Score</TableHead><TableHead>%ile</TableHead>
                  <TableHead>Result</TableHead><TableHead>Recheck</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {myResults.map(r => {
                    const e = DUMMY_EXAMS.find(x => x.id === r.examId);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{e?.subject}</TableCell>
                        <TableCell className="uppercase text-xs">{e?.type}</TableCell>
                        <TableCell>{r.marksObtained} / {r.totalMarks}</TableCell>
                        <TableCell>{r.percentile}</TableCell>
                        <TableCell>
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                            r.status === "pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {r.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize text-xs">{r.recheckStatus ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="digital-id">
          <motion.div
            initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border border-border"
          >
            <div className="bg-navy text-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Insight Institute</p>
                <p className="font-heading font-bold">Student ID</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary grid place-items-center font-bold text-navy">II</div>
            </div>
            <div className="bg-white p-5 flex gap-4">
              <div className="w-24 h-24 rounded-lg bg-primary-light text-primary-dark grid place-items-center text-2xl font-bold">
                {student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="text-sm">
                <p className="font-bold text-base">{student.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{student.admissionNumber}</p>
                <p className="mt-1">{student.course}</p>
                <p className="text-xs text-muted-foreground">{student.batch}</p>
                <p className="text-xs mt-2">Valid until: {student.digitalId.validUntil}</p>
              </div>
            </div>
            <div className="bg-muted/30 p-4 flex items-center justify-between">
              <div className="w-16 h-16 bg-white border border-border rounded grid place-items-center text-[8px] text-center font-mono">
                {student.digitalId.qrCode}
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.success("Digital ID download started.")}>
                <Download className="w-3.5 h-3.5" /> Download ID
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h3 className="font-heading font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-muted-foreground w-32">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-heading font-bold mt-1", color)}>{value}</p>
    </div>
  );
}
