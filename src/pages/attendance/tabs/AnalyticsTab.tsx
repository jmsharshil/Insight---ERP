import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setAnalytics, setAnalyticsLoading, setAttendanceError } from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, X } from "lucide-react";

const CHART_COLORS = ["#F7A900", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B"];

export default function AnalyticsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { analytics, analyticsLoading } = useSelector((s: RootState) => s.attendance);

  const [filters, setFilters] = useState({ branch_id: "", batch_id: "", date_from: "", date_to: "", trend_type: "daily" });

  const fetchAnalytics = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    dispatch({
      type: attendanceActions.GET_ANALYTICS,
      method: "GET",
      endPoint: `${API.ATTENDANCE.ANALYTICS}${p.toString() ? `?${p}` : ""}`,
      auth: true,
      setLoading: (v: boolean) => dispatch(setAnalyticsLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setAnalytics(res.data));
        else { dispatch(setAttendanceError("Failed to load analytics")); toast.error("Failed to load analytics."); }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch analytics";
        dispatch(setAttendanceError(msg)); toast.error(msg);
      },
    });
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (analyticsLoading && !analytics) return <TableSkeleton columns={3} rows={4} className="mt-0" />;

  const trendData = analytics?.attendance_trends
    ? (filters.trend_type === "daily"
        ? analytics.attendance_trends.daily_trend
        : filters.trend_type === "weekly"
        ? analytics.attendance_trends.weekly_trend?.map(w => ({ date: w.week_start_date, percentage: w.percentage }))
        : analytics.attendance_trends.monthly_trend?.map(m => ({ date: m.month, percentage: m.percentage })))
    : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Branch UUID</Label>
          <Input placeholder="Branch UUID" className="h-9 text-sm w-40" value={filters.branch_id} onChange={e => setFilters(f => ({ ...f, branch_id: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Batch UUID</Label>
          <Input placeholder="Batch UUID" className="h-9 text-sm w-40" value={filters.batch_id} onChange={e => setFilters(f => ({ ...f, batch_id: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" className="h-9 text-sm w-40" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" className="h-9 text-sm w-40" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
        </div>
        <Button onClick={fetchAnalytics} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Apply</Button>
        <Button variant="outline" className="h-9 text-sm" onClick={() => setFilters({ branch_id: "", batch_id: "", date_from: "", date_to: "", trend_type: "daily" })}><X className="w-3 h-3 mr-1" />Clear</Button>
      </div>

      {analytics && (
        <>
          {/* Average Attendance */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{analytics.average_attendance.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Overall Average Attendance</div>
              </div>
            </div>
          </motion.div>

          {/* Attendance Trend */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-foreground">Attendance Trend</h3>
              <Select value={filters.trend_type} onValueChange={v => setFilters(f => ({ ...f, trend_type: v }))}>
                <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Line type="monotone" dataKey="percentage" stroke="#F7A900" strokeWidth={2} dot={{ fill: "#F7A900", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No trend data available.</div>
            )}
          </div>

          {/* Branch Comparison */}
          {analytics.branch_comparison?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4 text-foreground">Branch Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.branch_comparison} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <XAxis dataKey="branch_name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {analytics.branch_comparison.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Batch Comparison */}
          {analytics.batch_comparison?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4 text-foreground">Batch Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.batch_comparison} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <XAxis dataKey="batch_name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]} fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
