import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { payrollActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setExtraHours, setExtraHoursLoading, updateExtraHourInList } from "@/redux/slices/payrollSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MONTHS = [
  {v:"all",l:"All Months"},{v:"1",l:"January"},{v:"2",l:"February"},
  {v:"3",l:"March"},{v:"4",l:"April"},{v:"5",l:"May"},{v:"6",l:"June"},
  {v:"7",l:"July"},{v:"8",l:"August"},{v:"9",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"},
];
const YEARS = [{v:"all",l:"All Years"},{v:"2024",l:"2024"},{v:"2025",l:"2025"},{v:"2026",l:"2026"},{v:"2027",l:"2027"}];

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ExtraHoursTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { extraHours, extraHoursLoading } = useSelector((s: RootState) => s.payroll);

  const d = new Date();
  const [month,  setMonth]  = useState(String(d.getMonth() + 1));
  const [year,   setYear]   = useState(String(d.getFullYear()));
  const [status, setStatus] = useState("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetch = () => {
    const p = new URLSearchParams();
    if (month && month !== "all")  p.set("month",  month);
    if (year && year !== "all")   p.set("year",   year);
    if (status && status !== "all") p.set("status", status);
    dispatch({
      type: payrollActions.GET_EXTRA_HOURS,
      method: "GET",
      endPoint: `${API.PAYROLL.EXTRA_HOURS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setExtraHoursLoading(v)),
      getResponse: (res: any) => {
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        dispatch(setExtraHours(data));
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to load extra hours"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = (id: string, newStatus: "approved" | "rejected") => {
    setActionId(id);
    dispatch({
      type: payrollActions.UPDATE_EXTRA_HOUR,
      method: "PATCH",
      endPoint: API.PAYROLL.EXTRA_HOUR_DETAIL(id),
      body: { status: newStatus },
      auth: true,
      getResponse: (res: any) => {
        const updated = res?.data ?? res;
        if (updated?.id) {
          dispatch(updateExtraHourInList(updated));
          toast.success(`Extra hours ${newStatus}.`);
        }
        setActionId(null);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update.");
        setActionId(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800 flex items-start gap-2">
        <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Extra hours are <strong>auto-detected</strong> when faculty teaching time exceeds chapter allocation.
        Approving triggers a payslip recalculation on the next compute.
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 text-sm w-28"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
      </div>

      {extraHoursLoading ? <TableSkeleton columns={5} rows={5} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>{["Faculty", "Period", "Extra Hours", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {extraHours.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-14 text-muted-foreground text-sm">No extra hour records found.</td></tr>
              ) : extraHours.map((eh, i) => (
                <motion.tr key={eh.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-sm">{eh.faculty_name ?? "—"}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{eh.faculty}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{eh.month} / {eh.year}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-600">
                      <Clock className="w-3.5 h-3.5" />{eh.extra_hours}h
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${STATUS_BADGE[eh.status] ?? ""}`}>{eh.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {eh.status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs gap-1 px-2 bg-green-600 hover:bg-green-700 text-white"
                          disabled={actionId === eh.id}
                          onClick={() => handleAction(eh.id, "approved")}>
                          <CheckCircle2 className="w-3 h-3" />
                          {actionId === eh.id ? "…" : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2 border-red-300 text-red-600 hover:bg-red-50"
                          disabled={actionId === eh.id}
                          onClick={() => handleAction(eh.id, "rejected")}>
                          <XCircle className="w-3 h-3" />
                          {actionId === eh.id ? "…" : "Reject"}
                        </Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
