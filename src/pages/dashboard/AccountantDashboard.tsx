import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { 
  Users, UserPlus, Percent, Wallet, AlertCircle, PhoneCall 
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { format } from "date-fns";
import LeaveOverview from "./LeaveOverview";

interface AccountantData {
  kpis: {
    total_active_students: number;
    new_admissions: number;
    attendance_rate: string;
    fee_collected: number | string;
    pending_fees: number | string;
    overdue_fees: number | string;
    open_leads: number;
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
  leave: any;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function AccountantDashboard() {
  const [data, setData] = useState<AccountantData | null>(null);
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
      <DashboardLayout pageTitle="Accountant Dashboard" stats={[]}>
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
  
  const parseAmt = (val: string | number) => {
    if (!val) return "₹0";
    if (typeof val === 'number') return `₹${val.toLocaleString('en-IN')}`;
    return `₹${val}`;
  };

  const stats: StatItem[] = [
    {
      title: "Active Students",
      value: data.kpis?.total_active_students || 0,
      icon: Users,
      trendType: "neutral",
    },
    {
      title: "New Admissions",
      value: data.kpis?.new_admissions || 0,
      icon: UserPlus,
      trendType: (data.kpis?.new_admissions || 0) > 0 ? "up" : "neutral",
    },
    {
      title: "Attendance Rate",
      value: data.kpis?.attendance_rate || "0%",
      icon: Percent,
      trendType: parsePct(data.kpis?.attendance_rate) >= 80 ? "up" : "down",
    },
    {
      title: "Fee Collected",
      value: parseAmt(data.kpis?.fee_collected),
      icon: Wallet,
      trendType: "up",
    },
    {
      title: "Pending Fees",
      value: parseAmt(data.kpis?.pending_fees),
      icon: AlertCircle,
      trendType: "warning",
    },
    {
      title: "Open Leads",
      value: data.kpis?.open_leads || 0,
      icon: PhoneCall,
      trendType: "neutral",
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

  const activityColumns = [
    { header: "Activity", accessor: "title" as const, key: "title" },
    { header: "Details", accessor: "body" as const, key: "body" },
    { 
      header: "Date", 
      accessor: (row: any) => format(new Date(row.created_at), "dd MMM yyyy, HH:mm"),
      key: "date"
    }
  ];

  return (
    <DashboardLayout pageTitle="Accountant Dashboard" stats={stats}>
      
      {/* Leave Overview */}
      {data.leave && <LeaveOverview data={data.leave} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SectionCard title="Fee Collection Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, "Collected"]}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFee)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Attendance Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`${val}%`, "Attendance"]}
                />
                <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {data.charts?.attendance_by_batch && (
          <SectionCard title="Attendance by Batch">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.attendance_by_batch} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="batch" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} tickFormatter={(val) => val.length > 10 ? val.substring(0,10)+'...' : val} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        )}

        {data.charts?.enrollment_by_course && (
          <SectionCard title="Enrollment by Course">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.enrollment_by_course}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="course"
                  >
                    {data.charts.enrollment_by_course.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {data.charts.enrollment_by_course.map((entry, index) => (
                  <div key={entry.course} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground capitalize">{entry.course.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      <div className="mt-6">
        <SectionCard title="Recent Activities">
          <DataTable 
            data={data.recent_activities || []} 
            columns={activityColumns}
          />
        </SectionCard>
      </div>

    </DashboardLayout>
  );
}
