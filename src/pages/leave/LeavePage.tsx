import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarOff, CheckCircle2, XCircle, Users, Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  LEAVE_APPLICATIONS, LEAVE_BALANCES, calculateLeaveDays, type LeaveApplication,
} from "@/constants/dummy/leave";

export default function LeavePage() {
  const { user } = useAuth();
  const toast = useToast();
  const isStaff = user?.role === "faculty" || user?.role === "admin_exec";
  const [apps, setApps] = useState(LEAVE_APPLICATIONS);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const calc = useMemo(() => calculateLeaveDays(from, to), [from, to]);

  const onLeaveToday = apps.filter((a) => {
    const today = new Date().toISOString().slice(0, 10);
    return a.status === "approved" && a.fromDate <= today && a.toDate >= today;
  });

  const approve = (id: string) => {
    setApps((rows) => rows.map((r) => r.id === id ? { ...r, status: "approved", reviewedBy: user?.name } : r));
    toast.success("Leave approved. Push notification sent to applicant.");
  };
  const reject = () => {
    if (!rejectId) return;
    setApps((rows) => rows.map((r) => r.id === rejectId ? { ...r, status: "rejected", rejectionReason: rejectReason, reviewedBy: user?.name } : r));
    setRejectId(null); setRejectReason("");
    toast.success("Leave rejected. Push notification sent.");
  };

  const submitApplication = () => {
    toast.success("Leave application LVE-021 submitted. Awaiting Admin Senior Executive approval.");
  };

  if (isStaff) {
    const myApps = apps.filter((a) => a.applicantName === user?.name);
    const balance = LEAVE_BALANCES[0];
    return (
      <div>
        <PageHeader title="My Leave" subtitle="Apply and track your leave applications" actions={
          <Dialog>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> Apply for Leave</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Leave Type</Label>
                  <Select defaultValue="CL"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["PL","SL","CL","Special"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
                  <div><Label>To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
                </div>
                {calc.days > 0 && (
                  <div className="rounded-md bg-primary-light p-3 text-sm">
                    Total days: <b>{calc.days}</b>
                    {calc.weekendsIncluded > 0 && ` (includes ${calc.weekendsIncluded} weekend day${calc.weekendsIncluded > 1 ? "s" : ""} due to Sandwich Leave Policy)`}
                  </div>
                )}
                <div><Label>Reason</Label><Textarea /></div>
              </div>
              <DialogFooter><Button onClick={submitApplication}>Submit</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(["PL","SL","CL","Special"] as const).map((t, i) => {
            const b = balance[t];
            return (
              <Card key={t}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-heading font-semibold">{t}</div>
                    <div className="text-sm text-muted-foreground">{b.remaining}/{b.total}</div>
                  </div>
                  <Progress value={(b.used / b.total) * 100} />
                  <div className="mt-2 text-xs text-muted-foreground">{b.used} used · {b.remaining} remaining</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <DataTable data={myApps} columns={[
          { key: "id", header: "ID" }, { key: "leaveType", header: "Type" },
          { key: "fromDate", header: "From" }, { key: "toDate", header: "To" },
          { key: "totalDays", header: "Days" },
          { key: "status", header: "Status", render: (r:any) => <Badge variant="outline" className="capitalize">{r.status.replace(/_/g," ")}</Badge> },
        ]} />
      </div>
    );
  }

  const pending = apps.filter((a) => a.status === "pending");

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Approvals, balances and calendar view" />
      {onLeaveToday.length > 0 && (
        <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
          className="rounded-xl bg-primary-light border border-primary/30 p-4 mb-6 flex items-center gap-3">
          <Users className="w-5 h-5 text-primary-dark" />
          <div>
            <div className="font-semibold text-text-primary">On Leave Today</div>
            <div className="text-sm text-muted-foreground">{onLeaveToday.map(a => a.applicantName).join(", ")}</div>
          </div>
        </motion.div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending Approvals" value={pending.length} icon={CalendarOff} trendType="warning" index={0} />
        <StatCard title="Approved This Month" value={apps.filter(a=>a.status==="approved").length} icon={CheckCircle2} trendType="up" index={1} />
        <StatCard title="Rejected" value={apps.filter(a=>a.status==="rejected").length} icon={XCircle} trendType="down" index={2} />
        <StatCard title="On Leave Today" value={onLeaveToday.length} icon={Users} index={3} />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="all">All Applications</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <DataTable data={pending} columns={[
            { key: "applicantName", header: "Applicant" },
            { key: "applicantRole", header: "Role" },
            { key: "leaveType", header: "Type", render: (r:any) => <Badge variant="outline">{r.leaveType}</Badge> },
            { key: "fromDate", header: "From" }, { key: "toDate", header: "To" },
            { key: "totalDays", header: "Days" },
            { key: "actions", header: "Actions", render: (r: LeaveApplication) => (
              <div className="flex gap-1">
                <Button size="sm" onClick={() => approve(r.id)}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setRejectId(r.id)}>Reject</Button>
              </div>
            )},
          ]} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <DataTable exportable data={apps} columns={[
            { key: "id", header: "ID" }, { key: "applicantName", header: "Applicant" },
            { key: "leaveType", header: "Type" },
            { key: "fromDate", header: "From" }, { key: "toDate", header: "To" },
            { key: "totalDays", header: "Days" },
            { key: "status", header: "Status", render: (r:any) => <Badge variant="outline" className="capitalize">{r.status.replace(/_/g," ")}</Badge> },
          ]} />
        </TabsContent>
        <TabsContent value="balances" className="mt-4">
          <DataTable data={LEAVE_BALANCES} columns={[
            { key: "facultyId", header: "Faculty" },
            { key: "PL", header: "PL", render: (r:any) => <span className={r.PL.remaining<2?"text-destructive font-semibold":""}>{r.PL.remaining}</span> },
            { key: "SL", header: "SL", render: (r:any) => <span className={r.SL.remaining<2?"text-destructive font-semibold":""}>{r.SL.remaining}</span> },
            { key: "CL", header: "CL", render: (r:any) => <span className={r.CL.remaining<2?"text-destructive font-semibold":""}>{r.CL.remaining}</span> },
            { key: "Special", header: "Special", render: (r:any) => <span className={r.Special.remaining<2?"text-destructive font-semibold":""}>{r.Special.remaining}</span> },
          ]} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Leave Application</DialogTitle></DialogHeader>
          <Label>Reason</Label>
          <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <DialogFooter><Button variant="destructive" onClick={reject} disabled={!rejectReason}>Reject</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
