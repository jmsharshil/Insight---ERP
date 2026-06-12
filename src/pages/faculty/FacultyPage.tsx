import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { facultyAction, batchAction } from "@/redux/actions";
import { setFaculty, setFacultyLoading, setFacultyError } from "@/redux/slices/facultySlice";
import { RootState, AppDispatch } from "@/store";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  ClipboardList,
  Wallet,
  Plus,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { API } from "@/service/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import FacultyDetailSheet from "./components/FacultyDetailSheet";

const MONTHS = ["Mar 2024", "Apr 2024", "May 2024"];

export default function FacultyPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isFaculty = user?.role === "faculty";
  const canPayroll =
    user?.role === "accountant" || user?.role === "branch_manager" || user?.role === "super_admin";

  const dispatch = useDispatch<AppDispatch>();
  const { facultyList, loading: isLoading } = useSelector(
    (state: RootState) => state.faculty,
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const [payrollMonth, setPayrollMonth] = useState(MONTHS[2]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  const [selectedFacultyForAssign, setSelectedFacultyForAssign] = useState<any | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const batchesLoading = dropdownsLoading;
  const subjectsLoading = dropdownsLoading;

  const fetchDropdowns = () => {
    setDropdownsLoading(true);
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: "/api/v1/batches/dropdowns/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        if (data) {
          if (Array.isArray(data.batches)) setBatches(data.batches);
          if (Array.isArray(data.subjects)) setSubjects(data.subjects);
        }
        setDropdownsLoading(false);
      },
      getError: () => {
        toast.error("Failed to load dropdown values");
        setDropdownsLoading(false);
      }
    });
  };

  useEffect(() => {
    if (assignModalOpen) {
      fetchDropdowns();
    }
  }, [assignModalOpen]);

  const fetchFacultyDetails = (id: string) => {
    dispatch({
      type: facultyAction.GET_FACULTY_DETAILS,
      method: "GET",
      endPoint: `/api/v1/faculty/${id}/`,
      auth: true,
      getResponse: (res: any) => {
        const fullFaculty = res?.data || res;
        if (fullFaculty) {
          setSelectedFacultyForAssign(fullFaculty);
        }
      },
      getError: () => {
        console.error("Failed to load latest faculty details");
      }
    });
  };

  const handleOpenAssignModal = (faculty: any) => {
    setSelectedFacultyForAssign(faculty);
    setAssignModalOpen(true);
    setSelectedBatchId("");
    setSelectedSubjectId("");
    fetchFacultyDetails(faculty.id);
  };

  const handleAssignFacultyToBatch = () => {
    if (!selectedFacultyForAssign || !selectedBatchId) return;

    setAssignLoading(true);
    const apiSubjectId = selectedSubjectId === "none" || !selectedSubjectId ? null : selectedSubjectId;

    dispatch({
      type: batchAction.ASSIGN_FACULTY,
      method: "POST",
      endPoint: API.BATCHES.ASSIGN_FACULTY(selectedBatchId),
      body: {
        faculty_id: selectedFacultyForAssign.id,
        subject_id: apiSubjectId,
      },
      auth: true,
      getResponse: () => {
        toast.success("Faculty assigned to batch successfully.");
        setSelectedBatchId("");
        setSelectedSubjectId("");
        fetchDropdowns();
        fetchFacultyDetails(selectedFacultyForAssign.id);
        setAssignLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to assign faculty");
        setAssignLoading(false);
      }
    });
  };

  const handleRemoveFacultyFromBatch = (batchId: string) => {
    if (!selectedFacultyForAssign) return;

    setAssignLoading(true);
    dispatch({
      type: batchAction.REMOVE_FACULTY,
      method: "POST",
      endPoint: API.BATCHES.REMOVE_FACULTY(batchId, selectedFacultyForAssign.id),
      auth: true,
      getResponse: () => {
        toast.success("Faculty removed from batch successfully.");
        fetchDropdowns();
        fetchFacultyDetails(selectedFacultyForAssign.id);
        setAssignLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to remove faculty");
        setAssignLoading(false);
      }
    });
  };

  const assignedBatches = useMemo(() => {
    if (!selectedFacultyForAssign) return [];

    let facultyBatchNames: string[] = [];
    const rawBatchName = selectedFacultyForAssign.batch_name;

    if (typeof rawBatchName === "string") {
      facultyBatchNames = rawBatchName
        .split(",")
        .map((name: string) => name.trim().toLowerCase())
        .filter(Boolean);
    } else if (Array.isArray(rawBatchName)) {
      facultyBatchNames = rawBatchName
        .map((name: any) => String(name).trim().toLowerCase())
        .filter(Boolean);
    }

    return batches.filter((b) => {
      const nameMatch = facultyBatchNames.includes(b.name?.trim().toLowerCase());
      const facultyMatch = b.assigned_faculty?.some((f: any) => f.faculty_id === selectedFacultyForAssign.id);
      return nameMatch || facultyMatch;
    });
  }, [batches, selectedFacultyForAssign]);

  const assignableBatches = useMemo(() => {
    return batches.filter(
      (b) => !assignedBatches.some((ab) => ab.id === b.id)
    );
  }, [batches, assignedBatches]);

  const handleRowClick = (faculty: any) => {
    setSelectedFacultyId(faculty.id);
    setIsSheetOpen(true);
  };

  useEffect(() => {
    dispatch({
      type: facultyAction.GET_FACULTY,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      setLoading: (val: boolean) => dispatch(setFacultyLoading(val)),
      getResponse: (res: any) => {
        if (res.data) dispatch(setFaculty(res.data));
      },
      getError: (err: any) => {
        dispatch(setFacultyError(err.message));
        toast.error("Failed to load faculty members");
      },
    } as any);
  }, [dispatch, toast]);

  const payrollRows = useMemo(
    () => payrolls.filter((p) => p.month === payrollMonth),
    [payrolls, payrollMonth],
  );
  const totalPayrollDue = payrollRows.reduce(
    (s, p) => s + (p.status !== "disbursed" ? p.netPayable : 0),
    0,
  );

  const computePayroll = () => {
    toast.success(`Payroll computed for ${payrollMonth}. ${facultyList.length} records generated.`);
  };
  const submitApproval = () => {
    setPayrolls((rows) =>
      rows.map((r) => (r.month === payrollMonth ? { ...r, status: "pending_approval" } : r)),
    );
    toast.success("Submitted to Branch Manager for approval.");
  };
  const approveAll = () => {
    setPayrolls((rows) =>
      rows.map((r) =>
        r.month === payrollMonth
          ? { ...r, status: "disbursed", disbursedAt: new Date().toISOString() }
          : r,
      ),
    );
    setConfirmApprove(false);
    toast.success(`Payroll approved! Digital slips sent to ${payrollRows.length} faculty members.`);
  };

  if (isFaculty) {
    const myAttendance: any[] = [];
    const myReports: any[] = [];
    const myPayslips: any[] = [];
    return (
      <div>
        <PageHeader
          title="My Faculty Hub"
          subtitle="Attendance, sessions, leave and payroll in one place"
          actions={
            <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-1.5" /> Submit Session Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Session Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Batch</Label>
                    <Input placeholder="JEE-A1" />
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input placeholder="Physics" />
                  </div>
                  <div>
                    <Label>Topic</Label>
                    <Input placeholder="Newton's Laws" />
                  </div>
                  <div>
                    <Label>Chapter</Label>
                    <Input placeholder="Ch 5" />
                  </div>
                  <div>
                    <Label>Completion %</Label>
                    <Input type="number" defaultValue={100} />
                  </div>
                  <div>
                    <Label>Remarks</Label>
                    <Textarea placeholder="Any notes..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setSessionDialogOpen(false);
                      toast.success("Session report submitted.");
                    }}
                  >
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Hours This Month" value="64" icon={Briefcase} index={0} />
          <StatCard
            title="Sessions Logged"
            value={myReports.length}
            icon={ClipboardList}
            index={1}
          />
          <StatCard
            title="Late Days"
            value={myAttendance.filter((a) => a.late).length}
            icon={Users}
            trendType="warning"
            index={2}
          />
          <StatCard
            title="Net Payable (May)"
            value="₹52,800"
            icon={Wallet}
            trendType="up"
            index={3}
          />
        </div>
        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="sessions">Session Reports</TabsTrigger>
            <TabsTrigger value="payslips">My Payslips</TabsTrigger>
          </TabsList>
          <TabsContent value="attendance" className="mt-4">
            <DataTable
              data={myAttendance}
              columns={[
                { key: "date", header: "Date" },
                { key: "checkIn", header: "Check In" },
                { key: "checkOut", header: "Check Out" },
                { key: "hours", header: "Hours" },
                {
                  key: "late",
                  header: "Late",
                  render: (r: any) =>
                    r.late ? (
                      <Badge variant="destructive">Late</Badge>
                    ) : (
                      <Badge className="bg-success/20 text-success">On time</Badge>
                    ),
                },
              ]}
            />
          </TabsContent>
          <TabsContent value="sessions" className="mt-4">
            <DataTable
              data={myReports}
              columns={[
                { key: "date", header: "Date" },
                { key: "batch", header: "Batch" },
                { key: "subject", header: "Subject" },
                { key: "topic", header: "Topic" },
                {
                  key: "completionPercent",
                  header: "%",
                  render: (r: any) => `${r.completionPercent}%`,
                },
                { key: "remarks", header: "Remarks" },
              ]}
            />
          </TabsContent>
          <TabsContent value="payslips" className="mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPayslips.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-heading font-semibold">{p.month}</div>
                    <Badge variant="outline" className="capitalize">
                      {p.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-3xl font-heading font-bold text-primary-dark">
                    ₹{p.netPayable.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Net Payable</div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hours</span>
                      <span>{p.hoursTaught}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross</span>
                      <span>₹{p.grossAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deductions</span>
                      <span>
                        -₹{(p.lateEntryDeductions + p.absenceDeductions).toLocaleString()}
                      </span>
                    </div>
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
        // actions={
        //   <Dialog>
        //     <DialogTrigger asChild>
        //       <Button>
        //         <Plus className="w-4 h-4 mr-1.5" /> Add Faculty
        //       </Button>
        //     </DialogTrigger>
        //     <DialogContent>
        //       <DialogHeader>
        //         <DialogTitle>Add Faculty Member</DialogTitle>
        //       </DialogHeader>
        //       <div className="grid grid-cols-2 gap-3">
        //         <div>
        //           <Label>Name</Label>
        //           <Input />
        //         </div>
        //         <div>
        //           <Label>Email</Label>
        //           <Input />
        //         </div>
        //         <div>
        //           <Label>Phone</Label>
        //           <Input />
        //         </div>
        //         <div>
        //           <Label>Qualification</Label>
        //           <Input />
        //         </div>
        //         <div>
        //           <Label>Employment Type</Label>
        //           <Select defaultValue="full-time">
        //             <SelectTrigger>
        //               <SelectValue />
        //             </SelectTrigger>
        //             <SelectContent>
        //               <SelectItem value="full-time">Full-time</SelectItem>
        //               <SelectItem value="part-time">Part-time</SelectItem>
        //               <SelectItem value="contract">Contract</SelectItem>
        //             </SelectContent>
        //           </Select>
        //         </div>
        //         <div>
        //           <Label>Hourly Rate</Label>
        //           <Input type="number" />
        //         </div>
        //       </div>
        //       <DialogFooter>
        //         <Button onClick={() => toast.success("Faculty added.")}>Save</Button>
        //       </DialogFooter>
        //     </DialogContent>
        //   </Dialog>
        // }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Faculty" value={facultyList.length} icon={Briefcase} index={0} />
        <StatCard
          title="Active"
          value={facultyList.filter((f) => f.is_active).length}
          icon={Users}
          trendType="up"
          index={1}
        />
        <StatCard title="Sessions This Week" value={34} icon={ClipboardList} index={2} />
        <StatCard
          title="Payroll Due"
          value={`₹${totalPayrollDue.toLocaleString()}`}
          icon={Wallet}
          trendType="warning"
          index={3}
        />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Faculty Directory</TabsTrigger>
          <TabsTrigger value="sessions">Session Reports</TabsTrigger>
          {canPayroll && <TabsTrigger value="payroll">Payroll</TabsTrigger>}
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          <DataTable
            data={facultyList}
            searchable
            exportable
            pageSize={20}
            onRowClick={handleRowClick}
            columns={[
              {
                key: "full_name",
                header: "Name",
                render: (f: any) => (
                  <div className="flex items-center gap-3">
                    {f.photo_url ? (
                      <img
                        src={f.photo_url}
                        alt={f.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {f.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}
                    <span className="font-medium">{f.full_name}</span>
                  </div>
                ),
              },
              { key: "employee_id", header: "Employee ID" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone" },
              { key: "branch_name", header: "Branch" },
              {
                key: "employment_type_display",
                header: "Type",
                render: (f: any) => (
                  <Badge variant="secondary" className="capitalize">
                    {f.employment_type_display}
                  </Badge>
                ),
              },
              {
                key: "is_active",
                header: "Status",
                render: (f: any) => (
                  <Badge
                    className={
                      f.is_active
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive"
                    }
                  >
                    {f.is_active ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "",
                render: (f: any) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(f);
                        }}
                      >
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(f);
                        }}
                      >
                        Assign and Remove Batch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <DataTable
            exportable
            data={[]}
            columns={[
              { key: "date", header: "Date" },
              { key: "facultyId", header: "Faculty" },
              { key: "batch", header: "Batch" },
              { key: "subject", header: "Subject" },
              { key: "topic", header: "Topic" },
              {
                key: "completionPercent",
                header: "%",
                render: (r: any) => `${r.completionPercent}%`,
              },
              { key: "remarks", header: "Remarks" },
            ]}
          />
        </TabsContent>

        {canPayroll && (
          <TabsContent value="payroll" className="mt-4">
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <Select value={payrollMonth} onValueChange={setPayrollMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={computePayroll}>
                Compute Payroll
              </Button>
              <Button variant="outline" onClick={submitApproval}>
                Submit for Approval
              </Button>
              <Button onClick={() => setConfirmApprove(true)} className="ml-auto">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Disburse
              </Button>
            </div>
            <DataTable
              exportable
              data={payrollRows}
              columns={[
                { key: "facultyId", header: "Faculty" },
                { key: "hoursTaught", header: "Hours" },
                {
                  key: "grossAmount",
                  header: "Gross",
                  render: (r: any) => `₹${r.grossAmount.toLocaleString()}`,
                },
                {
                  key: "lateEntryDeductions",
                  header: "Late Ded.",
                  render: (r: any) => `₹${r.lateEntryDeductions}`,
                },
                {
                  key: "absenceDeductions",
                  header: "Abs. Ded.",
                  render: (r: any) => `₹${r.absenceDeductions}`,
                },
                {
                  key: "netPayable",
                  header: "Net",
                  render: (r: any) => (
                    <span className="font-semibold text-primary-dark">
                      ₹{r.netPayable.toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r: any) => (
                    <Badge variant="outline" className="capitalize">
                      {r.status.replace("_", " ")}
                    </Badge>
                  ),
                },
              ]}
            />
            <ConfirmDialog
              open={confirmApprove}
              onOpenChange={setConfirmApprove}
              title="Approve & Disburse Payroll?"
              description={`This will mark all ${payrollRows.length} faculty payslips as disbursed.`}
              onConfirm={approveAll}
            />
          </TabsContent>
        )}
      </Tabs>

      <FacultyDetailSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} facultyId={selectedFacultyId} />

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Batch</DialogTitle>
          </DialogHeader>
          {selectedFacultyForAssign && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Faculty Details
                </span>
                <p className="font-semibold text-text-primary text-base">
                  {selectedFacultyForAssign.full_name}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Level: <strong className="capitalize">{selectedFacultyForAssign.level_display || selectedFacultyForAssign.level || "N/A"}</strong></span>
                  <span>•</span>
                  <span>Type: <strong className="capitalize">{selectedFacultyForAssign.employment_type_display || selectedFacultyForAssign.employment_type || "N/A"}</strong></span>
                </div>
              </div>

              {/* Current Batch Info */}
              <div className="rounded-lg bg-muted/20 border border-border/40 p-3 space-y-2">
                <span className="text-xs font-medium text-muted-foreground block">
                  Current Enrollment Status
                </span>
                {assignedBatches.length === 0 ? (
                  <p className="text-sm font-medium text-muted-foreground">No batches assigned</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {assignedBatches.map((b) => (
                      <div key={b.id} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                        <p className="text-sm font-medium text-foreground">
                          {b.name}
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleRemoveFacultyFromBatch(b.id)}
                          disabled={assignLoading}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Batch Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Assign to Batch
                </label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="w-full bg-muted/10">
                    <SelectValue placeholder={batchesLoading ? "Loading batches..." : "Select a batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableBatches.length === 0 ? (
                      <SelectItem value="no_batches" disabled>
                        No available batches
                      </SelectItem>
                    ) : (
                      assignableBatches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} ({b.course_name || "General"})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Assign New Subject Selector (Optional) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Subject (Optional)
                </label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="w-full bg-muted/10">
                    <SelectValue placeholder={subjectsLoading ? "Loading subjects..." : "Select a subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (No subject)</SelectItem>
                    {subjects.length === 0 ? (
                      <SelectItem value="no_subjects" disabled>
                        No subjects available
                      </SelectItem>
                    ) : (
                      subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.code || "No Code"})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignFacultyToBatch}
              disabled={!selectedBatchId || assignLoading}
              className="bg-primary hover:bg-primary-dark"
            >
              {assignLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
