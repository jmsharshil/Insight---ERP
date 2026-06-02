import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, ClipboardList, Wallet, Plus, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  FACULTY_MEMBERS, SESSION_REPORTS, PAYROLL_RECORDS, FACULTY_ATTENDANCE,
  type FacultyMember,
} from "@/constants/dummy/faculty";

const MONTHS = ["Mar 2024", "Apr 2024", "May 2024"];

export default function FacultyPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isFaculty = user?.role === "faculty";
  const canPayroll = user?.role === "accountant" || user?.role === "branch_manager" || user?.role === "super_admin";

  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [payrollMonth, setPayrollMonth] = useState(MONTHS[2]);
  const [payrolls, setPayrolls] = useState(PAYROLL_RECORDS);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  const payrollRows = useMemo(
    () => payrolls.filter((p) => p.month === payrollMonth),
    [payrolls, payrollMonth],
  );
  const totalPayrollDue = payrollRows.reduce((s, p) => s + (p.status !== "disbursed" ? p.netPayable : 0), 0);

  const computePayroll = () => {
    toast.success(`Payroll computed for ${payrollMonth}. ${FACULTY_MEMBERS.length} records generated.`);
  };
  const submitApproval = () => {
    setPayrolls((rows) => rows.map((r) => r.month === payrollMonth ? { ...r, status: "pending_approval" } : r));
    toast.success("Submitted to Branch Manager for approval.");
  };
  const approveAll = () => {
    setPayrolls((rows) => rows.map((r) => r.month === payrollMonth ? { ...r, status: "disbursed", disbursedAt: new Date().toISOString() } : r));
    setConfirmApprove(false);
    toast.success(`Payroll approved! Digital slips sent to ${payrollRows.length} faculty members.`);
  };

  if (isFaculty) {
    const myAttendance = FACULTY_ATTENDANCE;
    const myReports = SESSION_REPORTS.filter((s) => s.facultyId === "FAC-001");
    const myPayslips = PAYROLL_RECORDS.filter((p) => p.facultyId === "FAC-001");
    return (
      <div>
        <PageHeader
          title="My Faculty Hub"
          subtitle="Attendance, sessions, leave and payroll in one place"
          actions={
            <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-1.5" /> Submit Session Report</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Session Report</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Batch</Label><Input placeholder="JEE-A1" /></div>
                  <div><Label>Subject</Label><Input placeholder="Physics" /></div>
                  <div><Label>Topic</Label><Input placeholder="Newton's Laws" /></div>
                  <div><Label>Chapter</Label><Input placeholder="Ch 5" /></div>
                  <div><Label>Completion %</Label><Input type="number" defaultValue={100} /></div>
                  <div><Label>Remarks</Label><Textarea placeholder="Any notes..." /></div>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setSessionDialogOpen(false); toast.success("Session report submitted."); }}>Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Hours This Month" value="64" icon={Briefcase} index={0} />
          <StatCard title="Sessions Logged" value={myReports.length} icon={ClipboardList} index={1} />
          <StatCard title="Late Days" value={myAttendance.filter(a => a.late).length} icon={Users} trendType="warning" index={2} />
          <StatCard title="Net Payable (May)" value="₹52,800" icon={Wallet} trendType="up" index={3} />
        </div>
        <Tabs defaultValue="attendance">
          <TabsList><TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="sessions">Session Reports</TabsTrigger>
            <TabsTrigger value="payslips">My Payslips</TabsTrigger></TabsList>
          <TabsContent value="attendance" className="mt-4">
            <DataTable data={myAttendance} columns={[
              { key: "date", header: "Date" },
              { key: "checkIn", header: "Check In" },
              { key: "checkOut", header: "Check Out" },
              { key: "hours", header: "Hours" },
              { key: "late", header: "Late", render: (r: any) => r.late ? <Badge variant="destructive">Late</Badge> : <Badge className="bg-success/20 text-success">On time</Badge> },
            ]} />
          </TabsContent>
          <TabsContent value="sessions" className="mt-4">
            <DataTable data={myReports} columns={[
              { key: "date", header: "Date" }, { key: "batch", header: "Batch" },
              { key: "subject", header: "Subject" }, { key: "topic", header: "Topic" },
              { key: "completionPercent", header: "%", render: (r:any) => `${r.completionPercent}%` },
              { key: "remarks", header: "Remarks" },
            ]} />
          </TabsContent>
          <TabsContent value="payslips" className="mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPayslips.map((p) => (
                <motion.div key={p.id} whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-heading font-semibold">{p.month}</div>
                    <Badge variant="outline" className="capitalize">{p.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="text-3xl font-heading font-bold text-primary-dark">₹{p.netPayable.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Net Payable</div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Hours</span><span>{p.hoursTaught}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gross</span><span>₹{p.grossAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Deductions</span><span>-₹{(p.lateEntryDeductions + p.absenceDeductions).toLocaleString()}</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Faculty & Payroll"
        subtitle="Manage faculty members, sessions and monthly payroll"
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1.5" /> Add Faculty</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Faculty Member</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input /></div>
                <div><Label>Email</Label><Input /></div>
                <div><Label>Phone</Label><Input /></div>
                <div><Label>Qualification</Label><Input /></div>
                <div><Label>Employment Type</Label>
                  <Select defaultValue="full-time"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent></Select>
                </div>
                <div><Label>Hourly Rate</Label><Input type="number" /></div>
              </div>
              <DialogFooter><Button onClick={() => toast.success("Faculty added.")}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Faculty" value={FACULTY_MEMBERS.length} icon={Briefcase} index={0} />
        <StatCard title="Active" value={FACULTY_MEMBERS.filter(f => f.status === "active").length} icon={Users} trendType="up" index={1} />
        <StatCard title="Sessions This Week" value={34} icon={ClipboardList} index={2} />
        <StatCard title="Payroll Due" value={`₹${totalPayrollDue.toLocaleString()}`} icon={Wallet} trendType="warning" index={3} />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Faculty Directory</TabsTrigger>
          <TabsTrigger value="sessions">Session Reports</TabsTrigger>
          {canPayroll && <TabsTrigger value="payroll">Payroll</TabsTrigger>}
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FACULTY_MEMBERS.map((f, i) => (
              <motion.div key={f.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedFaculty(f)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold">
                    {f.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{f.id}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {f.subjectExpertise.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge className="capitalize" variant="secondary">{f.employmentType}</Badge>
                  <Badge className={f.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>{f.status}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <DataTable exportable data={SESSION_REPORTS} columns={[
            { key: "date", header: "Date" },
            { key: "facultyId", header: "Faculty" },
            { key: "batch", header: "Batch" },
            { key: "subject", header: "Subject" },
            { key: "topic", header: "Topic" },
            { key: "completionPercent", header: "%", render: (r:any) => `${r.completionPercent}%` },
            { key: "remarks", header: "Remarks" },
          ]} />
        </TabsContent>

        {canPayroll && (
          <TabsContent value="payroll" className="mt-4">
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <Select value={payrollMonth} onValueChange={setPayrollMonth}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" onClick={computePayroll}>Compute Payroll</Button>
              <Button variant="outline" onClick={submitApproval}>Submit for Approval</Button>
              <Button onClick={() => setConfirmApprove(true)} className="ml-auto">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Disburse
              </Button>
            </div>
            <DataTable exportable data={payrollRows} columns={[
              { key: "facultyId", header: "Faculty" },
              { key: "hoursTaught", header: "Hours" },
              { key: "grossAmount", header: "Gross", render: (r:any) => `₹${r.grossAmount.toLocaleString()}` },
              { key: "lateEntryDeductions", header: "Late Ded.", render: (r:any) => `₹${r.lateEntryDeductions}` },
              { key: "absenceDeductions", header: "Abs. Ded.", render: (r:any) => `₹${r.absenceDeductions}` },
              { key: "netPayable", header: "Net", render: (r:any) => <span className="font-semibold text-primary-dark">₹{r.netPayable.toLocaleString()}</span> },
              { key: "status", header: "Status", render: (r:any) => <Badge variant="outline" className="capitalize">{r.status.replace("_"," ")}</Badge> },
            ]} />
            <ConfirmDialog open={confirmApprove} onOpenChange={setConfirmApprove}
              title="Approve & Disburse Payroll?" description={`This will mark all ${payrollRows.length} faculty payslips as disbursed.`}
              onConfirm={approveAll} />
          </TabsContent>
        )}
      </Tabs>

      <Sheet open={!!selectedFaculty} onOpenChange={(o) => !o && setSelectedFaculty(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedFaculty && (
            <>
              <SheetHeader><SheetTitle>{selectedFaculty.name}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <Card><CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div>{selectedFaculty.email}</div><div>{selectedFaculty.phone}</div>
                    <div>{selectedFaculty.qualifications}</div>
                    <div className="text-muted-foreground">Joined {selectedFaculty.joinedDate}</div>
                  </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">QR Attendance (last 10)</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-1">
                      {FACULTY_ATTENDANCE.map((a) => (
                        <div key={a.date} className="flex justify-between border-b border-border py-1 last:border-0">
                          <span>{a.date}</span>
                          <span className="text-muted-foreground">{a.checkIn} → {a.checkOut}</span>
                          <span>{a.hours.toFixed(1)}h</span>
                          {a.late && <Badge variant="destructive" className="text-[10px]">Late</Badge>}
                        </div>
                      ))}
                    </div>
                  </CardContent></Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
