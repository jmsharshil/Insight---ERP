import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { 
  CalendarDays, CheckCircle2, Clock, CalendarClock, Wallet, FileText 
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { format } from "date-fns";

export default function PaperCheckerDashboard() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const raw = localStorage.getItem("Insight_Login_Data");
        const token = raw ? JSON.parse(raw)?.access : "";
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

        const res = await axiosRequest({
          method: "GET",
          url: `${baseUrl}/api/v1/dashboard/`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setData(res.data?.data || null);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <ReportsSkeleton />
      </div>
    );
  }

  if (!data || !data.kpis) {
    return (
      <DashboardLayout pageTitle="Paper Checker Dashboard" stats={[]}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Failed to load dashboard data.</p>
        </div>
      </DashboardLayout>
    );
  }

  const parsePct = (val: string | number) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const match = val.match(/([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  };

  const stats: StatItem[] = [
    {
      title: "Today's Sessions",
      value: data.kpis?.today_sessions || 0,
      icon: CalendarDays,
      trendType: (data.kpis?.today_sessions || 0) > 0 ? "up" : "neutral",
    },
    {
      title: "Monthly Sessions",
      value: data.kpis?.monthly_sessions || 0,
      icon: CalendarClock,
      trendType: "neutral",
    },
    {
      title: "Attendance Rate",
      value: data.kpis?.attendance_rate || "0%",
      icon: CheckCircle2,
      trendType: parsePct(data.kpis?.attendance_rate) >= 80 ? "up" : "warning",
      link: "/attendance",
    },
    {
      title: "Pending Tasks",
      value: data.kpis?.pending_tasks || 0,
      icon: Clock,
      trendType: (data.kpis?.pending_tasks || 0) > 0 ? "warning" : "success",
    }
  ];

  const attendanceLabels = data.charts?.my_attendance_trend?.labels || [];
  const attendanceValues = data.charts?.my_attendance_trend?.values || [];
  
  const attendanceTrendData = attendanceLabels.map((date: string, idx: number) => ({
    date: format(new Date(date), "dd MMM"),
    value: attendanceValues[idx] || 0
  }));

  return (
    <DashboardLayout pageTitle="Paper Checker Dashboard" stats={stats}>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        <div className="lg:col-span-2">
          <SectionCard title="My Attendance Trend">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Payroll Summary" className="h-full">
            <div className="flex flex-col gap-4 mt-4">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" /> This Month
                </p>
                <p className="text-3xl font-bold font-heading mt-2">
                  ₹{data.payroll_summary?.this_month?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-muted p-4 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                <p className="text-xl font-semibold mt-1">
                  ₹{data.payroll_summary?.pending?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <SectionCard title="Pending Tasks">
          <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto">
            {data.pending_tasks && data.pending_tasks.length > 0 ? (
              data.pending_tasks.map((task: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{task.exam_title || task.title || 'Task'}</p>
                    {task.student_name && <p className="text-xs text-muted-foreground mt-1">Student: {task.student_name}</p>}
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">Pending</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No pending tasks.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Today's Schedule">
          <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto">
            {data.today_schedule && data.today_schedule.length > 0 ? (
              data.today_schedule.map((session: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{session.subject__name || 'Session'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.start_time} - {session.end_time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No schedule for today.</p>
            )}
          </div>
        </SectionCard>

      </div>

      <div className="mt-6">
        <SectionCard title="Recent Notifications">
          <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
            {(data.recent_notifications || []).map((notification: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-semibold text-foreground">{notification.title}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(notification.created_at), "dd MMM, HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {notification.body}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

    </DashboardLayout>
  );
}
