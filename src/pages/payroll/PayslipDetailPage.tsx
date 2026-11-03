import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Printer,
  Sliders,
  ExternalLink,
  Car,
  Receipt,
  CalendarDays,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
} from "lucide-react";

import type { RootState, AppDispatch } from "@/store";
import type { PaySlip, PayrollRun } from "@/redux/slices/payrollSlice";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PayslipAdjustSheet from "./components/PayslipAdjustSheet";

const MONTH_NAMES: Record<number, string> = {
  1: "January", 2: "February", 3: "March", 4: "April",
  5: "May", 6: "June", 7: "July", 8: "August",
  9: "September", 10: "October", 11: "November", 12: "December",
};

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();

  const role = user?.role ?? "";
  const isAdmin = ["super_admin", "branch_manager"].includes(role);
  const isAccountant = ["accountant"].includes(role);
  const canAdjust = (isAdmin || isAccountant);

  const queryRunId = searchParams.get("run_id");

  // Read state passed via navigation
  const statePayslip = location.state?.payslip as PaySlip | undefined;
  const stateRun = location.state?.run as PayrollRun | undefined;

  // Redux fallbacks
  const { payslips, selectedRun, myPayroll } = useSelector((s: RootState) => s.payroll);

  const [payslip, setPayslip] = useState<PaySlip | null>(() => {
    if (statePayslip && statePayslip.id === id) return statePayslip;
    const foundInList = payslips.find((p) => p.id === id);
    if (foundInList) return foundInList;
    const foundInMy = myPayroll?.payslips?.find((p) => p.id === id);
    if (foundInMy) return foundInMy;
    return null;
  });

  const [run, setRun] = useState<PayrollRun | null>(stateRun || selectedRun || null);
  const [loading, setLoading] = useState<boolean>(!payslip);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const activeRunId = queryRunId || run?.id || selectedRun?.id || "";

  // If payslip is missing or needs fresh data from server
  useEffect(() => {
    if (!payslip && id) {
      if (activeRunId) {
        setLoading(true);
        dispatch({
          type: payrollActions.GET_PAYSLIP_DETAIL,
          method: "GET",
          endPoint: API.PAYROLL.PAYSLIP_DETAIL(activeRunId, id),
          auth: true,
          setLoading: (v: boolean) => setLoading(v),
          getResponse: (res: any) => {
            const data = res?.data || res;
            if (data?.id) {
              setPayslip(data);
            }
          },
          getError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to load payslip details");
          },
        });
      } else {
        // Look up in Redux payslips or myPayroll
        const found = payslips.find((p) => p.id === id) || myPayroll?.payslips?.find((p) => p.id === id);
        if (found) {
          setPayslip(found);
          setLoading(false);
        } else {
          // Attempt to load my-payroll if user is employee
          dispatch({
            type: payrollActions.GET_MY_PAYROLL,
            method: "GET",
            endPoint: API.PAYROLL.MY,
            auth: true,
            setLoading: (v: boolean) => setLoading(v),
            getResponse: (res: any) => {
              const matched = res?.payslips?.find((p: any) => p.id === id);
              if (matched) {
                setPayslip(matched);
              }
            },
            getError: () => {},
          });
        }
      }
    }
  }, [id, activeRunId, payslip, payslips, myPayroll, dispatch, toast]);

  // Calculations
  const calculations = useMemo(() => {
    if (!payslip) return null;

    const basicSalary = Number(payslip.basic_salary || payslip.salary || 0);
    const hourBased = Number(payslip.hour_based_amount || 0);
    const bonus = Number(payslip.bonus || 0);
    const extraShift = Number(payslip.extra_shift_allowance || 0);
    const attendanceBonus = Number(payslip.attendance_bonus || 0);
    const leaveEncashment = Number(payslip.leave_encashment || 0);
    const reimbursements = Number(payslip.reimbursements_amount || 0);
    const odometer = Number(payslip.odometer_amount || 0);

    const grossEarnings =
      basicSalary +
      hourBased +
      bonus +
      extraShift +
      attendanceBonus +
      leaveEncashment +
      reimbursements +
      odometer;

    const absenceDeductions = Number(payslip.absence_deductions || 0);
    const retentionDeduction = Number(payslip.retention_deduction || 0);
    const latePenalty = Number(payslip.late_penalty || 0);
    const leaveDeductions = Number(payslip.leave_deductions || 0);
    const otherDeductions = Number(payslip.other_deductions || 0);

    const totalDeductions =
      absenceDeductions +
      retentionDeduction +
      latePenalty +
      leaveDeductions +
      otherDeductions;

    const netSalary = Number(payslip.net_salary || grossEarnings - totalDeductions);

    return {
      basicSalary,
      hourBased,
      bonus,
      extraShift,
      attendanceBonus,
      leaveEncashment,
      reimbursements,
      odometer,
      grossEarnings,
      absenceDeductions,
      retentionDeduction,
      latePenalty,
      leaveDeductions,
      otherDeductions,
      totalDeductions,
      netSalary,
    };
  }, [payslip]);

  // Parse deduction note
  const parsedDeductionParts = useMemo(() => {
    if (!payslip?.deduction_note) return [];
    const parts: string[] = [];
    let current = "";
    payslip.deduction_note.split(/,\s*/).forEach((chunk: string) => {
      const isStartOfNew = /^Absent/.test(chunk) || /^Late check-in\/out/.test(chunk) || /^Leave/.test(chunk) || /^Retention/.test(chunk);
      if (current && /:\s*[+-]?\d+(\.\d+)?\s*$/.test(current)) {
        parts.push(current);
        current = chunk;
      } else if (isStartOfNew && current) {
        parts.push(current);
        current = chunk;
      } else {
        if (current) current += ", " + chunk;
        else current = chunk;
      }
    });
    if (current) parts.push(current);
    return parts;
  }, [payslip?.deduction_note]);

  const isUUID = (val: any): boolean => {
    if (!val || typeof val !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  };

  const handleNavigateToOdometer = (note?: any) => {
    const q = new URLSearchParams();
    q.set("tab", "odometer");

    const candidates = [
      note?.user_id,
      note?.user,
      payslip?.user_id,
      payslip?.faculty,
      (payslip as any)?.employee?.id,
      (payslip as any)?.user?.id,
      payslip?.employee_id,
    ];
    let userVal: string | null = null;
    for (const c of candidates) {
      if (isUUID(c)) {
        userVal = String(c).trim();
        break;
      }
    }
    if (!userVal) {
      userVal = payslip?.faculty_name || null;
    }
    if (userVal) q.set("user_id", userVal);
    if (note?.date) {
      q.set("from_date", note.date);
      q.set("to_date", note.date);
    }
    navigate(`/payroll?${q.toString()}`);
  };

  const handleNavigateToReimbursements = (reimb?: any) => {
    const q = new URLSearchParams();
    q.set("tab", "reimbursements");

    const candidates = [
      reimb?.user_id,
      reimb?.user,
      payslip?.user_id,
      payslip?.faculty,
      (payslip as any)?.employee?.id,
      (payslip as any)?.user?.id,
      payslip?.employee_id,
    ];
    let userVal: string | null = null;
    for (const c of candidates) {
      if (isUUID(c)) {
        userVal = String(c).trim();
        break;
      }
    }
    if (!userVal) {
      userVal = payslip?.faculty_name || null;
    }
    if (userVal) q.set("user_id", userVal);
    if (reimb?.date) {
      q.set("from_date", reimb.date);
      q.set("to_date", reimb.date);
    }
    navigate(`/payroll?${q.toString()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Loading payslip details…</p>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center max-w-lg mx-auto mt-12 shadow-sm">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Payslip Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The requested payslip record could not be loaded. It may have been modified or deleted.
        </p>
        <Button onClick={() => navigate("/payroll")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Payroll
        </Button>
      </div>
    );
  }

  const isFaculty = Boolean(payslip.faculty);
  const monthLabel = run?.month
    ? MONTH_NAMES[run.month]
    : payslip.payroll_month
      ? payslip.payroll_month
      : "";
  const yearLabel = run?.year || payslip.payroll_year || "";
  const periodLabel = monthLabel && yearLabel ? `${monthLabel} ${yearLabel}` : monthLabel || yearLabel || "Current Period";

  return (
    <div className="w-full space-y-6 pb-12 payslip-detail-container">
      {/* ── Print Stylesheet ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .payslip-print-view, .payslip-print-view * {
            visibility: visible;
          }
          .payslip-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Top Navigation Bar (Hidden in Print) ── */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Payroll</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">Payslips</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-semibold text-foreground">{payslip.faculty_name}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-0.5">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Salary Payslip · {periodLabel}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canAdjust && !payslip.is_disbursed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustOpen(true)}
              className="h-9 text-xs gap-1.5 border-border hover:bg-muted/50"
            >
              <Sliders className="w-3.5 h-3.5" /> Adjust Payslip
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 text-xs gap-1.5 bg-white shadow-sm"
          >
            <Printer className="w-4 h-4 text-muted-foreground" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* ── Employee Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-xl shrink-0 shadow-inner">
              {payslip.faculty_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {payslip.faculty_name}
                </h2>
                <Badge
                  className={`text-[11px] font-semibold capitalize px-2.5 py-0.5 ${
                    payslip.is_disbursed
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  {payslip.is_disbursed ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Disbursed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending Disbursement
                    </span>
                  )}
                </Badge>
                {payslip.is_manually_adjusted && (
                  <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                    Manually Adjusted
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono bg-muted/60 px-2 py-0.5 rounded text-foreground/80 font-medium">
                  {payslip.employee_id}
                </span>
                <span>•</span>
                <span className="capitalize font-medium text-foreground/80">
                  {isFaculty ? "Faculty Member" : "Staff Member"}
                </span>
                {payslip.employment_type && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-[10px] font-medium capitalize">
                      {payslip.employment_type.replace(/_/g, " ")}
                    </Badge>
                  </>
                )}
                {run?.branch_name && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Building2 className="w-3 h-3" /> {run.branch_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end justify-center bg-slate-50/80 p-3.5 rounded-xl border border-border/60">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
              Pay Period
            </span>
            <span className="text-base font-bold text-foreground mt-0.5">
              {periodLabel}
            </span>
            {run?.generated_at && (
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Processed: {new Date(run.generated_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Key Financial Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Salary Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-sm bg-gradient-to-br from-white via-white to-emerald-50/40 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Net Take-Home Pay
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
              ₹{calculations?.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-600/90 font-medium mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Final payable after all adjustments
            </p>
          </div>
        </motion.div>

        {/* Gross Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-border p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gross Earnings
            </span>
            <div className="p-2 rounded-lg bg-green-50 text-green-600 border border-green-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              ₹{calculations?.grossEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Base salary + allowances + travel claims
            </p>
          </div>
        </motion.div>

        {/* Deductions Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-border p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Deductions
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-red-600 tracking-tight">
              - ₹{calculations?.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Absences, retention, penalties & leaves
            </p>
          </div>
        </motion.div>

        {/* Attendance & Work Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-border p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attendance & Work
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {payslip.working_days ?? 0} <span className="text-sm font-normal text-muted-foreground">Days</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{payslip.leaves_taken ?? 0} leaves</span>
              <span>•</span>
              {Number(payslip.per_paper_rate || 0) > 0 || payslip.employment_type === "paper_checker" ? (
                <span>{payslip.sessions_conducted ?? 0} papers</span>
              ) : (
                <span>{Number(payslip.total_session_hours || payslip.session_hours || 0)} hrs</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Two-Column Breakdown: Earnings vs Deductions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Column */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Earnings & Inclusions
            </h3>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </span>
          </div>

          <div className="space-y-3">
            {/* Basic Pay */}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium text-foreground">Basic Fixed Salary</p>
                <p className="text-xs text-muted-foreground">Standard monthly contracted base pay</p>
              </div>
              <span className="font-mono text-sm font-semibold text-foreground">
                ₹{calculations?.basicSalary.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Session Hours Pay (if applicable) */}
            {(calculations?.hourBased || 0) > 0 || Number(payslip.total_session_hours || payslip.session_hours || 0) > 0 ? (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">Teaching / Session Hours</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(payslip.total_session_hours || payslip.session_hours || 0)} hours
                    {Number(payslip.hourly_rate || 0) > 0 ? ` @ ₹${payslip.hourly_rate}/hr` : ""}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-foreground">
                  ₹{calculations?.hourBased.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ) : null}

            {/* Paper Checking Pay (if paper checker) */}
            {(Number(payslip.per_paper_rate || 0) > 0 || payslip.employment_type === "paper_checker") && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">Paper Evaluation Fee</p>
                  <p className="text-xs text-muted-foreground">
                    {payslip.sessions_conducted ?? 0} papers @ ₹{Number(payslip.per_paper_rate || 50)}/paper
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-foreground">
                  ₹{(Number(payslip.sessions_conducted || 0) * Number(payslip.per_paper_rate || 50)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Bonus & Overtime */}
            {((calculations?.bonus || 0) > 0 || (calculations?.extraShift || 0) > 0) && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">Bonus & Extra Shift Allowance</p>
                  <p className="text-xs text-muted-foreground">Performance incentive & additional shift hours</p>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">
                  + ₹{((calculations?.bonus || 0) + (calculations?.extraShift || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Attendance Bonus */}
            {(calculations?.attendanceBonus || 0) > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">Attendance Bonus</p>
                  <p className="text-xs text-muted-foreground">Perfect attendance reward</p>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">
                  + ₹{calculations?.attendanceBonus.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Leave Encashment */}
            {(calculations?.leaveEncashment || 0) > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">Leave Encashment</p>
                  <p className="text-xs text-muted-foreground">Unutilized leave allowance payout</p>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">
                  + ₹{calculations?.leaveEncashment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Travel / Odometer Allowance */}
            {(calculations?.odometer || 0) > 0 && (
              <div
                onClick={() => handleNavigateToOdometer()}
                className="flex items-center justify-between py-2 border-b border-border/40 cursor-pointer hover:bg-muted/30 px-1.5 -mx-1.5 rounded transition-colors group"
                title="Click to view in Odometer Readings tab"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Travel & Odometer Claims</p>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                      {(payslip.odometer_notes || []).length} trip(s)
                    </Badge>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">Approved vehicle mileage reimbursement</p>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">
                  + ₹{calculations?.odometer.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Reimbursements */}
            {(calculations?.reimbursements || 0) > 0 && (
              <div
                onClick={() => handleNavigateToReimbursements()}
                className="flex items-center justify-between py-2 border-b border-border/40 cursor-pointer hover:bg-muted/30 px-1.5 -mx-1.5 rounded transition-colors group"
                title="Click to view in Reimbursements tab"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Expense Reimbursements</p>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                      {(payslip.reimbursement_notes || []).length} claim(s)
                    </Badge>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">Approved operational & out-of-pocket claims</p>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">
                  + ₹{calculations?.reimbursements.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t-2 border-border flex items-center justify-between bg-muted/20 p-3 rounded-xl">
            <span className="font-semibold text-sm text-foreground">Total Gross Earnings</span>
            <span className="font-mono text-base font-bold text-emerald-700">
              ₹{calculations?.grossEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Deductions Column */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Deductions & Recoveries
            </h3>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </span>
          </div>

          <div className="space-y-3">
            {/* Absence Deductions */}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium text-foreground">Absence Deductions</p>
                <p className="text-xs text-muted-foreground">Deductions for unapproved absent working days</p>
              </div>
              <span className="font-mono text-sm font-semibold text-red-600">
                - ₹{calculations?.absenceDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Retention Deductions */}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium text-foreground">Retention Fund Deduction</p>
                <p className="text-xs text-muted-foreground">Contractual security deposit / retention hold</p>
              </div>
              <span className="font-mono text-sm font-semibold text-red-600">
                - ₹{calculations?.retentionDeduction.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Late Penalty */}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium text-foreground">Late Check-in Penalty</p>
                <p className="text-xs text-muted-foreground">
                  Late policy deductions ({payslip.late_penalty_minutes ?? 0} mins late)
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-red-600">
                - ₹{calculations?.latePenalty.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Leave Deductions */}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium text-foreground">Excess Leave Deductions</p>
                <p className="text-xs text-muted-foreground">Unpaid or over-limit leaves taken</p>
              </div>
              <span className="font-mono text-sm font-semibold text-red-600">
                - ₹{calculations?.leaveDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Other Deductions */}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-medium text-foreground">Other / Manual Deductions</p>
                <p className="text-xs text-muted-foreground">Miscellaneous adjustments or advances</p>
              </div>
              <span className="font-mono text-sm font-semibold text-red-600">
                - ₹{calculations?.otherDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-border flex items-center justify-between bg-muted/20 p-3 rounded-xl">
            <span className="font-semibold text-sm text-foreground">Total Deductions</span>
            <span className="font-mono text-base font-bold text-red-600">
              - ₹{calculations?.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary Calculation Formula Bar ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
            Net Salary Computation
          </span>
          <div className="flex items-center gap-3 mt-1 flex-wrap font-mono text-sm text-slate-200">
            <span>Gross: ₹{calculations?.grossEarnings.toLocaleString("en-IN")}</span>
            <span className="text-slate-400">−</span>
            <span>Deductions: ₹{calculations?.totalDeductions.toLocaleString("en-IN")}</span>
            <span className="text-slate-400">=</span>
            <span className="text-emerald-400 font-bold text-base">
              ₹{calculations?.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-medium">
            Final Payable
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400">
            ₹{calculations?.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* ── Deduction Breakdown Details (if note present) ── */}
      {parsedDeductionParts.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Itemized Deduction & Policy Audit Notes
            </h3>
            <span className="text-xs text-muted-foreground">
              {parsedDeductionParts.length} item(s) logged
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {parsedDeductionParts.map((part, idx) => {
              const match = part.match(/^(.*?):\s*([+-]?\d+(\.\d+)?)\s*$/);
              let text = part;
              let amountStr: string | null = null;
              if (match) {
                text = match[1].trim();
                amountStr = match[2].trim();
              }

              let title = text;
              let dates: string[] = [];
              let subtitle = "";

              const absenceMatch = text.match(/^Absent(?: \(\d+ days?\))? on (.*)/);
              const lateMatch = text.match(/^Late check-in\/out on (.*?)(?:\s*\(([^)]+)\))?$/);
              const retentionMatch = text.match(/^Retention\s*\(([^)]+)\)/);

              if (absenceMatch) {
                title = "Absence Deductions";
                dates = absenceMatch[1].split(/,\s*/);
                subtitle = `${dates.length} day(s) absent`;
              } else if (lateMatch) {
                title = "Late Attendance Penalty";
                dates = lateMatch[1].split(/,\s*/);
                subtitle = lateMatch[2] ? `Penalty: ${lateMatch[2]}` : "Policy deduction";
              } else if (retentionMatch) {
                title = "Contract Retention Deposit";
                subtitle = `Retention Rate: ${retentionMatch[1]}`;
              }

              const parsedAmt = amountStr ? Math.abs(Number(amountStr)) : null;

              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 p-4 rounded-xl border border-border/70 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{title}</h4>
                      {subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                      )}
                    </div>
                    {parsedAmt !== null && (
                      <span className="font-mono text-sm font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md shrink-0">
                        - ₹{parsedAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  {dates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dates.map((d, i) => (
                        <Badge
                          key={`${d}-${i}`}
                          variant="outline"
                          className="text-[11px] font-normal bg-white text-slate-700 border-slate-200"
                        >
                          {d}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Travel & Odometer Claims Details (if notes present) ── */}
      {Boolean(payslip.odometer_notes && payslip.odometer_notes.length > 0) && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Travel / Odometer Approved Claims
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed field travel and mileage reimbursements included in this salary slip
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigateToOdometer()}
              className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
            >
              View in Odometer Tab <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(payslip.odometer_notes || []).map((note: any, idx: number) => {
              const adjReason = note.adjustment_reason || note.deduction_reason || note.notes || note.reason;
              return (
                <div
                  key={idx}
                  onClick={() => handleNavigateToOdometer(note)}
                  className="bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/60 hover:shadow-md hover:bg-slate-50/50 transition-all cursor-pointer group flex flex-col justify-between"
                  title="Click to view in Odometer Readings tab"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {note.event || "Field Travel Claim"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          {note.kms ? <span>{note.kms} kms</span> : null}
                          {note.rate_per_km ? <span>@ ₹{note.rate_per_km}/km</span> : null}
                          {note.vehicle_type ? (
                            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4">
                              {note.vehicle_type}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                        ₹{Number(note.expense || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {adjReason && (
                      <div className="bg-amber-50 border border-amber-200/90 rounded-md p-2 text-xs text-amber-900 leading-snug">
                        <span className="font-bold text-amber-950 block text-[10px] uppercase tracking-wider mb-0.5">
                          Adjustment Reason:
                        </span>
                        <span className="break-words font-medium">{adjReason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground font-medium">
                      {note.date ? note.date : "—"}
                    </span>
                    <span className="text-[11px] text-primary font-medium opacity-80 group-hover:opacity-100 flex items-center gap-1">
                      Inspect Claim →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Approved Reimbursements Details (if notes present) ── */}
      {Boolean(payslip.reimbursement_notes && payslip.reimbursement_notes.length > 0) && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Approved Expense Claims & Reimbursements
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified operational expenses reimbursed as part of this pay cycle
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigateToReimbursements()}
              className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
            >
              View in Reimbursements Tab <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(payslip.reimbursement_notes || []).map((reimb: any, idx: number) => (
              <div
                key={idx}
                onClick={() => handleNavigateToReimbursements(reimb)}
                className="bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/60 hover:shadow-md hover:bg-slate-50/50 transition-all cursor-pointer group flex flex-col justify-between"
                title="Click to view in Reimbursements tab"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {reimb.event || reimb.title || reimb.description || "Expense Claim"}
                      </h4>
                      {reimb.category && (
                        <Badge variant="outline" className="text-[10px] mt-1 text-muted-foreground">
                          {reimb.category}
                        </Badge>
                      )}
                    </div>
                    <span className="font-mono text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                      ₹{Number(reimb.expense || reimb.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {reimb.notes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{reimb.notes}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground font-medium">
                    {reimb.date ? reimb.date : "—"}
                  </span>
                  <span className="text-[11px] text-primary font-medium opacity-80 group-hover:opacity-100 flex items-center gap-1">
                    Inspect Claim →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Late Check-in / Daily Deduction Logs (if present) ── */}
      {Boolean(
        (payslip.late_logs && payslip.late_logs.length > 0) ||
        ((payslip as any).per_day_deduction_log && (payslip as any).per_day_deduction_log.length > 0)
      ) && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Daily Attendance & Late Check-in Penalty Logs
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detailed tracking of check-in times and automated policy penalties
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Log Type</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Late Minutes</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Remarks</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-right">Deduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(payslip.late_logs || []).map((log: any, i: number) => (
                  <tr key={`late-${i}`} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{log.date || log.session_date || "—"}</td>
                    <td className="px-4 py-2.5">Late Arrival</td>
                    <td className="px-4 py-2.5 font-mono">{log.late_minutes ?? log.minutes ?? 0} mins</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{log.reason || "Policy penalty"}</td>
                    <td className="px-4 py-2.5 font-mono text-red-600 font-semibold text-right">
                      - ₹{Number(log.deduction ?? log.penalty ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {((payslip as any).per_day_deduction_log || []).map((log: any, i: number) => (
                  <tr key={`deduct-${i}`} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{log.date || "—"}</td>
                    <td className="px-4 py-2.5">{log.type || "Daily Deduction"}</td>
                    <td className="px-4 py-2.5 font-mono">—</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{log.reason || log.note || "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-red-600 font-semibold text-right">
                      - ₹{Number(log.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Adjustment Modal / Sheet ── */}
      {activeRunId && (
        <PayslipAdjustSheet
          open={isAdjustOpen}
          onClose={() => setIsAdjustOpen(false)}
          payslip={payslip}
          runId={activeRunId}
          onSuccess={(updated) => {
            setPayslip(updated);
          }}
        />
      )}

      {/* ── Print-Only Official Salary Slip View ── */}
      <div className="hidden payslip-print-view font-sans">
        <div className="border border-slate-400 p-8 rounded-lg space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">INSIGHTS INSTITUTES</h1>
              <p className="text-xs text-slate-600">Enterprise Resource & Academic Operations</p>
              <p className="text-xs text-slate-600 mt-1">Salary Payslip for the month of <span className="font-bold text-slate-900">{periodLabel}</span></p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${payslip.is_disbursed ? "bg-slate-200 text-slate-900" : "bg-amber-100 text-amber-900"}`}>
                {payslip.is_disbursed ? "Disbursed" : "Pending"}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Employee Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded border border-slate-300">
            <div>
              <p className="py-0.5"><span className="text-slate-500 font-medium">Employee Name:</span> <strong className="text-slate-900">{payslip.faculty_name}</strong></p>
              <p className="py-0.5"><span className="text-slate-500 font-medium">Employee ID:</span> <strong className="text-slate-900 font-mono">{payslip.employee_id}</strong></p>
              <p className="py-0.5"><span className="text-slate-500 font-medium">Designation / Role:</span> <strong className="text-slate-900 capitalize">{isFaculty ? "Faculty" : "Staff"}</strong></p>
              {payslip.employment_type && (
                <p className="py-0.5"><span className="text-slate-500 font-medium">Employment Type:</span> <strong className="text-slate-900 capitalize">{payslip.employment_type.replace(/_/g, " ")}</strong></p>
              )}
            </div>
            <div>
              <p className="py-0.5"><span className="text-slate-500 font-medium">Branch:</span> <strong className="text-slate-900">{run?.branch_name || "Main Branch"}</strong></p>
              <p className="py-0.5"><span className="text-slate-500 font-medium">Days Worked:</span> <strong className="text-slate-900">{payslip.working_days ?? 0} days</strong></p>
              <p className="py-0.5"><span className="text-slate-500 font-medium">Leaves Taken:</span> <strong className="text-slate-900">{payslip.leaves_taken ?? 0} days</strong></p>
              {Number(payslip.total_session_hours || payslip.session_hours || 0) > 0 && (
                <p className="py-0.5"><span className="text-slate-500 font-medium">Session Hours:</span> <strong className="text-slate-900">{Number(payslip.total_session_hours || payslip.session_hours)} hrs</strong></p>
              )}
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <div className="bg-slate-200 px-3 py-1.5 font-bold text-xs text-slate-800 flex justify-between">
                <span>Earnings Description</span>
                <span>Amount (₹)</span>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="px-3 py-1.5 flex justify-between">
                  <span>Basic Fixed Salary</span>
                  <span className="font-mono">{calculations?.basicSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {(calculations?.hourBased || 0) > 0 && (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span>Session Hours Pay</span>
                    <span className="font-mono">{calculations?.hourBased.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(Number(payslip.per_paper_rate || 0) > 0 || payslip.employment_type === "paper_checker") && (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span>Paper Evaluation Fee ({payslip.sessions_conducted} papers)</span>
                    <span className="font-mono">{(Number(payslip.sessions_conducted || 0) * Number(payslip.per_paper_rate || 50)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {((calculations?.bonus || 0) + (calculations?.extraShift || 0)) > 0 && (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span>Bonus & Extra Shift Allowance</span>
                    <span className="font-mono">{((calculations?.bonus || 0) + (calculations?.extraShift || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(calculations?.odometer || 0) > 0 && (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span>Travel / Odometer Reimbursement</span>
                    <span className="font-mono">{calculations?.odometer.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(calculations?.reimbursements || 0) > 0 && (
                  <div className="px-3 py-1.5 flex justify-between">
                    <span>Expense Reimbursements</span>
                    <span className="font-mono">{calculations?.reimbursements.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-100 px-3 py-2 font-bold text-xs flex justify-between border-t border-slate-300">
                <span>Gross Earnings</span>
                <span className="font-mono">₹{calculations?.grossEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <div className="bg-slate-200 px-3 py-1.5 font-bold text-xs text-slate-800 flex justify-between">
                <span>Deductions Description</span>
                <span>Amount (₹)</span>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="px-3 py-1.5 flex justify-between">
                  <span>Absence Deductions</span>
                  <span className="font-mono">{calculations?.absenceDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span>Retention Fund Deduction</span>
                  <span className="font-mono">{calculations?.retentionDeduction.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span>Late Check-in Penalty ({payslip.late_penalty_minutes ?? 0} mins)</span>
                  <span className="font-mono">{calculations?.latePenalty.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span>Leave Deductions</span>
                  <span className="font-mono">{calculations?.leaveDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span>Other Deductions / Adjustments</span>
                  <span className="font-mono">{calculations?.otherDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="bg-slate-100 px-3 py-2 font-bold text-xs flex justify-between border-t border-slate-300">
                <span>Total Deductions</span>
                <span className="font-mono">₹{calculations?.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Box */}
          <div className="bg-slate-900 text-white p-4 rounded flex justify-between items-center">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-300">Net Take-Home Payable Amount</span>
              <p className="text-xs text-slate-400 mt-0.5">Amount in figures: Rupees only</p>
            </div>
            <div className="text-2xl font-black font-mono">
              ₹{calculations?.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2">Employee Signature</div>
            <div className="border-t border-slate-400 pt-2">Verified by (Accountant)</div>
            <div className="border-t border-slate-400 pt-2">Authorized Signatory</div>
          </div>

          <p className="text-[10px] text-center text-slate-400 pt-4">
            * This is a computer-generated salary payslip issued by Insight ERP.
          </p>
        </div>
      </div>
    </div>
  );
}
