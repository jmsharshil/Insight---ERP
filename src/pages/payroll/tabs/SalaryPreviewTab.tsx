import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setPreview, setPreviewLoading } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  {v:"1",l:"January"},{v:"2",l:"February"},{v:"3",l:"March"},{v:"4",l:"April"},
  {v:"5",l:"May"},{v:"6",l:"June"},{v:"7",l:"July"},{v:"8",l:"August"},
  {v:"9",l:"September"},{v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS = [{v:"2024",l:"2024"},{v:"2025",l:"2025"},{v:"2026",l:"2026"},{v:"2027",l:"2027"}];

export default function SalaryPreviewTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  const { preview, previewLoading } = useSelector((s: RootState) => s.payroll);

  const d = new Date();
  const [month, setMonth] = useState(String(d.getMonth() + 1));
  const [year,  setYear]  = useState(String(d.getFullYear()));

  // Faculty ID from auth — verify this matches your user object's faculty UUID field
  const facultyId = (user as any)?.faculty_id ?? user?.id ?? "";

  const fetchPreview = () => {
    if (!facultyId) { toast.error("Faculty ID not found in your profile."); return; }
    dispatch({
      type: payrollActions.GET_SALARY_PREVIEW,
      method: "GET",
      endPoint: `${API.PAYROLL.FACULTY_PREVIEW(facultyId)}?month=${month}&year=${year}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setPreviewLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setPreview(res.data));
        else toast.error("Failed to load salary preview.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error loading preview"),
    });
  };

  const p = preview?.payslip_preview;

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-sm w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={fetchPreview} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
          <Eye className="w-4 h-4" /> Preview Salary
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
        ⚠ This is an <strong>estimate only</strong> — final salary is calculated after payroll is approved and disbursed.
      </div>

      {previewLoading ? <TableSkeleton columns={2} rows={4} className="mt-0" /> : p ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Estimated Net — hero card */}
          <div className="bg-white rounded-xl border border-border p-6 text-center">
            <div className="text-xs text-muted-foreground mb-1">Estimated Net Salary</div>
            <div className="text-4xl font-bold text-primary">
              ₹{Number(p.estimated_net ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {MONTHS.find(m => m.v === month)?.l} {year}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Breakdown</div>
            {[
              { label: "Basic Salary",            value: p.basic_salary,             icon: TrendingUp, color: "text-foreground" },
              { label: "Expected Hours Amount",   value: p.expected_hours_amount,    icon: Clock,      color: "text-green-600" },
              { label: "Late Penalty (estimate)", value: p.late_penalty_estimate,    icon: TrendingDown, color: "text-red-600" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <row.icon className={`w-3.5 h-3.5 ${row.color}`} />
                  {row.label}
                </div>
                <span className={`text-sm font-semibold font-mono ${row.color}`}>
                  ₹{Number(row.value ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
