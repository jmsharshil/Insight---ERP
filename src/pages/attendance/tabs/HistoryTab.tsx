import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setHistory, setHistoryLoading } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_BADGE: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent:  "bg-red-100 text-red-700",
  late:    "bg-yellow-100 text-yellow-700",
};

export default function HistoryTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { history, historyLoading, historyCount } = useSelector((s: RootState) => s.attendance);

  const branches = dropdowns?.branches || [];
  const batches = dropdowns?.batches || [];
  const studentsList = dropdowns?.students || [];
  const facultyList = dropdowns?.faculty || [];

  const [f, setF] = useState({
    student_id: "", branch_id: "", batch_id: "", faculty_id: "",
    date_from: "", date_to: "", attendance_status: "", session: "", subject: "",
  });

  const fetch = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_HISTORY,
      method: "GET",
      endPoint: `${API.ATTENDANCE.HISTORY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setHistoryLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setHistory({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load history.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetch(); }, []);

  const clear = () => setF({ student_id: "", branch_id: "", batch_id: "", faculty_id: "", date_from: "", date_to: "", attendance_status: "", session: "", subject: "" });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Select value={f.student_id} onValueChange={v => setF(p => ({ ...p, student_id: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Select Student" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {studentsList.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={f.branch_id} onValueChange={v => setF(p => ({ ...p, branch_id: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={f.batch_id} onValueChange={v => setF(p => ({ ...p, batch_id: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={f.faculty_id} onValueChange={v => setF(p => ({ ...p, faculty_id: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Select Faculty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculty</SelectItem>
              {facultyList.map((fac: any) => (
                <SelectItem key={fac.id} value={fac.id}>{fac.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" className="h-9 text-sm w-40" value={f.date_from} onChange={e => setF(p => ({ ...p, date_from: e.target.value }))} />
          <Input type="date" className="h-9 text-sm w-40" value={f.date_to}   onChange={e => setF(p => ({ ...p, date_to:   e.target.value }))} />
          <Select value={f.attendance_status} onValueChange={v => setF(p => ({ ...p, attendance_status: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
          <Select value={f.session} onValueChange={v => setF(p => ({ ...p, session: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetch} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
          <Button variant="outline" className="h-9 text-sm" onClick={clear}><X className="w-3 h-3 mr-1" />Clear</Button>
        </div>
      </div>

      {historyLoading ? <TableSkeleton columns={7} rows={8} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Attendance History</span>
            <span className="text-xs text-muted-foreground">{historyCount} records</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>{["Date", "Check-in", "Check-out", "Status", "Late Status", "Session", "Subject", "Device"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No records found.</td></tr>
              ) : history.map((row, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{row.date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.check_in_time  ? new Date(row.check_in_time).toLocaleTimeString()  : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${STATUS_BADGE[row.status] ?? ""}`}>{row.status}</Badge></td>
                  <td className="px-4 py-3 text-xs capitalize">{row.late_status}</td>
                  <td className="px-4 py-3 text-xs capitalize">{row.session}</td>
                  <td className="px-4 py-3 text-xs">{row.subject}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.scanner_device}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
