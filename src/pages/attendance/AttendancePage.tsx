import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ScanLine,
  Users,
  Calendar as CalIcon,
  GraduationCap,
  UserCheck,
  AlertTriangle,
  BarChart2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip } from "recharts";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DUMMY_ATTENDANCE,
  ATT_STATUS_META,
  type AttendanceRecord,
  type AttStatus,
} from "@/constants/dummy/attendance";
import { DUMMY_STUDENTS, BATCH_LIST } from "@/constants/dummy/students";
import { formatDate } from "@/lib/utils";
import { attendanceActions, batchAction, studentActions, userActions } from "@/redux/actions";
import { setStudentsLoading, setStudents } from "@/redux/slices/studentSlice";
import { setUsersLoading, setUsers } from "@/redux/slices/usersSlice";
import { API } from "@/service/api";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  setRecords,
  addRecord,
  updateRecord,
  setLoading,
  setError,
} from "@/redux/slices/attendanceSlice";

export default function AttendancePage() {
  const navigate = useNavigate();
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  useEffect(() => {
    setPageTitle("Attendance");
  }, [setPageTitle]);

  const {
    records,
    loading: attendanceLoading,
    error: attendanceError,
  } = useSelector((state: RootState) => state.attendance);

  const { students } = useSelector((state: RootState) => state.students);
  const { users } = useSelector((state: RootState) => state.users);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchFilter, setBatchFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [scanOpen, setScanOpen] = useState(false);
  const [violation, setViolation] = useState<AttendanceRecord | null>(null);
  const [studentSel, setStudentSel] = useState<string>(DUMMY_STUDENTS[0].id);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(75.0);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const fetchAttendance = () => {
    const params: Record<string, any> = {};
    if (date) {
      params.date = date;
    }
    if (batchFilter !== "all") {
      const selectedBatch = batches.find(
        (b) => String(b.id) === batchFilter || b.name === batchFilter,
      );
      if (selectedBatch) {
        params.batch_id = selectedBatch.id;
      } else {
        params.batch_id = batchFilter;
      }
    }
    if (studentFilter !== "all") {
      params.student = studentFilter;
    }
    if (facultyFilter !== "all") {
      params.faculty = facultyFilter;
    }

    dispatch({
      type: attendanceActions.GET_ATTENDANCE,
      method: "GET",
      endPoint: API.ATTENDANCE.LIST(params),
      auth: true,
      setLoading: (val: boolean) => dispatch(setLoading(val)),
      getResponse: (res: any) => {
        let fetchedRecords = [];
        if (res?.data) {
          fetchedRecords = Array.isArray(res.data) ? res.data : [];
        } else if (Array.isArray(res)) {
          fetchedRecords = res;
        }
        dispatch(setRecords(fetchedRecords));
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch attendance";
        dispatch(setError(msg));
        toast.error(msg);
      },
    });
  };

  const fetchAttendanceReport = () => {
    const params: Record<string, any> = {};
    if (batchFilter !== "all") {
      params.batch_id = batchFilter;
    }
    if (studentFilter !== "all") {
      params.student_id = studentFilter;
    } else if (ownStudent) {
      params.student_id = ownStudent.id;
    }
    dispatch({
      type: attendanceActions.GET_ATTENDANCE_REPORT,
      method: "GET",
      endPoint: API.ATTENDANCE.REPORT(params),
      auth: true,
      setLoading: (val: boolean) => setReportLoading(val),
      getResponse: (res: any) => {
        let fetchedData = [];
        if (res?.data) {
          fetchedData = Array.isArray(res.data) ? res.data : [];
        } else if (Array.isArray(res)) {
          fetchedData = res;
        }
        setReportData(fetchedData);
        if (res?.threshold !== undefined) {
          setThreshold(res.threshold);
        }
        setReportError(null);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch report";
        setReportError(msg);
        toast.error(msg);
      },
    });
  };

  useEffect(() => {
    fetchAttendanceReport();
  }, [batchFilter, studentFilter]);

  useEffect(() => {
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: API.BATCHES.LIST,
      auth: true,
      setLoading: (val: boolean) => setBatchesLoading(val),
      getResponse: (res: any) => {
        if (res?.data) {
          setBatches(Array.isArray(res.data) ? res.data : []);
        } else if (Array.isArray(res)) {
          setBatches(res);
        } else {
          setBatchesError("Unexpected response format");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch batches";
        setBatchesError(msg);
      },
    });

    dispatch({
      type: studentActions.GET_STUDENTS,
      method: "GET",
      endPoint: API.STUDENTS.LIST,
      auth: true,
      setLoading: (val: boolean) => dispatch(setStudentsLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setStudents({ data: res.data, count: res.count }));
        } else if (res?.data) {
          dispatch(
            setStudents({ data: Array.isArray(res.data) ? res.data : [], count: res.count || 0 }),
          );
        }
      },
      getError: (err: any) => {
        console.error("Failed to fetch students for filter:", err);
      },
    });

    dispatch({
      type: "GET_USERS",
      method: "GET",
      endPoint: API.USERS.LIST,
      auth: true,
      setLoading: (val: boolean) => dispatch(setUsersLoading(val)),
      getResponse: (res: any) => {
        const fetchedUsers = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        dispatch(setUsers(fetchedUsers));
      },
      getError: (err: any) => {
        console.error("Failed to fetch users for filter:", err);
      },
    });
  }, [dispatch]);

  useEffect(() => {
    fetchAttendance();
  }, [date, batchFilter, studentFilter, facultyFilter, batches]);

  const isStudent = user?.role === "student";
  const isParent = user?.role === "parent";
  const canModify =
    user &&
    ["super_admin", "branch_manager", "admin_senior_exec", "admin_exec"].includes(user.role);

  // For student/parent we narrow to their own records
  const ownStudent = isStudent || isParent ? DUMMY_STUDENTS[0] : null;
  const baseRecords = useMemo(() => {
    if (ownStudent) return records.filter((r) => r.studentId === ownStudent.id);
    return records;
  }, [records, ownStudent]);

  const today = useMemo(
    () =>
      baseRecords.filter(
        (r) =>
          (!date || r.date === date) &&
          (batchFilter === "all" ||
            r.batch === batchFilter ||
            batches.find((b: any) => String(b.id) === batchFilter)?.name === r.batch) &&
          (studentFilter === "all" || r.studentId === studentFilter) &&
          (facultyFilter === "all" ||
            r.markedBy === facultyFilter ||
            r.markedByName === facultyFilter),
      ),
    [baseRecords, date, batchFilter, studentFilter, facultyFilter, batches],
  );

  const stats = useMemo(() => {
    const by = (s: AttStatus) => today.filter((r) => r.status === s).length;
    const pct = today.length
      ? Math.round(((by("present") + by("late") + by("half-day")) / today.length) * 100)
      : 0;
    return { present: by("present"), absent: by("absent"), late: by("late"), pct };
  }, [today]);

  const reportStats = useMemo(() => {
    if (!reportData.length) return { avg: 0, belowCount: 0, totalViolations: 0 };
    const totalPct = reportData.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const belowCount = reportData.filter((r) => (r.percentage || 0) < threshold).length;
    const totalViolations = reportData.reduce((acc, curr) => acc + (curr.violations_count || 0), 0);
    return {
      avg: Math.round(totalPct / reportData.length),
      belowCount,
      totalViolations,
    };
  }, [reportData, threshold]);

  function recordScan(studentId: string, type: "in" | "out") {
    const s = DUMMY_STUDENTS.find((x) => x.id === studentId)!;
    const nowH = new Date().getHours();
    const nowM = new Date().getMinutes();
    const time = `${String(nowH).padStart(2, "0")}:${String(nowM).padStart(2, "0")}`;
    const isLate = type === "in" && (nowH > 9 || (nowH === 9 && nowM > 15));
    const existing = records.find((r) => r.studentId === studentId && r.date === date);

    if (existing) {
      dispatch(
        updateRecord({
          ...existing,
          [type === "in" ? "checkIn" : "checkOut"]: time,
          status: type === "in" ? (isLate ? "late" : "present") : existing.status,
        }),
      );
    } else {
      dispatch(
        addRecord({
          id: `ATT-${Date.now()}`,
          studentId: s.id,
          studentName: s.name,
          batch: s.batch,
          date,
          checkIn: type === "in" ? time : undefined,
          checkOut: type === "out" ? time : undefined,
          status: type === "in" ? (isLate ? "late" : "present") : "present",
          scanType: "qr",
          deviceId: "GATE-01",
        }),
      );
    }
    toast.success(`✅ Check-${type} recorded for ${s.name} at ${time}`);
    if (isLate) toast.warning(`Late mark logged. Parent will be notified.`);
    setScanOpen(false);
  }

  // Monthly attendance %
  const monthStart = new Date(date);
  monthStart.setDate(1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthCells = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(i + 1);
    const k = d.toISOString().slice(0, 10);
    const rec = baseRecords.filter((r) => r.date === k);
    const present = rec.filter((r) => r.status !== "absent").length;
    const pct = rec.length ? Math.round((present / rec.length) * 100) : null;
    return { day: i + 1, date: k, pct };
  });

  // Student report
  const studentScope = ownStudent ? ownStudent : DUMMY_STUDENTS.find((s) => s.id === studentSel)!;
  const last30 = useMemo(() => {
    const out: { date: string; pct: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      const rec = records.find((r) => r.studentId === studentScope.id && r.date === k);
      out.push({
        date: k.slice(5),
        pct: !rec
          ? 0
          : rec.status === "present"
            ? 100
            : rec.status === "late"
              ? 75
              : rec.status === "half-day"
                ? 50
                : 0,
      });
    }
    return out;
  }, [records, studentScope.id]);

  const delayAlerts = records.filter((r) => r.violation);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={
          ownStudent
            ? `Showing attendance for ${ownStudent.name}`
            : "Track and manage daily attendance."
        }
        // actions={
        //   canModify ? (
        //     <Button
        //       onClick={() => setScanOpen(true)}
        //       className="bg-primary hover:bg-primary-dark text-primary-foreground"
        //     >
        //       <ScanLine className="w-4 h-4" /> Simulate QR Scan
        //     </Button>
        //   ) : undefined
        // }
      />

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40 bg-card"
        />
        {!ownStudent && (
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches?.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!ownStudent && (
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger className="w-48 bg-card flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="All Students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {students?.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.full_name || s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!ownStudent && (
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger className="w-48 bg-card flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="All Faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculty</SelectItem>
              {users
                ?.filter((u: any) => u.role === "faculty")
                ?.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name ||
                      (u.first_name
                        ? `${u.first_name} ${u.last_name || ""}`
                        : u.username || u.email)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          title="Present"
          value={stats.present}
          icon={CheckCircle2}
          trendType="up"
          index={0}
        />
        <StatCard title="Absent" value={stats.absent} icon={XCircle} trendType="down" index={1} />
        <StatCard title="Late" value={stats.late} icon={Clock} trendType="warning" index={2} />
        <StatCard title="Attendance %" value={`${stats.pct}%`} icon={Users} index={3} />
      </div> */}

      <Tabs defaultValue={ownStudent ? "report" : "today"}>
        <TabsList>
          {!ownStudent && <TabsTrigger value="today">Today's Attendance</TabsTrigger>}
          {/* <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="report">Student Report</TabsTrigger> */}
          {!ownStudent && (
            <TabsTrigger value="alerts">Delay Alerts ({delayAlerts.length})</TabsTrigger>
          )}
        </TabsList>

        {!ownStudent && (
          <TabsContent value="today">
            {attendanceLoading ? (
              <TableSkeleton rows={8} columns={6} />
            ) : attendanceError ? (
              <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border border-border text-center space-y-3">
                <p className="text-sm text-destructive font-semibold">{attendanceError}</p>
                <Button variant="outline" size="sm" onClick={fetchAttendance}>
                  Try Again
                </Button>
              </div>
            ) : (
              <TodayTable
                data={today}
                canModify={!!canModify}
                // onOverride={setOverride}
                onViolation={setViolation}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="monthly">
          <MonthlyGrid cells={monthCells} />
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          {reportLoading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : reportError ? (
            <div className="flex flex-col items-center justify-center p-8 bg-card rounded-xl border border-border text-center space-y-3">
              <p className="text-sm text-destructive font-semibold">{reportError}</p>
              <Button variant="outline" size="sm" onClick={fetchAttendanceReport}>
                Try Again
              </Button>
            </div>
          ) : ownStudent ? (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column: Gauge and Key Stats */}
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm">
                <h4 className="font-heading text-sm font-semibold text-muted-foreground text-center">
                  Your Attendance
                </h4>
                {reportData[0] ? (
                  <>
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          className="text-muted/20"
                        />
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={377}
                          strokeDashoffset={377 - (377 * (reportData[0].percentage || 0)) / 100}
                          className={cn(
                            "transition-all duration-500",
                            reportData[0].percentage < threshold
                              ? "text-red-500"
                              : "text-emerald-500",
                          )}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-extrabold text-text-primary">
                          {reportData[0].percentage.toFixed(1)}%
                        </span>
                        <span className="text-xxs uppercase tracking-wider text-muted-foreground font-semibold">
                          Goal: {threshold}%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold",
                          reportData[0].percentage < threshold
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200",
                        )}
                      >
                        {reportData[0].percentage < threshold ? "Below Threshold" : "Good Standing"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No data available</p>
                )}
              </div>

              {/* Middle & Right Column: Details & Violations */}
              <div className="md:col-span-2 space-y-6">
                {reportData[0] && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Present Days
                        </span>
                        <p className="text-2xl font-bold text-text-primary">
                          {reportData[0].present_days}{" "}
                          <span className="text-sm font-normal text-muted-foreground font-normal">
                            / {reportData[0].total_days} total
                          </span>
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Total Violations
                        </span>
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            reportData[0].violations_count > 0
                              ? "text-amber-600"
                              : "text-text-primary",
                          )}
                        >
                          {reportData[0].violations_count}
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Avg Entry Time
                        </span>
                        <p className="text-xl font-bold text-text-primary font-mono">
                          {reportData[0].avg_checkin_time || "—"}
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Avg Exit Time
                        </span>
                        <p className="text-xl font-bold text-text-primary font-mono">
                          {reportData[0].avg_checkout_time || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                      <h4 className="font-heading text-sm font-semibold text-text-primary">
                        Violations Breakdown
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.entries(reportData[0].violations_breakdown || {}).map(
                          ([key, val]: any) => (
                            <div
                              key={key}
                              className="bg-muted/30 border border-border/50 rounded-lg p-3 space-y-0.5 text-center"
                            >
                              <span className="text-xxs uppercase tracking-wider text-muted-foreground font-bold">
                                {key.replace(/_/g, " ")}
                              </span>
                              <p
                                className={cn(
                                  "text-lg font-bold",
                                  val > 0 ? "text-amber-600" : "text-muted-foreground/60",
                                )}
                              >
                                {val}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">
                      Avg Attendance
                    </span>
                    <span className="text-xl font-bold text-text-primary">{reportStats.avg}%</span>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-red-100 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">
                      Below Goal ({threshold}%)
                    </span>
                    <span className="text-xl font-bold text-red-600">
                      {reportStats.belowCount} Students
                    </span>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">
                      Total Violations
                    </span>
                    <span className="text-xl font-bold text-amber-600">
                      {reportStats.totalViolations}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <DataTable<any>
                columns={[
                  {
                    key: "name",
                    header: "Student",
                    render: (r) => (
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{r.name}</span>
                        {r.roll_number && (
                          <span className="text-xs text-muted-foreground">
                            Roll: {r.roll_number}
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "percentage",
                    header: "Attendance",
                    render: (r) => {
                      const below = r.percentage < threshold;
                      return (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold border",
                            below
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200",
                          )}
                        >
                          {r.percentage.toFixed(1)}%
                        </span>
                      );
                    },
                  },
                  {
                    key: "present_days",
                    header: "Present / Total",
                    render: (r) => (
                      <span className="text-sm font-medium">
                        {r.present_days} / {r.total_days} days
                      </span>
                    ),
                  },
                  {
                    key: "avg_checkin_time",
                    header: "Avg Check-In",
                    render: (r) => (
                      <span className="text-sm font-mono text-muted-foreground">
                        {r.avg_checkin_time || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "avg_checkout_time",
                    header: "Avg Check-Out",
                    render: (r) => (
                      <span className="text-sm font-mono text-muted-foreground">
                        {r.avg_checkout_time || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "violations_count",
                    header: "Violations",
                    render: (r) => (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-semibold border",
                          r.violations_count > 0
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "text-muted-foreground border-transparent",
                        )}
                      >
                        {r.violations_count}
                      </span>
                    ),
                  },
                ]}
                data={reportData}
                emptyTitle="No student reports found"
                onRowClick={(r) => setSelectedReport(r)}
              />
            </div>
          )}
        </TabsContent>

        {!ownStudent && (
          <TabsContent value="alerts">
            {attendanceLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : (
              <DataTable<AttendanceRecord>
                columns={[
                  { key: "studentName", header: "Student" },
                  {
                    key: "violation",
                    header: "Trigger",
                    render: (r) => <span className="text-xs uppercase">{r.violation}</span>,
                  },
                  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
                  {
                    key: "notify",
                    header: "Parent Notified",
                    render: () => <span className="text-success">✅</span>,
                  },
                ]}
                data={delayAlerts}
                emptyTitle="No alerts triggered"
                onRowClick={(r) => navigate(`/attendance/${r.id}`)}
              />
            )}
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
      {/* <Dialog open={!!override} onOpenChange={(o) => !o && setOverride(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              Manual Override — {override?.studentName}
            </DialogTitle>
          </DialogHeader>
          {override && (
            <OverrideForm
              record={override}
              onSave={(status, reason) => {
                const target = records.find((r) => r.id === override.id);
                if (target) {
                  dispatch(
                    updateRecord({
                      ...target,
                      status,
                      scanType: "manual",
                    }),
                  );
                }
                toast.success(`Attendance manually updated for ${override.studentName}.`);
                setOverride(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog> */}

      {/* Violation */}
      <Dialog open={!!violation} onOpenChange={(o) => !o && setViolation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              Log Violation — {violation?.studentName}
            </DialogTitle>
          </DialogHeader>
          {violation && (
            <ViolationForm
              onSave={(type) => {
                const target = records.find((r) => r.id === violation.id);
                if (target) {
                  dispatch(
                    updateRecord({
                      ...target,
                      violation: type,
                    }),
                  );
                }
                toast.success(`Violation logged for ${violation.studentName}.`);
                setViolation(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Violations breakdown dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">
              Attendance Report — {selectedReport?.name}
            </DialogTitle>
            {selectedReport?.roll_number && (
              <DialogDescription>Roll Number: {selectedReport.roll_number}</DialogDescription>
            )}
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-xxs uppercase tracking-wider text-muted-foreground font-semibold block">
                    Attendance
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold block",
                      selectedReport.percentage < threshold ? "text-red-500" : "text-emerald-500",
                    )}
                  >
                    {selectedReport.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-xxs uppercase tracking-wider text-muted-foreground font-semibold block">
                    Present Days
                  </span>
                  <span className="text-lg font-bold block text-text-primary">
                    {selectedReport.present_days} / {selectedReport.total_days}
                  </span>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-xxs uppercase tracking-wider text-muted-foreground font-semibold block">
                    Avg Entry
                  </span>
                  <span className="text-lg font-bold block text-text-primary font-mono">
                    {selectedReport.avg_checkin_time || "—"}
                  </span>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-xxs uppercase tracking-wider text-muted-foreground font-semibold block">
                    Avg Exit
                  </span>
                  <span className="text-lg font-bold block text-text-primary font-mono">
                    {selectedReport.avg_checkout_time || "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-heading text-sm font-semibold text-text-primary">
                  Violations Breakdown ({selectedReport.violations_count} Total)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(selectedReport.violations_breakdown || {}).map(
                    ([key, val]: any) => (
                      <div
                        key={key}
                        className="bg-muted/20 border border-border/40 rounded-lg p-3 space-y-0.5 text-center"
                      >
                        <span className="text-xxs uppercase tracking-wider text-muted-foreground font-bold block">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span
                          className={cn(
                            "text-base font-bold",
                            val > 0 ? "text-amber-600" : "text-muted-foreground/60",
                          )}
                        >
                          {val}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedReport(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TodayTable({
  data,
  canModify,
  onOverride,
  onViolation,
}: {
  data: AttendanceRecord[];
  canModify: boolean;
  onOverride?: (r: AttendanceRecord) => void;
  onViolation: (r: AttendanceRecord) => void;
}) {
  const navigate = useNavigate();
  const cols: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "studentName",
      header: "Student",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-light text-primary-dark grid place-items-center text-[10px] font-medium animate-pulse-subtle">
            {r.studentName
              ? r.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
              : "—"}
          </div>
          <div>
            <div className="font-semibold text-foreground">{r.studentName || "—"}</div>
            {r.rollNumber && (
              <div className="text-[10px] text-muted-foreground font-mono">
                Roll: {r.rollNumber}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch / Session",
      render: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.batch || "—"}</div>
          {r.sessionDisplay && (
            <div className="text-[10px] text-muted-foreground font-light">{r.sessionDisplay}</div>
          )}
        </div>
      ),
    },
    { key: "checkIn", header: "In", render: (r) => r.checkIn ?? "—" },
    { key: "checkOut", header: "Out", render: (r) => r.checkOut ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const m = ATT_STATUS_META[r.status];
        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-semibold tracking-wide shadow-sm",
              m.bg,
              m.color,
            )}
          >
            {r.statusDisplay || m.label}
          </span>
        );
      },
    },
    {
      key: "scanType",
      header: "Method / Marked By",
      render: (r) => (
        <div>
          <span className="text-xs font-medium uppercase text-muted-foreground">{r.scanType}</span>
          {r.markedByName && (
            <div className="text-[10px] text-muted-foreground font-light">By: {r.markedByName}</div>
          )}
          {r.isCorrected && (
            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-medium font-sans">
              Corrected
            </span>
          )}
        </div>
      ),
    },
    ...(canModify
      ? [
          {
            key: "actions",
            header: "",
            render: (r: AttendanceRecord) => (
              <div className="flex gap-1">
                {/* <Button size="sm" variant="ghost" onClick={() => onOverride(r)}>
                  Override
                </Button> */}
                <Button size="sm" variant="ghost" onClick={() => onViolation(r)}>
                  Violation
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];
  return (
    <DataTable columns={cols} data={data} onRowClick={(r) => navigate(`/attendance/${r.id}`)} />
  );
}

function MonthlyGrid({ cells }: { cells: { day: number; date: string; pct: number | null }[] }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, i) => {
          const color =
            c.pct == null
              ? "bg-muted text-muted-foreground"
              : c.pct >= 80
                ? "bg-green-100 text-green-800"
                : c.pct >= 60
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800";
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
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DUMMY_STUDENTS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          variant={type === "in" ? "default" : "outline"}
          onClick={() => setType("in")}
          className="flex-1"
        >
          Check IN
        </Button>
        <Button
          variant={type === "out" ? "default" : "outline"}
          onClick={() => setType("out")}
          className="flex-1"
        >
          Check OUT
        </Button>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onScan(studentId, type)}
          className="bg-primary hover:bg-primary-dark text-primary-foreground w-full"
        >
          <ScanLine className="w-4 h-4" /> Simulate Scan
        </Button>
      </DialogFooter>
    </div>
  );
}

function OverrideForm({
  record,
  onSave,
}: {
  record: AttendanceRecord;
  onSave: (s: AttStatus, reason: string) => void;
}) {
  const [status, setStatus] = useState<AttStatus>(record.status);
  const [reason, setReason] = useState("");
  return (
    <>
      <div className="space-y-3">
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AttStatus)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ATT_STATUS_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSave(status, reason)}
          className="bg-primary hover:bg-primary-dark text-primary-foreground"
        >
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

function ViolationForm({
  onSave,
}: {
  onSave: (type: "repeated_delay" | "unauthorised_absence") => void;
}) {
  const [type, setType] = useState<"repeated_delay" | "unauthorised_absence">("repeated_delay");
  const [notes, setNotes] = useState("");
  return (
    <>
      <div className="space-y-3">
        <div>
          <Label>Violation Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="repeated_delay">Repeated Delay</SelectItem>
              <SelectItem value="unauthorised_absence">Unauthorised Absence</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSave(type)}
          className="bg-primary hover:bg-primary-dark text-primary-foreground"
        >
          Log Violation
        </Button>
      </DialogFooter>
    </>
  );
}
