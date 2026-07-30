import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { 
  Users, UserPlus, Calendar, Wallet, CheckCircle2, Clock, FileText, Activity, BookOpen, AlertCircle
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface FacultyData {
  kpis: {
    today_sessions: number;
    monthly_sessions: number;
    attendance_rate: string;
    pending_tasks: number;
    avg_session_completion: string;
    visiting_count: number;
  };
  exam_performance: {
    exams: any[];
    summary: {
      total_exams: number;
      overall_pass_percentage: number;
      overall_avg_percentage: number;
      total_students_evaluated: number;
    };
  };
  recent_sessions: any[];
  payroll_summary: {
    this_month: number;
    pending: number;
  };
  charts: {
    my_attendance_trend: {
      labels: string[];
      values: number[];
    };
  };
  leave: {
    pending_count: number;
    total_remaining_days: number;
    recent_leaves: any[];
    balances: any[];
  };
  recent_notifications: any[];
}

export default function FacultyDashboard() {
  const [data, setData] = useState<FacultyData | null>(null);
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
      <DashboardLayout pageTitle="Faculty Dashboard" stats={[]}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Failed to load dashboard data.</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats: StatItem[] = [
    { 
      title: "Today's Sessions", 
      value: data.kpis.today_sessions.toString(), 
      icon: Clock, 
      trend: "Sessions today", 
      trendType: data.kpis.today_sessions > 0 ? "up" : "neutral" 
    },
    { 
      title: "Monthly Sessions", 
      value: data.kpis.monthly_sessions.toString(), 
      icon: Calendar, 
      trend: "Total this month", 
      trendType: "neutral" 
    },
    { 
      title: "Avg Completion", 
      value: data.kpis.avg_session_completion, 
      icon: CheckCircle2, 
      trend: "Syllabus coverage", 
      trendType: parseFloat(data.kpis.avg_session_completion) >= 90 ? "up" : "warning" 
    },
    { 
      title: "Pending Tasks", 
      value: data.kpis.pending_tasks.toString(), 
      icon: FileText, 
      trend: "Requires attention", 
      trendType: data.kpis.pending_tasks > 0 ? "warning" : "up" 
    },
    {
      title: "Visiting Count",
      value: data.kpis.visiting_count.toString(),
      icon: Users,
      trend: "Total visits",
      trendType: "neutral"
    },
  ];

  const chartData = data.charts.my_attendance_trend.labels.map((lbl, idx) => ({
    date: format(new Date(lbl), "MMM dd"),
    value: data.charts.my_attendance_trend.values[idx]
  }));

  const sessionColumns = [
    { header: "Date", key: "session_date", render: (row: any) => format(new Date(row.session_date), "MMM dd, yyyy") },
    { header: "Subject", key: "subject__name" },
    { header: "Batch", key: "batch__name" },
    { header: "Completion %", key: "completion_percentage", render: (row: any) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${row.completion_percentage}%` }}></div>
        </div>
        <span className="text-xs text-muted-foreground">{row.completion_percentage}%</span>
      </div>
    ) },
    { header: "Status", key: "status", render: (row: any) => (
      <Badge variant="outline" className="capitalize">{row.status}</Badge>
    ) },
  ];

  const examColumns = [
    { header: "Title", key: "title" },
    { header: "Subject", key: "subject" },
    { header: "Pass %", key: "pass_percentage", render: (row: any) => `${row.pass_percentage.toFixed(1)}%` },
    { header: "Avg %", key: "avg_result_percentage", render: (row: any) => `${row.avg_result_percentage.toFixed(1)}%` },
    { header: "Students", key: "total_students" },
  ];

  return (
    <DashboardLayout pageTitle="Faculty Dashboard" stats={stats}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Sessions */}
          <SectionCard title="Recent Sessions">
            <DataTable 
              columns={sessionColumns}
              data={data.recent_sessions.slice(0, 5)}
            />
          </SectionCard>

          {/* Exam Performance */}
          <SectionCard title="Exam Performance">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Exams</p>
                <p className="text-xl font-bold text-primary">{data.exam_performance.summary.total_exams}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Overall Pass %</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.exam_performance.summary.overall_pass_percentage.toFixed(1)}%</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Avg Result %</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.exam_performance.summary.overall_avg_percentage.toFixed(1)}%</p>
              </div>
            </div>
            <DataTable 
              columns={examColumns}
              data={data.exam_performance.exams.slice(0, 5)}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Attendance Trend Chart */}
          <SectionCard title="My Attendance Trend">
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Leave & Payroll Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border shadow-sm rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Leave Bal.</p>
                <p className="text-lg font-bold text-foreground">{data.leave.total_remaining_days} days</p>
              </div>
            </div>
            <div className="bg-card border border-border shadow-sm rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">This Month</p>
                <p className="text-lg font-bold text-foreground">₹{data.payroll_summary.this_month}</p>
              </div>
            </div>
          </div>

          {/* Pending Tasks & Notifications */}
          <SectionCard title="Recent Notifications">
            {data.recent_notifications.length > 0 ? (
              <div className="space-y-3">
                {data.recent_notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} className="p-3 rounded-lg bg-muted/40 border border-border/50 text-sm">
                    <p className="font-semibold text-foreground truncate">{notif.title}</p>
                    <p className="text-muted-foreground text-xs line-clamp-2 mt-1 leading-snug">{notif.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                <p className="text-sm">All caught up!</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
