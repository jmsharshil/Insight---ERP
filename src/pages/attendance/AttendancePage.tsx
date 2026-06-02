import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, ScanLine, Users, Calendar as CalIcon,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip,
} from "recharts";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DUMMY_ATTENDANCE, ATT_STATUS_META, type AttendanceRecord, type AttStatus,
} from "@/constants/dummy/attendance";
import { DUMMY_STUDENTS, BATCH_LIST } from "@/constants/dummy/students";
import { cn, formatDate } from "@/lib/utils";

export default function AttendancePage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  useEffect(() => { setPageTitle("Attendance"); }, [setPageTitle]);

  const [records, setRecords] = useState<AttendanceRecord[]>(DUMMY_ATTENDANCE);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchFilter, setBatchFilter] = useState("all");
  const [scanOpen, setScanOpen] = useState(false);
  const [override, setOverride] = useState<AttendanceRecord | null>(null);
  const [violation, setViolation] = useState<AttendanceRecord | null>(null);
  const [studentSel, setStudentSel] = useState<string>(DUMMY_STUDENTS[0].id);

  const isStudent = user?.role === "student";
  const isParent = user?.role === "parent";
  const canModify = user && ["super_admin","branch_manager","admin_senior_exec","admin_exec"].includes(user.role);

  // For student/parent we narrow to their own records
  const ownStudent = isStudent || isParent ? DUMMY_STUDENTS[0] : null;
  const baseRecords = useMemo(() => {
    if (ownStudent) return records.filter(r => r.studentId === ownStudent.id);
    return records;
  }, [records, ownStudent]);

  const today = useMemo(
    () => baseRecords.filter(r => r.date === date && (batchFilter === "all" || r.batch === batchFilter)),
    [baseRecords, date, batchFilter],
  );

  const stats = useMemo(() => {
    const by = (s: AttStatus) => today.filter(r => r.status === s).length;
    const pct = today.length ? Math.round((by("present") + by("late") + by("half-day")) / today.length * 100) : 0;
    return { present: by("present"), absent: by("absent"), late: by("late"), pct };
  }, [today]);

  function recordScan(studentId: string, type: "in" | "out") {
    const s = DUMMY_STUDENTS.find(x => x.id === studentId)!;
    const nowH = new Date().getHours();
    const nowM = new Date().getMinutes();
    const time = `${String(nowH).padStart(2,"0")}:${String(nowM).padStart(2,"0")}`;
    const isLate = type === "in" && (nowH > 9 || (nowH === 9 && nowM > 15));
    const existing = records.find(r => r.studentId === studentId && r.date === date);

    if (existing) {
      setRecords(prev => prev.map(r => r.id === existing.id ? {
        ...r,
        [type === "in" ? "checkIn" : "checkOut"]: time,
        status: type === "in" ? (isLate ? "late" : "present") : r.status,
      } : r));
    } else {
      setRecords(prev => [{
        id: `ATT-${Date.now()}`,
        studentId: s.id, studentName: s.name, batch: s.batch,
        date,
        checkIn: type === "in" ? time : undefined,
        checkOut: type === "out" ? time : undefined,
        status: type === "in" ? (isLate ? "late" : "present") : "present",
        scanType: "qr", deviceId: "GATE-01",
      }, ...prev]);
    }
    toast.success(`✅ Check-${type} recorded for ${s.name} at ${time}`);
    if (isLate) toast.warning(`Late mark logged. Parent will be notified.`);
    setScanOpen(false);
  }

  // Monthly attendance %
  const monthStart = new Date(date); monthStart.setDate(1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthCells = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(monthStart); d.setDate(i + 1);
    const k = d.toISOString().slice(0, 10);
    const rec = baseRecords.filter(r => r.date === k);
    const present = rec.filter(r => r.status !== "absent").length;
    const pct = rec.length ? Math.round((present / rec.length) * 100) : null;
    return { day: i + 1, date: k, pct };
  });

  // Student report
  const studentScope = ownStudent ? ownStudent : DUMMY_STUDENTS.find(s => s.id === studentSel)!;
  const last30 = useMemo(() => {
    const out: { date: string; pct: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      const rec = records.find(r => r.studentId === studentScope.id && r.date === k);
      out.push({
        date: k.slice(5),
        pct: !rec ? 0 : rec.status === "present" ? 100 : rec.status === "late" ? 75 : rec.status === "half-day" ? 50 : 0,
      });
    }
    return out;
  }, [records, studentScope.id]);

  const delayAlerts = records.filter(r => r.violation);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={ownStudent ? `Showing attendance for ${ownStudent.name}` : "Track and manage daily attendance."}
        actions={
          canModify ? (
            <Button onClick={() => setScanOpen(true)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
              <ScanLine className="w-4 h-4" /> Simulate QR Scan
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40 bg-card" />
        {!ownStudent && (
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {BATCH_LIST.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Present" value={stats.present} icon={CheckCircle2} trendType="up" index={0} />
        <StatCard title="Absent" value={stats.absent} icon={XCircle} trendType="down" index={1} />
        <StatCard title="Late" value={stats.late} icon={Clock} trendType="warning" index={2} />
        <StatCard title="Attendance %" value={`${stats.pct}%`} icon={Users} index={3} />
      </div>

      <Tabs defaultValue={ownStudent ? "report" : "today"}>
        <TabsList>
          {!ownStudent && <TabsTrigger value="today">Today's Attendance</TabsTrigger>}
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="report">Student Report</TabsTrigger>
          {!ownStudent && <TabsTrigger value="alerts">Delay Alerts ({delayAlerts.length})</TabsTrigger>}
        </TabsList>

        {!ownStudent && (
          <TabsContent value="today">
            <TodayTable
              data={today}
              canModify={!!canModify}
              onOverride={setOverride}
              onViolation={setViolation}
            />
          </TabsContent>
        )}

        <TabsContent value="monthly">
          <MonthlyGrid cells={monthCells} />
        </TabsContent>

        <TabsContent value="report" className="space-y-3">
          {!ownStudent && (
            <Select value={studentSel} onValueChange={setStudentSel}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DUMMY_STUDENTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name} · {s.admissionNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="font-heading font-semibold text-sm mb-3">30-Day Trend — {studentScope.name}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last30}>
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <RTooltip />
                <Bar dataKey="pct" fill="#F7A900" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {!ownStudent && (
          <TabsContent value="alerts">
            <DataTable<AttendanceRecord>
              columns={[
                { key: "studentName", header: "Student" },
                { key: "violation", header: "Trigger", render: (r) => <span className="text-xs uppercase">{r.violation}</span> },
                { key: "date", header: "Date", render: (r) => formatDate(r.date) },
                { key: "notify", header: "Parent Notified", render: () => <span className="text-success">✅</span> },
              ]}
              data={delayAlerts}
              emptyTitle="No alerts triggered"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* QR scan dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Simulate QR Scan</DialogTitle>
            <DialogDescription>For demo purposes.</DialogDescription>
          </DialogHeader>
          <ScanForm onScan={recordScan} />
        </DialogContent>
      </Dialog>

      {/* Manual override */}
      <Dialog open={!!override} onOpenChange={(o) => !o && setOverride(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Manual Override — {override?.studentName}</DialogTitle>
          </DialogHeader>
          {override && (
            <OverrideForm
              record={override}
              onSave={(status, reason) => {
                setRecords(prev => prev.map(r => r.id === override.id ? { ...r, status, scanType: "manual" } : r));
                toast.success(`Attendance manually updated for ${override.studentName}.`);
                setOverride(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Violation */}
      <Dialog open={!!violation} onOpenChange={(o) => !o && setViolation(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Log Violation — {violation?.studentName}</DialogTitle></DialogHeader>
          {violation && (
            <ViolationForm
              onSave={(type) => {
                setRecords(prev => prev.map(r => r.id === violation.id ? { ...r, violation: type } : r));
                toast.success(`Violation logged for ${violation.studentName}.`);
                setViolation(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TodayTable({ data, canModify, onOverride, onViolation }: {
  data: AttendanceRecord[]; canModify: boolean;
  onOverride: (r: AttendanceRecord) => void;
  onViolation: (r: AttendanceRecord) => void;
}) {
  const cols: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "studentName", header: "Student",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-light text-primary-dark grid place-items-center text-[10px] font-medium">
            {r.studentName.split(" ").map(n => n[0]).slice(0,2).join("")}
          </div>
          {r.studentName}
        </div>
      ),
    },
    { key: "batch", header: "Batch" },
    { key: "checkIn", header: "In", render: (r) => r.checkIn ?? "—" },
    { key: "checkOut", header: "Out", render: (r) => r.checkOut ?? "—" },
    {
      key: "status", header: "Status",
      render: (r) => {
        const m = ATT_STATUS_META[r.status];
        return <span className={cn("px-2 py-0.5 rounded text-xs font-medium", m.bg, m.color)}>{m.label}</span>;
      },
    },
    { key: "scanType", header: "Scan", render: (r) => <span className="text-xs uppercase">{r.scanType}</span> },
    ...(canModify ? [{
      key: "actions", header: "",
      render: (r: AttendanceRecord) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onOverride(r)}>Override</Button>
          <Button size="sm" variant="ghost" onClick={() => onViolation(r)}>Violation</Button>
        </div>
      ),
    }] : []),
  ];
  return <DataTable columns={cols} data={data} />;
}

function MonthlyGrid({ cells }: { cells: { day: number; date: string; pct: number | null }[] }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, i) => {
          const color = c.pct == null ? "bg-muted text-muted-foreground" :
            c.pct >= 80 ? "bg-green-100 text-green-800" :
            c.pct >= 60 ? "bg-amber-100 text-amber-800" :
            "bg-red-100 text-red-800";
          return (
            <motion.div
              key={c.date}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={cn("rounded-lg p-2 h-16 flex flex-col justify-between text-xs", color)}
            >
              <span className="font-medium">{c.day}</span>
              <span className="text-[10px]">{c.pct == null ? "—" : `${c.pct}%`}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ScanForm({ onScan }: { onScan: (id: string, type: "in" | "out") => void }) {
  const [studentId, setStudentId] = useState(DUMMY_STUDENTS[0].id);
  const [type, setType] = useState<"in" | "out">("in");
  return (
    <div className="space-y-3">
      <div>
        <Label>Student</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{DUMMY_STUDENTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button variant={type === "in" ? "default" : "outline"} onClick={() => setType("in")} className="flex-1">Check IN</Button>
        <Button variant={type === "out" ? "default" : "outline"} onClick={() => setType("out")} className="flex-1">Check OUT</Button>
      </div>
      <DialogFooter>
        <Button onClick={() => onScan(studentId, type)} className="bg-primary hover:bg-primary-dark text-primary-foreground w-full">
          <ScanLine className="w-4 h-4" /> Simulate Scan
        </Button>
      </DialogFooter>
    </div>
  );
}

function OverrideForm({ record, onSave }: { record: AttendanceRecord; onSave: (s: AttStatus, reason: string) => void }) {
  const [status, setStatus] = useState<AttStatus>(record.status);
  const [reason, setReason] = useState("");
  return (
    <>
      <div className="space-y-3">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AttStatus)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ATT_STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Reason</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(status, reason)} className="bg-primary hover:bg-primary-dark text-primary-foreground">Save</Button>
      </DialogFooter>
    </>
  );
}

function ViolationForm({ onSave }: { onSave: (type: "repeated_delay" | "unauthorised_absence") => void }) {
  const [type, setType] = useState<"repeated_delay" | "unauthorised_absence">("repeated_delay");
  const [notes, setNotes] = useState("");
  return (
    <>
      <div className="space-y-3">
        <div>
          <Label>Violation Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="repeated_delay">Repeated Delay</SelectItem>
              <SelectItem value="unauthorised_absence">Unauthorised Absence</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(type)} className="bg-primary hover:bg-primary-dark text-primary-foreground">Log Violation</Button>
      </DialogFooter>
    </>
  );
}
