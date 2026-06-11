import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Search, X, Eye } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setStudents, setStudentsLoading,
  setSelectedStudent, setSelectedStudentLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

function buildQuery(f: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
  return p.toString();
}

export default function StudentsAttendanceTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { students, studentsLoading, selectedStudent, selectedStudentLoading } = useSelector((s: RootState) => s.attendance);

  const [filters, setFilters] = useState({
    search: "", branch_id: "", batch_id: "", course_id: "",
    attendance_percentage_min: "", attendance_percentage_max: "",
    date_from: "", date_to: "",
    late_entries: "", active_violations: "",
  });
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchStudents = () => {
    const q = buildQuery(filters);
    dispatch({
      type: attendanceActions.GET_STUDENTS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.STUDENTS}${q ? `?${q}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setStudentsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success) dispatch(setStudents({ data: res.data, count: res.count ?? res.data.length }));
        else toast.error("Failed to load students.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to fetch students"),
    });
  };

  const fetchStudentDetail = (id: string) => {
    setDetailOpen(true);
    dispatch({
      type: attendanceActions.GET_STUDENT_DETAIL,
      method: "GET",
      endPoint: API.ATTENDANCE.STUDENT_DETAIL(id),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSelectedStudentLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setSelectedStudent(res.data));
        else toast.error("Failed to load student detail.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to fetch student detail"),
    });
  };

  useEffect(() => { fetchStudents(); }, []);

  const pct = (v: number) => {
    if (v >= 75) return "bg-green-100 text-green-700";
    if (v >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, admission no, roll no..."
              className="pl-9 h-9 text-sm"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Input placeholder="Branch UUID" className="h-9 text-sm w-40" value={filters.branch_id} onChange={e => setFilters(f => ({ ...f, branch_id: e.target.value }))} />
          <Input placeholder="Batch UUID" className="h-9 text-sm w-40" value={filters.batch_id} onChange={e => setFilters(f => ({ ...f, batch_id: e.target.value }))} />
          <Input type="date" className="h-9 text-sm w-40" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
          <Input type="date" className="h-9 text-sm w-40" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Attendance % Min</Label>
            <Input type="number" placeholder="0" className="h-9 text-sm w-28" value={filters.attendance_percentage_min} onChange={e => setFilters(f => ({ ...f, attendance_percentage_min: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Attendance % Max</Label>
            <Input type="number" placeholder="100" className="h-9 text-sm w-28" value={filters.attendance_percentage_max} onChange={e => setFilters(f => ({ ...f, attendance_percentage_max: e.target.value }))} />
          </div>
          <Select value={filters.late_entries} onValueChange={v => setFilters(f => ({ ...f, late_entries: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Late Entries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has Late Entries</SelectItem>
              <SelectItem value="false">No Late Entries</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.active_violations} onValueChange={v => setFilters(f => ({ ...f, active_violations: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Violations" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Has Violations</SelectItem>
              <SelectItem value="false">No Violations</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchStudents} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply Filters</Button>
          <Button variant="outline" className="h-9 text-sm" onClick={() => {
            setFilters({ search: "", branch_id: "", batch_id: "", course_id: "", attendance_percentage_min: "", attendance_percentage_max: "", date_from: "", date_to: "", late_entries: "", active_violations: "" });
          }}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      {studentsLoading ? (
        <TableSkeleton columns={6} rows={6} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                {["Student", "Admission No.", "Branch / Batch", "Present", "Absent", "Late", "Attendance %", "Last Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No students found.</td></tr>
              ) : students.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => fetchStudentDetail(s.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={s.student_profile.photo ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{s.student_profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{s.student_profile.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.student_profile.admission_number}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{s.student_profile.branch_name}</div>
                    <div className="text-muted-foreground">{s.student_profile.batch_name ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium">{s.present_count}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{s.absent_count}</td>
                  <td className="px-4 py-3 text-yellow-600 font-medium">{s.late_count}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs font-semibold ${pct(s.attendance_percentage)}`}>
                      {s.attendance_percentage.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.last_attendance_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); fetchStudentDetail(s.id); }}>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={open => { setDetailOpen(open); if (!open) dispatch(setSelectedStudent(null)); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Attendance Detail</DialogTitle>
          </DialogHeader>
          {selectedStudentLoading ? (
            <TableSkeleton columns={2} rows={4} />
          ) : selectedStudent ? (
            <div className="space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedStudent.student_profile.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{selectedStudent.student_profile.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedStudent.student_profile.admission_number} · {selectedStudent.student_profile.branch_name}</div>
                </div>
                <Badge className={`ml-auto text-sm font-bold ${pct(selectedStudent.attendance_percentage)}`}>
                  {selectedStudent.attendance_percentage.toFixed(1)}%
                </Badge>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: "Present", v: selectedStudent.summary.present_count, c: "text-green-600" },
                  { l: "Absent",  v: selectedStudent.summary.absent_count,  c: "text-red-600" },
                  { l: "Late",    v: selectedStudent.summary.late_count,    c: "text-yellow-600" },
                ].map(item => (
                  <div key={item.l} className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${item.c}`}>{item.v}</div>
                    <div className="text-xs text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>

              {/* Monthly Trend Chart */}
              {selectedStudent.monthly_trend?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Monthly Trend</h4>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={selectedStudent.monthly_trend}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Line type="monotone" dataKey="percentage" stroke="#F7A900" strokeWidth={2} dot={{ fill: "#F7A900", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Subject-wise */}
              {selectedStudent.subject_wise_attendance?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Subject-wise Attendance</h4>
                  <div className="space-y-2">
                    {selectedStudent.subject_wise_attendance.map(sub => (
                      <div key={sub.subject_id} className="flex items-center gap-3">
                        <span className="text-sm text-foreground flex-1">{sub.subject_name}</span>
                        <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${sub.percentage}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-12 text-right">{sub.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
