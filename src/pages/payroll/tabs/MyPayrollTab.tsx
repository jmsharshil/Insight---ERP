import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, FileText, CalendarDays } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setMyPayroll, setMyPayrollLoading } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    // Check if the chunk ends with a deduction amount (e.g. ": -16500.00")
    if (/:\s*-?\d+(\.\d+)?\s*$/.test(chunk)) {
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
        onClick={() => setIsOpen(true)}
      >
        View Deduction note
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] ">
          <DialogHeader>
            <DialogTitle>Deduction Note</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              {parts.map((part, idx) => {
                const match = part.match(/^(.*?):\s*(-?\d+(\.\d+)?)\s*$/);
                if (match) {
                  const text = match[1];
                  const amount = match[2];
                  
                  let title = text;
                  let dates: string[] = [];
                  const absenceMatch = text.match(/^Absent(?: \(\d+ days?\))? on (.*)/);
                  if (absenceMatch) {
                    title = "Absence Deductions";
                    dates = absenceMatch[1].split(/,\s*/);
                  }
                  
                  const parsedAmount = Math.abs(Number(amount));
                  
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
                        <span className="font-mono text-sm text-red-600 font-medium shrink-0 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                          - ₹{parsedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {dates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {dates.map(d => (
                            <Badge key={d} variant="outline" className="text-[11px] font-normal bg-slate-50 text-slate-600 border-slate-200">
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

export default function MyPayrollTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { myPayroll, myPayrollLoading } = useSelector((s: RootState) => s.payroll);

  const [month,  setMonth]  = useState("all");
  const [year,   setYear]   = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState("all");

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
  
  const allDeductionLogs = (myPayroll?.payslips || []).flatMap((slip: any) => 
    (slip.per_day_deduction_log || []).map((log: any) => ({
      ...log,
      slipMonth: slip.payroll_month,
      slipYear: slip.payroll_year
    }))
  );

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
        <TableSkeleton columns={8} rows={4} className="mt-0" />
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
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {[
                      "Month / Year",
                      "Basic",
                      "Bonus",
                      "Deductions",
                      "Deduction Note",
                      "Net Salary",
                      "Sessions",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!myPayroll?.payslips?.length ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
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
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {slip.payroll_month} / {slip.payroll_year}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          ₹{Number(slip.basic_salary).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-green-600">
                          ₹{Number(slip.bonus || 0).toLocaleString("en-IN")}
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
                          ₹{Number(slip.net_salary).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-xs">{slip.sessions_conducted}</td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-xs ${STATUS_BADGE[slip.payroll_status?.toLowerCase().replace(" ", "_")] || "bg-yellow-100 text-yellow-700"}`}
                          >
                            {slip.payroll_status || (slip.is_disbursed ? "Disbursed" : "Pending")}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="deduction_logs" className="outline-none space-y-4">
            {/* Deduction Logs Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Total Hours
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Gross Salary
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Late Minutes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Penalty Mins / Amt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Deduction
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Net Salary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!allDeductionLogs.length ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                        No daily deduction logs found.
                      </td>
                    </tr>
                  ) : (
                    allDeductionLogs.map((log: any, i: number) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                          {log.date}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{log.total_hours}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          ₹{Number(log.gross_salary || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{log.late_minutes} min</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {log.penalty_minutes} min /{" "}
                          <span className="text-red-600 font-medium">
                            ₹{Number(log.penalty_amount || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-red-600 font-medium">
                          ₹{Number(log.deduction || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-green-600 font-bold">
                          ₹{Number(log.net_salary || 0).toLocaleString("en-IN")}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
