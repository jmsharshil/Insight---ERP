import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatCard from "@/components/common/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { SUPERVISION_SLOTS, INCIDENT_TYPES, type SupervisionSlot } from "@/constants/dummy/examSupervision";

export default function ExamSupervisionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isSupervisor = user?.role === "exam_supervisor";
  const [slots, setSlots] = useState(SUPERVISION_SLOTS);
  const [checkInSlot, setCheckInSlot] = useState<SupervisionSlot | null>(null);
  const [malpracticeOpen, setMalpracticeOpen] = useState(false);

  const checkIn = () => {
    if (!checkInSlot) return;
    const now = new Date();
    const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 5);
    setSlots(rows => rows.map(r => r.id === checkInSlot.id ? { ...r, status: "checked_in", isLate: late, checkInTime: `${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}` } : r));
    setCheckInSlot(null);
    if (late) toast.warning("⚠️ Late check-in recorded. Penalty may apply.");
    else toast.success("✅ Checked in. Good luck!");
  };

  const reportMalpractice = () => {
    setMalpracticeOpen(false);
    toast.success("Malpractice report filed. Admin notified immediately.");
  };

  const allMalpractice = slots.flatMap(s => s.malpracticeReports.map(m => ({ ...m, exam: s.examTitle, supervisor: s.supervisorName })));

  if (isSupervisor) {
    const mySlots = slots;
    return (
      <div>
        <PageHeader title="My Exam Supervision" subtitle="Your assigned exam supervision duties" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {mySlots.map((s, i) => (
            <motion.div key={s.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              whileHover={{ y: -3 }}
              className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-heading font-semibold">{s.examTitle}</div>
                <Badge variant="outline" className="capitalize">{s.status.replace("_"," ")}</Badge>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>{s.date} · {s.startTime} - {s.endTime}</div>
                <div>{s.room}</div>
                <div>Compensation: <span className="text-text-primary font-medium">₹{s.compensation || 1500}</span></div>
              </div>
              <div className="mt-3 flex gap-2">
                {s.status === "assigned" && <Button size="sm" onClick={() => setCheckInSlot(s)}>Check In</Button>}
                {s.status === "checked_in" && <Button size="sm" variant="outline" onClick={() => setMalpracticeOpen(true)}><AlertTriangle className="w-4 h-4 mr-1.5"/>Report Malpractice</Button>}
              </div>
            </motion.div>
          ))}
        </div>
        <h3 className="font-heading font-semibold mb-3">Compensation History</h3>
        <DataTable data={mySlots.filter(s => s.status === "completed")} columns={[
          { key: "date", header: "Date" }, { key: "examTitle", header: "Exam" },
          { key: "hoursSupervised", header: "Hours" },
          { key: "compensation", header: "Compensation", render: (r:any) => `₹${r.compensation}` },
        ]} />
        <ConfirmDialog open={!!checkInSlot} onOpenChange={(o) => !o && setCheckInSlot(null)}
          title="Confirm check-in?" description={`You are checking in to supervise ${checkInSlot?.examTitle}.`}
          onConfirm={checkIn} />
        <Dialog open={malpracticeOpen} onOpenChange={setMalpracticeOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Report Malpractice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Student</Label><Input placeholder="STU-005" /></div>
              <div><Label>Incident Type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Description</Label><Textarea /></div>
              <div><Label>Evidence (upload)</Label><Input type="file" /></div>
            </div>
            <DialogFooter><Button onClick={reportMalpractice}>Submit Report</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Exam Supervision" subtitle="Assign supervisors and review incidents" actions={
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5"/>Assign Supervisor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Supervisor</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Exam Slot</Label><Input placeholder="JEE Mock Test 5" /></div>
              <div><Label>Supervisor</Label><Input placeholder="Kiran Patil" /></div>
            </div>
            <DialogFooter><Button onClick={() => toast.success("Supervisor assigned. Push notification sent.")}>Assign</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Upcoming" value={slots.filter(s=>s.status==="assigned").length} icon={Eye} index={0} />
        <StatCard title="In Progress" value={slots.filter(s=>s.status==="checked_in").length} icon={CheckCircle2} trendType="up" index={1} />
        <StatCard title="Completed" value={slots.filter(s=>s.status==="completed").length} icon={CheckCircle2} index={2} />
        <StatCard title="Malpractice Reports" value={allMalpractice.length} icon={AlertTriangle} trendType="warning" index={3} />
      </div>
      <Tabs defaultValue="slots">
        <TabsList><TabsTrigger value="slots">Upcoming Supervisions</TabsTrigger>
          <TabsTrigger value="malpractice">Malpractice Reports</TabsTrigger></TabsList>
        <TabsContent value="slots" className="mt-4">
          <DataTable data={slots} columns={[
            { key: "examTitle", header: "Exam" }, { key: "date", header: "Date" },
            { key: "startTime", header: "Time", render: (r:any) => `${r.startTime}-${r.endTime}` },
            { key: "room", header: "Room" },
            { key: "supervisorName", header: "Supervisor" },
            { key: "status", header: "Status", render: (r:any) => <Badge variant="outline" className="capitalize">{r.status.replace("_"," ")}</Badge> },
          ]} />
        </TabsContent>
        <TabsContent value="malpractice" className="mt-4">
          <DataTable exportable data={allMalpractice} columns={[
            { key: "id", header: "ID" }, { key: "exam", header: "Exam" },
            { key: "studentName", header: "Student" }, { key: "incidentType", header: "Incident" },
            { key: "supervisor", header: "Supervisor" },
            { key: "description", header: "Description" },
          ]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
