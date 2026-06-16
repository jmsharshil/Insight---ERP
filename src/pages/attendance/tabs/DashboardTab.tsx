import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setDashboard, setDashboardLoading, setAttendanceError } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STAT_CARDS = (d: any) => [
  { label: "Total Students",    value: d.total_students,                              icon: Users,         color: "bg-blue-50 text-blue-600" },
  { label: "Present Today",     value: d.present_today,                               icon: UserCheck,     color: "bg-green-50 text-green-600" },
  { label: "Absent Today",      value: d.absent_today,                                icon: UserX,         color: "bg-red-50 text-red-600" },
  { label: "Late Today",        value: d.late_today,                                  icon: Clock,         color: "bg-yellow-50 text-yellow-600" },
  { label: "Attendance %",      value: `${d.attendance_percentage?.toFixed(1)}%`,      icon: TrendingUp,    color: "bg-purple-50 text-purple-600" },
  { label: "Active Violations", value: d.active_violations,                           icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
];

export default function DashboardTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { dashboard, dashboardLoading } = useSelector((s: RootState) => s.attendance);
  const { user } = useAuth();

  const branches = dropdowns?.branches?.filter((b: any) => {
    if (user && user.role === "branch_manager" && user.branch) {
      return b.id === user.branch;
    }
    return true;
  }) || [];
  const batches = dropdowns?.batches || [];

  const [filters, setFilters] = useState({ date: "", branch: (user && user.role === "branch_manager" && user.branch) ? user.branch : "", batch: "", faculty: "" });

  const fetchDashboard = () => {
    const params = new URLSearchParams();
    if (filters.date)    params.set("date",    filters.date);
    if (filters.branch)  params.set("branch",  filters.branch);
    if (filters.batch)   params.set("batch",   filters.batch);
    if (filters.faculty) params.set("faculty", filters.faculty);
    const query = params.toString();

    dispatch({
      type: attendanceActions.GET_DASHBOARD,
      method: "GET",
      endPoint: `${API.ATTENDANCE.DASHBOARD}${query ? `?${query}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setDashboardLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setDashboard(res.data));
        else { dispatch(setAttendanceError("Failed to load dashboard")); toast.error("Failed to load dashboard."); }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch dashboard";
        dispatch(setAttendanceError(msg)); toast.error(msg);
      },
    });
  };

  useEffect(() => { fetchDashboard(); }, [filters]);

  if (dashboardLoading && !dashboard) return <TableSkeleton columns={3} rows={4} className="mt-0" />;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-border">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} className="h-9 text-sm" />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Branch</Label>
          <Select value={filters.branch} onValueChange={v => setFilters(f => ({ ...f, branch: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Batch</Label>
          <Select value={filters.batch} onValueChange={v => setFilters(f => ({ ...f, batch: v === "all" ? "" : v }))}>
            <SelectTrigger className="h-9 text-sm w-44 bg-muted/10"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches?.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat Cards */}
      {dashboard && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {STAT_CARDS(dashboard).map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="bg-white rounded-xl border border-border p-4 flex flex-col gap-2"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Faculty Summary */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-4 text-foreground">Faculty Attendance Summary</h3>
            <div className="flex gap-6">
              {[
                { label: "Total Faculty", value: dashboard.faculty_attendance_summary.total_faculty },
                { label: "Present",       value: dashboard.faculty_attendance_summary.present,       cls: "text-green-600" },
                { label: "Absent",        value: dashboard.faculty_attendance_summary.absent,        cls: "text-red-600" },
              ].map(item => (
                <div key={item.label} className="flex flex-col">
                  <span className={`text-2xl font-bold ${item.cls ?? "text-foreground"}`}>{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Branch-wise Chart */}
          {dashboard.branch_wise_attendance?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4 text-foreground">Branch-wise Attendance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashboard.branch_wise_attendance} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <XAxis dataKey="branch_name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {dashboard.branch_wise_attendance.map((_, idx) => (
                      <Cell key={idx} fill="#F7A900" opacity={0.85 - idx * 0.05} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
