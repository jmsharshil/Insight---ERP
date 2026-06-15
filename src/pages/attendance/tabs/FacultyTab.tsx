import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Eye, X } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setFaculty, setFacultyLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FacultyTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toast = useToast();
  const { faculty, facultyLoading } = useSelector((s: RootState) => s.attendance);

  const branches = dropdowns?.branches || [];
  const facultyList = dropdowns?.faculty || [];

  const [f, setF] = useState({ faculty_id: "", branch_id: "", date_from: "", date_to: "" });

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

  useEffect(() => { fetchFaculty(); }, []);

  const pct = (v: number) => v >= 75 ? "bg-green-100 text-green-700" : v >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3">
        <Select value={f.faculty_id} onValueChange={v => setF(p => ({ ...p, faculty_id: v === "all" ? "" : v }))}>
          <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Select Faculty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Faculty</SelectItem>
            {facultyList.map((fac: any) => (
              <SelectItem key={fac.id} value={fac.id}>{fac.name}</SelectItem>
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
                  onClick={() => navigate(`/attendance/faculty/${fac.id}`)}
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
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); navigate(`/attendance/faculty/${fac.id}`); }}>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
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
