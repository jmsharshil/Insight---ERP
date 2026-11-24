import { useEffect, useState, useMemo, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  FileText,
  CalendarDays,
  ExternalLink,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Clock,
} from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setMyPayroll, setMyPayrollLoading } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatDateStr = (dStr?: string) => {
  if (!dStr) return "—";
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dStr;
  }
};

const formatTimeStr = (tStr?: string) => {
  if (!tStr) return "—";
  try {
    if (typeof tStr === "string" && tStr.includes("T")) {
      const d = new Date(tStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      }
    }
    if (typeof tStr === "string") {
      const parts = tStr.split(":");
      if (parts.length >= 2) {
        let hour = parseInt(parts[0], 10);
        const minute = parts[1];
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${ampm}`;
      }
    }
    return String(tStr);
  } catch {
    return String(tStr);
  }
};

const DeductionNoteCell = ({ row }: { row: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!row.deduction_note) {
    return <span className="text-muted-foreground">—</span>;
  }

  const parts: string[] = [];
  let current = "";
  row.deduction_note.split(/,\s*/).forEach((chunk: string) => {
    if (current) current += ", " + chunk;
    else current = chunk;

    // Check if the chunk ends with an adjustment/deduction amount (e.g. ": -16500.00" or ": +1500.00")
    if (/:\s*[+-]?\d+(\.\d+)?\s*$/.test(chunk)) {
      parts.push(current);
      current = "";
    }
  });
  if (current) parts.push(current);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-primary hover:text-primary/80 mt-1"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        View Deduction note
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] ">
          <DialogHeader>
            <DialogTitle>Deduction & Adjustment Note</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              {parts.map((part, idx) => {
                const match = part.match(/^(.*?):\s*([+-]?\d+(\.\d+)?)\s*$/);
                if (match) {
                  const text = match[1];
                  const amountStr = match[2];
                  const isPositive = amountStr.startsWith("+");
                  
                  let title = text;
                  let dates: string[] = [];
                  const absenceMatch = text.match(/^Absent(?: \(\d+ days?\))? on (.*)/);
                  if (absenceMatch) {
                    title = "Absence Deductions";
                    dates = absenceMatch[1].split(/,\s*/);
                  }
                  
                  const parsedAmount = Math.abs(Number(amountStr));
                  
                  return (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-foreground">{title}</h4>
                          {dates.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                              {dates.length} day{dates.length > 1 ? 's' : ''} absent
                            </p>
                          )}
                        </div>
                        <span className={`font-mono text-sm font-medium shrink-0 px-2 py-1 rounded-md border ${
                          isPositive
                            ? "text-green-600 bg-green-50 border-green-100"
                            : "text-red-600 bg-red-50 border-red-100"
                        }`}>
                          {isPositive ? "+" : "-"} ₹{parsedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {dates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {dates.map((d, i) => (
                            <Badge key={`${d}-${i}`} variant="outline" className="text-[11px] font-normal bg-slate-50 text-slate-600 border-slate-200">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-border shadow-sm text-sm text-muted-foreground">
                    {part}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ReimbursementNoteCell = ({ row }: { row: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const notes = row.reimbursement_notes || [];

  if (!notes || notes.length === 0) {
    return null;
  }

  const isUUID = (val: any): boolean => {
    if (!val || typeof val !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  };

  const handleCardClick = (note: any) => {
    setIsOpen(false);
    const q = new URLSearchParams();
    q.set("tab", "reimbursements");
    const candidates = [
      note?.user_id,
      note?.user,
      row?.user_id,
      row?.faculty_id,
      row?.faculty,
      row?.employee?.id,
      row?.user?.id,
      row?.employee_id,
      row?.user,
    ];
    let userVal: string | null = null;
    for (const c of candidates) {
      if (isUUID(c)) {
        userVal = String(c).trim();
        break;
      }
    }
    if (!userVal) {
      userVal = row?.faculty_name || (typeof row?.user === "string" ? row.user : "") || null;
    }
    if (userVal) q.set("user_id", userVal);
    if (note.date) {
      q.set("from_date", note.date);
      q.set("to_date", note.date);
    }
    navigate(`/payroll?${q.toString()}`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 px-1.5 text-[11px] text-primary hover:text-primary/80 mt-1 block"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        View Claims ({notes.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Expense Reimbursements</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              {notes.map((note: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => handleCardClick(note)}
                  className="bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/60 hover:shadow-md hover:bg-slate-50/50 transition-all cursor-pointer group"
                  title="Click to view in Reimbursements tab"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {note.event || note.description || "Expense Claim"}
                        </h4>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0" />
                      </div>
                      {note.description && note.event && (
                        <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                          {note.description}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-sm text-green-600 font-semibold shrink-0 bg-green-50 px-2.5 py-1 rounded-md border border-green-100">
                      ₹{Number(note.expense || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40 text-xs">
                    {note.date ? (
                      <Badge variant="outline" className="text-[11px] font-normal bg-slate-50 text-slate-600 border-slate-200">
                        {note.date}
                      </Badge>
                    ) : <span />}
                    <span className="text-[11px] text-primary font-medium opacity-80 group-hover:opacity-100 flex items-center gap-1">
                      Open in Reimbursements Tab →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const OdometerNoteCell = ({
  row,
  onNavigateToOdometer,
}: {
  row: any;
  onNavigateToOdometer?: (note?: any, row?: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const notes = row.odometer_notes || [];

  if (!notes || notes.length === 0) {
    return null;
  }

  const isUUID = (val: any): boolean => {
    if (!val || typeof val !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  };

  const handleCardClick = (note: any) => {
    setIsOpen(false);
    if (onNavigateToOdometer) {
      onNavigateToOdometer(note, row);
    } else {
      const q = new URLSearchParams();
      q.set("tab", "odometer");
      const candidates = [
        note?.user_id,
        note?.user,
        row?.user_id,
        row?.faculty_id,
        row?.faculty,
        row?.employee?.id,
        row?.user?.id,
        row?.employee_id,
        row?.user,
      ];
      let userVal: string | null = null;
      for (const c of candidates) {
        if (isUUID(c)) {
          userVal = String(c).trim();
          break;
        }
      }
      if (!userVal) {
        userVal = row?.faculty_name || (typeof row?.user === "string" ? row.user : "") || null;
      }
      if (userVal) q.set("user_id", userVal);
      if (note.date) {
        q.set("from_date", note.date);
        q.set("to_date", note.date);
      }
      navigate(`/payroll?${q.toString()}`);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 px-1.5 text-[11px] text-primary hover:text-primary/80 mt-1 block"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        View Travel ({notes.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Travel / Odometer Claims</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              {notes.map((note: any, idx: number) => {
                const adjReason = note.adjustment_reason || note.deduction_reason || note.notes || note.reason;
                return (
                  <div
                    key={idx}
                    onClick={() => handleCardClick(note)}
                    className="bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/60 hover:shadow-md hover:bg-slate-50/50 transition-all cursor-pointer group"
                    title="Click to view in Odometer Readings tab"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {note.event || "Travel Claim"}
                          </h4>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                          {note.kms ? `${note.kms} kms` : ""}{note.rate_per_km ? ` @ ₹${note.rate_per_km}/km` : ""}{note.vehicle_type ? ` · ${note.vehicle_type}` : ""}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-green-600 font-semibold shrink-0 bg-green-50 px-2.5 py-1 rounded-md border border-green-100">
                        ₹{Number(note.expense || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {adjReason && (
                      <div className="mt-2 bg-amber-50 border border-amber-200/90 rounded-md p-2 text-xs text-amber-900 leading-snug">
                        <span className="font-bold text-amber-950 block text-[10px] uppercase tracking-wider mb-0.5">
                          Adjustment Reason:
                        </span>
                        <span className="break-words font-medium">{adjReason}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40 text-xs">
                      {note.date ? (
                        <Badge variant="outline" className="text-[11px] font-normal bg-slate-50 text-slate-600 border-slate-200">
                          {note.date}
                        </Badge>
                      ) : <span />}
                      <span className="text-[11px] text-primary font-medium opacity-80 group-hover:opacity-100 flex items-center gap-1">
                        Open in Odometer Tab →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MONTHS = [
  {v:"all",l:"All Months"},{v:"1",l:"January"},{v:"2",l:"February"},
  {v:"3",l:"March"},{v:"4",l:"April"},{v:"5",l:"May"},{v:"6",l:"June"},
  {v:"7",l:"July"},{v:"8",l:"August"},{v:"9",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS  = [
  {v:"all",l:"All Years"},{v:"2024",l:"2024"},{v:"2025",l:"2025"},
  {v:"2026",l:"2026"},{v:"2027",l:"2027"},
];
const STATUSES = [
  {v:"all",l:"All Statuses"},{v:"draft",l:"Draft"},
  {v:"pending_approval",l:"Pending Approval"},{v:"approved",l:"Approved"},
  {v:"disbursed",l:"Disbursed"},
];

const STATUS_BADGE: Record<string, string> = {
  draft:            "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved:         "bg-green-100 text-green-700",
  disbursed:        "bg-blue-100 text-blue-700",
};

export default function MyPayrollTab({
  onNavigateToOdometer,
}: {
  onNavigateToOdometer?: (note?: any, row?: any) => void;
} = {}) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { myPayroll, myPayrollLoading } = useSelector((s: RootState) => s.payroll);

  const [month,  setMonth]  = useState("all");
  const [year,   setYear]   = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState("all");
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDay = (key: string) => {
    setExpandedDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRowClick = (slip: any) => {
    const emp = myPayroll?.employee;
    const empName = slip.faculty_name || slip.employee_name || emp?.name || user?.name || "Employee";
    const empId = slip.employee_id || emp?.employee_id || "—";
    const roleName = slip.employment_type || emp?.role || user?.role || "";
    const runId = slip.payroll_run || slip.run_id || slip.payroll_run_id || "";

    const query = runId ? `?run_id=${runId}` : "";
    navigate(`/payroll/payslips/${slip.id}${query}`, {
      state: {
        payslip: {
          ...slip,
          faculty_name: empName,
          employee_id: empId,
          employment_type: roleName,
        },
        run: {
          id: runId,
          month: Number(slip.payroll_month || 0),
          year: Number(slip.payroll_year || 0),
          branch_name: emp?.branch || emp?.branch_name || (user as any)?.branch_name || "",
          status: slip.payroll_status?.toLowerCase() || (slip.is_disbursed ? "disbursed" : "pending"),
        },
      },
    });
  };

  const fetch = () => {
    const p = new URLSearchParams();
    if (month && month !== "all")  p.set("month",  month);
    if (year && year !== "all")   p.set("year",   year);
    if (status && status !== "all") p.set("status", status);
    dispatch({
      type: payrollActions.GET_MY_PAYROLL,
      method: "GET",
      endPoint: `${API.PAYROLL.MY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setMyPayrollLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setMyPayroll(res));
        else toast.error("Failed to load payroll history.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading payroll"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const summary = myPayroll?.summary;

  const sessionInfoMap = useMemo(() => {
    const map = new Map<string, { date: string; batch_name?: string; subject_name?: string; chapter_covered?: string; duration_minutes?: number }>();
    (myPayroll?.payslips || []).forEach((slip: any) => {
      const dayLogs = slip.per_day_deduction_log || slip.late_deduction_log || [];
      dayLogs.forEach((day: any) => {
        (day.sessions || []).forEach((sess: any) => {
          if (sess.id) {
            map.set(sess.id, {
              date: day.date,
              batch_name: sess.batch_name,
              subject_name: sess.subject_name,
              chapter_covered: sess.chapter_covered,
              duration_minutes: sess.duration_minutes,
            });
          }
        });
      });
    });
    return map;
  }, [myPayroll]);

  const allDeductionLogs = useMemo(() => {
    return (myPayroll?.payslips || []).flatMap((slip: any) => 
      (slip.per_day_deduction_log || slip.late_deduction_log || []).map((log: any) => ({
        ...log,
        slipMonth: slip.payroll_month,
        slipYear: slip.payroll_year,
        slipId: slip.id,
      }))
    );
  }, [myPayroll]);

  const allLateLogs = useMemo(() => {
    return (myPayroll?.payslips || []).flatMap((slip: any) =>
      (slip.late_logs || []).map((l: any) => ({
        ...l,
        slipMonth: slip.payroll_month,
        slipYear: slip.payroll_year,
        slipId: slip.id,
      }))
    );
  }, [myPayroll]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-sm w-40">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.v} value={m.v}>
                  {m.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-sm w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y.v} value={y.v}>
                  {y.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-sm w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.v} value={s.v}>
                  {s.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={fetch}
          className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
        >
          Apply
        </Button>
      </div>

      {myPayrollLoading ? (
        <TableSkeleton columns={11} rows={4} className="mt-0" />
      ) : (
        <Tabs defaultValue="deduction_logs" className="w-full space-y-4">
          <TabsList className="bg-card border border-border h-11 p-1">
            <TabsTrigger
              value="deduction_logs"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-6 h-full"
            >
              Per Day Deduction Logs
            </TabsTrigger>
            <TabsTrigger
              value="payslips"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-6 h-full"
            >
              Monthly Payslips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payslips" className="space-y-5 outline-none">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Payslips",
                    value: summary.total_payslips,
                    icon: FileText,
                    cls: "bg-blue-50 text-blue-600",
                  },
                  {
                    label: "Total Net Earned",
                    value: `₹${Number(summary.total_net_earned ?? 0).toLocaleString("en-IN")}`,
                    icon: TrendingUp,
                    cls: "bg-green-50 text-green-600",
                  },
                  {
                    label: "Total Disbursed",
                    value: `₹${Number(summary.total_disbursed ?? 0).toLocaleString("en-IN")}`,
                    icon: Wallet,
                    cls: "bg-primary/10 text-primary",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-xl border border-border p-4 flex items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.cls}`}
                    >
                      <card.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{card.value}</div>
                      <div className="text-xs text-muted-foreground">{card.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Employee Info */}
            {myPayroll?.employee && (
              <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {myPayroll.employee.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{myPayroll.employee.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {myPayroll.employee.employee_id} · {myPayroll.employee.email}
                  </div>
                </div>
                <Badge className="ml-auto text-xs capitalize bg-muted text-muted-foreground">
                  {myPayroll.employee.role?.replace(/_/g, " ")}
                </Badge>
              </div>
            )}

            {/* Payslips Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[950px]">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      {[
                        "Month / Year",
                        "Basic",
                        "Bonus / Extra Shift",
                        "Reimbursements",
                        "Travel (Odometer)",
                        "Deductions",
                        "Deduction Note",
                        "Net Salary",
                        "Sessions / Papers",
                        "Status",
                        "",
                      ].map((h, idx) => (
                        <th
                          key={idx}
                          className={`px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap ${
                            h === "" ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!myPayroll?.payslips?.length ? (
                      <tr>
                        <td colSpan={11} className="text-center py-12 text-muted-foreground text-sm">
                          No payslip records found.
                        </td>
                      </tr>
                    ) : (
                      myPayroll.payslips.map((slip, i) => (
                        <motion.tr
                          key={slip.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.025 }}
                          onClick={() => handleRowClick(slip)}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            {slip.payroll_month} / {slip.payroll_year}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            ₹{Number(slip.basic_salary || slip.salary || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-green-600">
                            {slip.bonus > 0 || Number(slip.extra_shift_allowance || 0) > 0
                              ? `₹${Number(slip.bonus || slip.extra_shift_allowance).toLocaleString("en-IN")}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {Number(slip.reimbursements_amount || 0) > 0 ? (
                              <div>
                                <div className="text-green-600 font-medium">
                                  ₹{Number(slip.reimbursements_amount).toLocaleString("en-IN")}
                                </div>
                                <ReimbursementNoteCell row={slip} />
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {Number(slip.odometer_amount || 0) > 0 ? (
                              <div>
                                <div className="text-green-600 font-medium">
                                  ₹{Number(slip.odometer_amount).toLocaleString("en-IN")}
                                </div>
                                <OdometerNoteCell row={slip} onNavigateToOdometer={onNavigateToOdometer} />
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-red-600">
                            ₹
                            {(
                              Number(slip.late_penalty || 0) +
                              Number(slip.leave_deductions || 0) +
                              Number(slip.absence_deductions || 0) +
                              Number(slip.retention_deduction || 0) +
                              Number(slip.other_deductions || 0)
                            ).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <DeductionNoteCell row={slip} />
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-bold text-primary">
                            ₹{Number(slip.net_salary || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {Number(slip.per_paper_rate || 0) > 0 || myPayroll?.employee?.role === "paper_checker" ? (
                              <div>
                                <div className="font-medium text-foreground">{slip.sessions_conducted} papers</div>
                                <div className="text-muted-foreground text-[10px]">₹{slip.per_paper_rate || 50}/paper</div>
                              </div>
                            ) : (slip as any)?.exam_supervisor_summary || myPayroll?.employee?.role === "exam_supervisor" ? (
                              <div>
                                <div className="font-medium text-foreground">
                                  {(slip as any)?.exam_supervisor_summary?.total_exams_present ?? slip.sessions_conducted} exams
                                </div>
                                <div className="text-muted-foreground text-[10px]">
                                  {(slip as any)?.exam_supervisor_summary?.total_hours || slip.total_session_hours || slip.total_hours || "0"} hrs
                                </div>
                              </div>
                            ) : (
                              `${slip.sessions_conducted} sessions`
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`text-xs ${STATUS_BADGE[(slip.payroll_status?.toLowerCase().replace(" ", "_") || "") as keyof typeof STATUS_BADGE] || "bg-yellow-100 text-yellow-700"}`}
                            >
                              {slip.payroll_status || (slip.is_disbursed ? "Disbursed" : "Pending")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 px-2.5 text-primary hover:text-primary/80 group-hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(slip);
                              }}
                            >
                              View Payslip <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deduction_logs" className="outline-none space-y-6">
            {/* 1. Daily Attendance & Deduction Breakdown */}
            <div className="bg-white rounded-xl border border-border p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Daily Attendance & Deduction Logs
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Detailed day-wise earnings, conducted class reports, attendance deficit, early exits, and policy penalties
                  </p>
                </div>
                {allDeductionLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allKeys = allDeductionLogs.reduce((acc: any, d: any) => ({ ...acc, [d.date]: true }), {});
                      const isAllExpanded = allDeductionLogs.every((d: any) => expandedDays[d.date]);
                      setExpandedDays(isAllExpanded ? {} : allKeys);
                    }}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {allDeductionLogs.every((d: any) => expandedDays[d.date])
                      ? "Collapse All Sessions"
                      : "Expand All Sessions"}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Date & Sessions</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Hours (Duration)</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Gross Salary</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Attendance Deficit</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Penalty (Mins / Amt)</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Daily Deduction</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">Net Daily Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {!allDeductionLogs.length ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                          No daily deduction logs found.
                        </td>
                      </tr>
                    ) : (
                      allDeductionLogs.map((log: any, i: number) => {
                        const deductAmt = Number(log.deduction ?? log.penalty_amount ?? log.amount ?? 0);
                        const grossAmt = Number(log.gross_salary || 0);
                        const netAmt = Number(log.net_salary || 0);
                        const penaltyAmt = Number(log.penalty_amount || 0);
                        const lateMins = Number(log.late_minutes ?? 0);
                        const earlyOutMins = Number(log.early_out_minutes ?? 0);
                        const penaltyMins = Number(log.penalty_minutes ?? 0);
                        const sessions = log.sessions || [];
                        const isExpanded = Boolean(expandedDays[log.date]);

                        return (
                          <Fragment key={`day-${log.date || i}`}>
                            <tr
                              onClick={() => sessions.length > 0 && toggleDay(log.date)}
                              className={`transition-colors ${sessions.length > 0 ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/20"}`}
                            >
                              <td className="px-4 py-3 font-medium font-mono text-foreground whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {sessions.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDay(log.date);
                                      }}
                                      className="p-0.5 rounded hover:bg-muted text-muted-foreground cursor-pointer"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="w-3.5" />
                                  )}
                                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                                  <span className="font-semibold">{formatDateStr(log.date)}</span>
                                  {sessions.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-muted/60 text-muted-foreground font-sans">
                                      {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono whitespace-nowrap">
                                <span className="font-medium">{log.total_hours ? `${log.total_hours} hrs` : "—"}</span>
                                {log.duration_minutes ? (
                                  <span className="text-[10px] text-muted-foreground block">{log.duration_minutes} mins</span>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">
                                ₹{grossAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-mono whitespace-nowrap">
                                {lateMins > 0 || earlyOutMins > 0 ? (
                                  <div className="space-y-0.5">
                                    {lateMins > 0 && (
                                      <span className="text-amber-600 font-semibold block text-[11px]">
                                        {lateMins} min late
                                      </span>
                                    )}
                                    {earlyOutMins > 0 && (
                                      <span className="text-orange-600 font-semibold block text-[11px]">
                                        {earlyOutMins} min early exit
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-emerald-600 font-medium text-[11px]">On Time</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono whitespace-nowrap">
                                {penaltyMins > 0 || penaltyAmt > 0 ? (
                                  <div>
                                    <span className="text-red-600 font-medium block">
                                      {penaltyMins} min penalty
                                    </span>
                                    <span className="text-red-700 font-semibold text-[11px] block">
                                      ₹{penaltyAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono whitespace-nowrap">
                                {deductAmt > 0 ? (
                                  <span className="text-red-600 font-semibold">
                                    - ₹{deductAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">₹0.00</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-right whitespace-nowrap">
                                ₹{netAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>

                            {/* Expanded Nested Sessions */}
                            {isExpanded && sessions.length > 0 && (
                              <tr className="bg-slate-50/70">
                                <td colSpan={7} className="px-4 py-3 pl-8">
                                  <div className="space-y-2 border-l-2 border-primary/40 pl-3">
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                      <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                                        Conducted Classes & Sessions for {formatDateStr(log.date)} ({sessions.length})
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                      {sessions.map((sess: any, sIdx: number) => {
                                        const sGross = Number(sess.gross_salary || 0);
                                        const sPenalty = Number(sess.penalty_amount || 0);
                                        const sLate = sess.late_minutes ?? 0;
                                        const sEarly = sess.early_out_minutes ?? 0;
                                        const sPenMins = sess.penalty_minutes ?? 0;

                                        return (
                                          <div
                                            key={`sess-${sess.id || sIdx}`}
                                            className="bg-white border border-border/80 rounded-lg p-3 text-xs space-y-1.5 shadow-xs"
                                          >
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[10px] font-mono hover:bg-slate-100">
                                                  {sess.batch_name || "Batch"}
                                                </Badge>
                                                <span className="font-semibold text-slate-900">
                                                  {sess.subject_name || "Subject"}
                                                </span>
                                                {sess.chapter_covered && (
                                                  <span className="text-muted-foreground text-[11px] italic">
                                                    • {sess.chapter_covered}
                                                  </span>
                                                )}
                                              </div>
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] py-0 capitalize bg-emerald-50 text-emerald-700 border-emerald-200"
                                              >
                                                {sess.status || "Completed"}
                                              </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
                                              <div>
                                                <span className="text-muted-foreground block text-[10px] uppercase">Scheduled Timing</span>
                                                <span className="font-mono text-slate-800 font-medium">
                                                  {formatTimeStr(sess.scheduled_start)} – {formatTimeStr(sess.scheduled_end)}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground block text-[10px] uppercase">Actual Session</span>
                                                <span className="font-mono text-slate-800 font-medium">
                                                  {formatTimeStr(sess.actual_start)} – {formatTimeStr(sess.actual_end)}
                                                </span>
                                                <span className="text-muted-foreground text-[10px] block">
                                                  {sess.duration_hours} hrs ({sess.duration_minutes}m)
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground block text-[10px] uppercase">Deficit & Penalty</span>
                                                {sLate > 0 || sEarly > 0 ? (
                                                  <div className="space-y-0.5">
                                                    {sLate > 0 && (
                                                      <span className="text-amber-600 font-medium block">
                                                        {sLate}m late
                                                      </span>
                                                    )}
                                                    {sEarly > 0 && (
                                                      <span className="text-orange-600 font-medium block">
                                                        {sEarly}m early exit
                                                      </span>
                                                    )}
                                                    {sPenMins > 0 && (
                                                      <span className="text-red-600 font-semibold block">
                                                        Penalty: {sPenMins}m (- ₹{sPenalty.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                                                      </span>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="text-emerald-600 font-medium">No penalties</span>
                                                )}
                                              </div>
                                              <div className="text-right">
                                                <span className="text-muted-foreground block text-[10px] uppercase">Session Earnings</span>
                                                <span className="font-mono font-semibold text-slate-900 block">
                                                  ₹{sGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </span>
                                                {sPenalty > 0 && (
                                                  <span className="font-mono text-red-600 font-medium text-[10px] block">
                                                    Penalty: - ₹{sPenalty.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Session Check-in Audit Logs (if present) */}
            {allLateLogs.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-5 space-y-4 shadow-xs">
                <div className="border-b border-border/70 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      Session Check-in Audit Logs
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Detailed punch-in & exit timestamps, attendance deviations, and automated policy penalties
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {allLateLogs.length} session check-in(s)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Date & Batch / Subject</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Scheduled Timing</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Actual Check-in / Out</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Attendance Deficit</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Penalty Mins</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Grace Period</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-right">Session Penalty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-border/50">
                      {allLateLogs.map((log: any, i: number) => {
                        const lateMins = log.late_minutes ?? log.minutes ?? 0;
                        const earlyOutMins = log.early_out_minutes ?? 0;
                        const penaltyMins = log.penalty_minutes ?? 0;
                        const penaltyAmt = Number(log.penalty_amount ?? log.deduction ?? log.penalty ?? 0);
                        const scheduledStartStr = formatTimeStr(log.scheduled_time);
                        const scheduledEndStr = formatTimeStr(log.scheduled_end);
                        const actualStartStr = formatTimeStr(log.actual_start);
                        const actualEndStr = formatTimeStr(log.actual_end);

                        const sessionInfo = sessionInfoMap.get(log.session_report);
                        const displayDate = log.date || sessionInfo?.date;

                        return (
                          <tr key={`late-${i}`} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <div className="font-mono font-medium text-foreground flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                                {displayDate ? formatDateStr(displayDate) : "Session"}
                              </div>
                              {sessionInfo?.batch_name && (
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  <span className="font-semibold text-slate-800">{sessionInfo.batch_name}</span>
                                  {sessionInfo.subject_name && ` • ${sessionInfo.subject_name}`}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                              <span className="font-medium text-slate-800">
                                {scheduledStartStr}
                                {scheduledEndStr !== "—" ? ` – ${scheduledEndStr}` : ""}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                              <span className="text-slate-800 font-medium">
                                {actualStartStr}
                                {actualEndStr !== "—" ? ` – ${actualEndStr}` : ""}
                              </span>
                              {log.duration_minutes ? (
                                <span className="text-[10px] text-muted-foreground block">{log.duration_minutes} min duration</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                              <div className="space-y-0.5">
                                {lateMins > 0 ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                    {lateMins}m late
                                  </span>
                                ) : null}
                                {earlyOutMins > 0 ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200 ml-1">
                                    {earlyOutMins}m early exit
                                  </span>
                                ) : null}
                                {lateMins === 0 && earlyOutMins === 0 && (
                                  <span className="text-emerald-600 font-medium text-[11px]">On Time</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                              {penaltyMins > 0 ? (
                                <span className="text-red-600 font-semibold">{penaltyMins} mins</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {log.grace_applied ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0">
                                  Grace Applied
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">No Grace</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-right font-medium whitespace-nowrap">
                              {penaltyAmt > 0 ? (
                                <span className="text-red-600 font-bold">
                                  - ₹{penaltyAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">₹0.00</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
