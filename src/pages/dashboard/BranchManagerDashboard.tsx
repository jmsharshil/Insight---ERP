import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { 
  Users, UserPlus, Percent, Wallet, AlertCircle, PhoneCall 
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { format } from "date-fns";

interface BranchManagerData {
  kpis: {
    total_active_students: number;
    new_admissions: number;
    attendance_rate: string;
    fee_collected: number;
    pending_fees: number;
    overdue_fees: number;
    open_leads: number;
  };
  exam_stats: {
    avg_exam_attendance_pct: number;
    avg_pass_percentage: number;
    avg_result_percentage: number;
    total_exams_completed: number;
    total_published_results: number;
  };
  attendance_trend: {
    dates: string[];
    rates: number[];
  };
  fee_collection_trend: {
    labels: string[];
    values: number[];
  };
  lead_pipeline: { current_stage: string; count: number }[];
  recent_activities: { title: string; body: string; created_at: string }[];
  charts: {
    attendance_by_batch: { batch: string; rate: number }[];
    enrollment_by_course: { course: string; count: number }[];
  };
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function BranchManagerDashboard() {
  const [data, setData] = useState<BranchManagerData | null>(null);
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
      <DashboardLayout pageTitle="Branch Manager Dashboard" stats={[]}>
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
      title: "Active Students",
      value: data.kpis?.total_active_students || 0,
      icon: Users,
      trendType: "neutral",
      link: "/students",
    },
    {
      title: "New Admissions",
      value: data.kpis?.new_admissions || 0,
      icon: UserPlus,
      trendType: (data.kpis?.new_admissions || 0) > 0 ? "up" : "neutral",
      link: "/students",
    },
    {
      title: "Attendance Rate",
      value: data.kpis?.attendance_rate || "0%",
      icon: Percent,
      trendType: parsePct(data.kpis?.attendance_rate) >= 80 ? "up" : "down",
      link: "/attendance",
    },
    {
      title: "Fee Collected",
      value: `₹${(data.kpis?.fee_collected || 0).toLocaleString('en-IN')}`,
      icon: Wallet,
      trendType: "up",
      link: "/fees",
    },
    {
      title: "Pending Fees",
      value: `₹${(data.kpis?.pending_fees || 0).toLocaleString('en-IN')}`,
      icon: AlertCircle,
      trendType: (data.kpis?.pending_fees || 0) > 0 ? "warning" : "neutral",
      link: "/fees",
    },
    {
      title: "Open Leads",
      value: data.kpis?.open_leads || 0,
      icon: PhoneCall,
      trendType: "neutral",
      link: "/crm",
    }
  ];

  const attendanceTrendData = data.attendance_trend?.dates?.map((date, idx) => ({
    date: format(new Date(date), "dd MMM"),
    rate: data.attendance_trend.rates[idx] || 0
  })) || [];

  const feeTrendData = data.fee_collection_trend?.labels?.map((label, idx) => ({
    label,
    value: data.fee_collection_trend.values[idx] || 0
  })) || [];

  return (
    <DashboardLayout pageTitle="Branch Manager Dashboard" stats={stats}>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <SectionCard title="Attendance Trend">
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Attendance Rate']} />
                <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Fee Collection Trend">
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Collected']} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        <SectionCard title="Enrollment by Course">
          <div className="h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts?.enrollment_by_course || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="course"
                >
                  {(data.charts?.enrollment_by_course || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {(data.charts?.enrollment_by_course || []).map((entry, index) => (
              <div key={entry.course} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="capitalize">{entry.course.replace(/_/g, ' ')}:</span>
                <span className="font-semibold">{entry.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Lead Pipeline">
          <div className="space-y-3 mt-4">
            {(data.lead_pipeline || []).map((stage, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium capitalize text-muted-foreground">{stage.current_stage.replace(/_/g, ' ')}</span>
                <span className="bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full text-xs">
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Exam Stats">
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Total Exams Completed</span>
              <span className="font-semibold">{data.exam_stats?.total_exams_completed || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Results Published</span>
              <span className="font-semibold">{data.exam_stats?.total_published_results || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Avg Attendance</span>
              <span className="font-semibold">{data.exam_stats?.avg_exam_attendance_pct || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Avg Pass Rate</span>
              <span className="font-semibold">{data.exam_stats?.avg_pass_percentage || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Avg Result Score</span>
              <span className="font-semibold">{data.exam_stats?.avg_result_percentage || 0}%</span>
            </div>
          </div>
        </SectionCard>

      </div>

      <div className="mt-6">
        <SectionCard title="Recent Activities">
          <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
            {(data.recent_activities || []).map((activity, idx) => (
              <div key={idx} className="flex flex-col gap-1 p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-semibold text-foreground">{activity.title}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.created_at), "dd MMM, HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {activity.body}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

    </DashboardLayout>
  );
}
