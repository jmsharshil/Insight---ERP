import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, FileText } from "lucide-react";
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
    
    if (/:\s*-?\d/.test(chunk)) {
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deduction Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-sm bg-muted/30 p-4 rounded-md border border-border/50 min-h-[100px]">
              <ul className="list-disc pl-4 space-y-2">
                {parts.map((part, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {part}
                  </li>
                ))}
              </ul>
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

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-sm w-32"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
      </div>

      {myPayrollLoading ? <TableSkeleton columns={8} rows={4} className="mt-0" /> : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Payslips",    value: summary.total_payslips, icon: FileText, cls: "bg-blue-50 text-blue-600" },
                { label: "Total Net Earned",  value: `₹${Number(summary.total_net_earned ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, cls: "bg-green-50 text-green-600" },
                { label: "Total Disbursed",   value: `₹${Number(summary.total_disbursed ?? 0).toLocaleString("en-IN")}`, icon: Wallet,    cls: "bg-primary/10 text-primary" },
              ].map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.cls}`}>
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
                <div className="text-xs text-muted-foreground">{myPayroll.employee.employee_id} · {myPayroll.employee.email}</div>
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
                <tr>{["Month / Year", "Basic", "Bonus", "Deductions", "Deduction Note", "Net Salary", "Sessions", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {!myPayroll?.payslips?.length ? (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No payslip records found.</td></tr>
                ) : myPayroll.payslips.map((slip, i) => (
                  <motion.tr key={slip.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{slip.payroll_month} / {slip.payroll_year}</td>
                    <td className="px-4 py-3 font-mono text-xs">₹{Number(slip.basic_salary).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-600">₹{Number(slip.bonus || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-red-600">
                      ₹{(Number(slip.late_penalty || 0) + Number(slip.leave_deductions || 0) + Number(slip.absence_deductions || 0) + Number(slip.retention_deduction || 0) + Number(slip.other_deductions || 0)).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <DeductionNoteCell row={slip} />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-primary">₹{Number(slip.net_salary).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs">{slip.sessions_conducted}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${STATUS_BADGE[slip.payroll_status?.toLowerCase().replace(" ", "_")] || "bg-yellow-100 text-yellow-700"}`}>
                        {slip.payroll_status || (slip.is_disbursed ? "Disbursed" : "Pending")}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
