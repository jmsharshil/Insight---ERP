import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setFaculty, setFacultyLoading,
  setSelectedFaculty, setSelectedFacultyLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function FacultyTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { faculty, facultyLoading, selectedFaculty, selectedFacultyLoading } = useSelector((s: RootState) => s.attendance);

  const [f, setF] = useState({ faculty_id: "", branch_id: "", date_from: "", date_to: "" });
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchFaculty = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_FACULTY,
      method: "GET",
      endPoint: `${API.ATTENDANCE.FACULTY}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setFacultyLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setFaculty({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load faculty.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  const fetchDetail = (id: string) => {
    setDetailOpen(true);
    dispatch({
      type: attendanceActions.GET_FACULTY_DETAIL,
      method: "GET",
      endPoint: API.ATTENDANCE.FACULTY_DETAIL(id),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSelectedFacultyLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setSelectedFaculty(res.data));
        else toast.error("Failed to load faculty detail.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  useEffect(() => { fetchFaculty(); }, []);

  const pct = (v: number) => v >= 75 ? "bg-green-100 text-green-700" : v >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3">
        <Input placeholder="Faculty UUID" className="h-9 text-sm w-40" value={f.faculty_id} onChange={e => setF(p => ({ ...p, faculty_id: e.target.value }))} />
        <Input placeholder="Branch UUID"  className="h-9 text-sm w-40" value={f.branch_id}  onChange={e => setF(p => ({ ...p, branch_id:  e.target.value }))} />
        <Input type="date" className="h-9 text-sm w-40" value={f.date_from} onChange={e => setF(p => ({ ...p, date_from: e.target.value }))} />
        <Input type="date" className="h-9 text-sm w-40" value={f.date_to}   onChange={e => setF(p => ({ ...p, date_to:   e.target.value }))} />
        <Button onClick={fetchFaculty} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setF({ faculty_id: "", branch_id: "", date_from: "", date_to: "" })}><X className="w-3 h-3 mr-1" />Clear</Button>
      </div>

      {facultyLoading ? <TableSkeleton columns={6} rows={5} className="mt-0" /> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["Faculty", "Employee ID", "Email", "Branch", "Present", "Absent", "Leave", "Attendance %", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faculty.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No faculty found.</td></tr>
              ) : faculty.map((fac, i) => (
                <motion.tr key={fac.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => fetchDetail(fac.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                        {fac.faculty_details.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{fac.faculty_details.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fac.faculty_details.employee_id}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fac.faculty_details.email}</td>
                  <td className="px-4 py-3 text-xs">{fac.faculty_details.branch_name}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{fac.present_count}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{fac.absent_count}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">{fac.leave_count}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-semibold ${pct(fac.attendance_percentage)}`}>
                      {fac.attendance_percentage.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); fetchDetail(fac.id); }}>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Faculty Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={open => { setDetailOpen(open); if (!open) dispatch(setSelectedFaculty(null)); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Faculty Attendance Detail</DialogTitle>
          </DialogHeader>
          {selectedFacultyLoading ? (
            <TableSkeleton columns={2} rows={4} />
          ) : selectedFaculty ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedFaculty.faculty.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{selectedFaculty.faculty.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedFaculty.faculty.employee_id} · {selectedFaculty.faculty.email}</div>
                </div>
                <Badge className={`ml-auto text-sm font-bold ${pct(selectedFaculty.summary.attendance_percentage)}`}>
                  {selectedFaculty.summary.attendance_percentage.toFixed(1)}%
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { l: "Present", v: selectedFaculty.summary.present_count, c: "text-green-600" },
                  { l: "Absent",  v: selectedFaculty.summary.absent_count,  c: "text-red-600" },
                  { l: "Leave",   v: selectedFaculty.summary.leave_count,   c: "text-blue-600" },
                  { l: "Attendance %", v: `${selectedFaculty.summary.attendance_percentage.toFixed(1)}%`, c: "text-primary" },
                ].map(item => (
                  <div key={item.l} className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${item.c}`}>{item.v}</div>
                    <div className="text-xs text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>

              {/* Working Hours */}
              {selectedFaculty.working_hours && (
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Working Hours</h4>
                  <div className="flex gap-6">
                    <div>
                      <span className="text-lg font-bold text-foreground">{selectedFaculty.working_hours.total_hours.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground ml-1">Total Hours</span>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-foreground">{selectedFaculty.working_hours.average_hours_per_day.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground ml-1">Avg/Day</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Analytics */}
              {selectedFaculty.monthly_analytics?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Monthly Trend</h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={selectedFaculty.monthly_analytics}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Line type="monotone" dataKey="percentage" stroke="#F7A900" strokeWidth={2} dot={{ fill: "#F7A900", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
