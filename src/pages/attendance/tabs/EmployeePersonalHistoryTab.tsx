import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { dropdownActions } from "@/redux/actions";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, Clock, XCircle, HelpCircle, FileCheck } from "lucide-react";
import { motion } from "framer-motion";
import { TableSkeleton } from "@/components/common/Skeletons";

export default function EmployeePersonalHistoryTab() {
  const dispatch = useDispatch();
  const toast = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [f, setF] = useState({
    year: currentYear.toString(),
    month: currentMonth.toString(),
    from_date: "",
    to_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: any; records: any[] } | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.year && f.year !== "all") params.set("year", f.year);
    if (f.month && f.month !== "all") params.set("month", f.month);
    if (f.from_date) params.set("from_date", f.from_date);
    if (f.to_date) params.set("to_date", f.to_date);

    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: `/api/v1/attendance/employee/history/?${params.toString()}`,
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          setData({ summary: res.summary, records: res.records || [] });
        } else {
          setData({ summary: null, records: [] });
        }
        setLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to load attendance history.");
        setLoading(false);
      },
    } as any);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: string, display: string) => {
    let className = "bg-muted text-muted-foreground";
    if (status === "present") className = "bg-green-100 text-green-700";
    if (status === "absent") className = "bg-red-100 text-red-700";
    if (status === "late") className = "bg-yellow-100 text-yellow-700";
    if (status === "half_day") className = "bg-orange-100 text-orange-700";
    if (status === "on_leave" || status === "leave") className = "bg-zinc-100 text-zinc-700";
    
    return <Badge className={`text-xs font-semibold ${className}`}>{display || status}</Badge>;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Select value={f.year} onValueChange={(v) => setF(p => ({ ...p, year: v, from_date: "", to_date: "" }))}>
            <SelectTrigger className="w-32 bg-muted/10 h-9">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select value={f.month} onValueChange={(v) => setF(p => ({ ...p, month: v, from_date: "", to_date: "" }))}>
            <SelectTrigger className="w-36 bg-muted/10 h-9">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground pb-2 px-2">OR</div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From Date</Label>
          <Input 
            type="date" 
            className="h-9 w-40" 
            value={f.from_date} 
            onChange={e => setF(p => ({ ...p, from_date: e.target.value, year: "", month: "" }))} 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To Date</Label>
          <Input 
            type="date" 
            className="h-9 w-40" 
            value={f.to_date} 
            onChange={e => setF(p => ({ ...p, to_date: e.target.value, year: "", month: "" }))} 
          />
        </div>

        <Button onClick={fetchHistory} className="h-9">Apply Filters</Button>
      </div>

      {loading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          {data.summary && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col justify-center">
                <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1"/> Total Days</p>
                <p className="text-2xl font-bold">{data.summary.total_days}</p>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs text-emerald-700 font-medium mb-1 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1"/> Present</p>
                <p className="text-2xl font-bold text-emerald-700">{data.summary.present_days}</p>
              </div>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs text-red-700 font-medium mb-1 flex items-center"><XCircle className="w-3.5 h-3.5 mr-1"/> Absent</p>
                <p className="text-2xl font-bold text-red-700">{data.summary.absent_days}</p>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs text-orange-700 font-medium mb-1 flex items-center"><HelpCircle className="w-3.5 h-3.5 mr-1"/> Half Day</p>
                <p className="text-2xl font-bold text-orange-700">{data.summary.half_days}</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
                <p className="text-xs text-zinc-700 font-medium mb-1 flex items-center"><FileCheck className="w-3.5 h-3.5 mr-1"/> On Leave</p>
                <p className="text-2xl font-bold text-zinc-700">{data.summary.on_leave}</p>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs text-blue-700 font-medium mb-1">Attendance %</p>
                <p className="text-2xl font-bold text-blue-700">{data.summary.attendance_percentage}%</p>
              </div>
            </div>
          )}

          {/* Records Table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold">Attendance Logs</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check In</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check Out</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marked By</th>
                </tr>
              </thead>
              <tbody>
                {data.records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">No records found.</td>
                  </tr>
                ) : (
                  data.records.map((r: any, i: number) => (
                    <motion.tr 
                      key={r.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{r.date}</td>
                      <td className="px-4 py-3">{getStatusBadge(r.status, r.status_display)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.checked_out_at ? new Date(r.checked_out_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {r.marked_by_name || "Self"}
                        {r.is_corrected && <span className="ml-2 text-orange-600 font-medium">(Corrected)</span>}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
