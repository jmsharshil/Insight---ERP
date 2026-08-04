import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { 
  Users, UserPlus, Percent, PhoneCall 
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { format } from "date-fns";

interface SalesSeniorExecData {
  kpis: {
    total_leads: number;
    new_leads_this_month: number;
    conversion_rate: string;
    active_leads: number;
  };
  pipeline: { current_stage: string; reference: string; count: number }[];
  recent_leads: {
    id: number;
    first_name: string;
    surname: string;
    phone_student: string;
    current_stage: string;
    reference: string;
    assigned_to__name: string | null;
    created_at: string;
  }[];
  conversion_trend: {
    labels: string[];
    values: number[];
  };
  top_sources: {
    reference: string;
    count: number;
  }[];
  recent_notifications: { title: string; body: string; created_at: string }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1'];

export default function SalesSeniorExecDashboard() {
  const [data, setData] = useState<SalesSeniorExecData | null>(null);
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
      <DashboardLayout pageTitle="Sales Sr. Executive Dashboard" stats={[]}>
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
      title: "Total Leads",
      value: data.kpis?.total_leads || 0,
      icon: Users,
      trendType: "neutral",
      link: "/crm",
    },
    {
      title: "New Leads (This Month)",
      value: data.kpis?.new_leads_this_month || 0,
      icon: UserPlus,
      trendType: (data.kpis?.new_leads_this_month || 0) > 0 ? "up" : "neutral",
      link: "/crm",
    },
    {
      title: "Conversion Rate",
      value: data.kpis?.conversion_rate || "0%",
      icon: Percent,
      trendType: parsePct(data.kpis?.conversion_rate) >= 10 ? "up" : "neutral",
      link: "/crm",
    },
    {
      title: "Active Leads",
      value: data.kpis?.active_leads || 0,
      icon: PhoneCall,
      trendType: "neutral",
      link: "/crm",
    }
  ];

  const conversionTrendData = data.conversion_trend?.labels?.map((date, idx) => ({
    date: format(new Date(date), "dd MMM"),
    value: data.conversion_trend.values[idx] || 0
  })) || [];

  const aggregatePipeline = data.pipeline?.reduce((acc, curr) => {
    const stage = curr.current_stage || 'Unknown';
    acc[stage] = (acc[stage] || 0) + curr.count;
    return acc;
  }, {} as Record<string, number>);

  const pipelineDisplay = Object.entries(aggregatePipeline || {}).map(([stage, count]) => ({
    stage, count
  }));

  const topSourcesCleaned = (data.top_sources || []).map(s => ({
    reference: s.reference || "Other/Direct",
    count: s.count
  }));

  return (
    <DashboardLayout pageTitle="Sales Sr. Executive Dashboard" stats={stats}>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <SectionCard title="Conversion Trend">
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Top Lead Sources">
          <div className="h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topSourcesCleaned}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="reference"
                >
                  {topSourcesCleaned.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {topSourcesCleaned.map((entry, index) => (
              <div key={entry.reference} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="capitalize">{entry.reference}:</span>
                <span className="font-semibold">{entry.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        <SectionCard title="Lead Pipeline">
          <div className="space-y-3 mt-4">
            {pipelineDisplay.map((stage, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium capitalize text-muted-foreground">{stage.stage.replace(/_/g, ' ')}</span>
                <span className="bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full text-xs">
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title="Recent Leads">
            <DataTable
              columns={[
                { key: "name", header: "Name", render: (r) => `${r.first_name || ''} ${r.surname || ''}`.trim() || 'Unknown' },
                { key: "phone", header: "Phone", render: (r) => r.phone_student || '—' },
                { key: "stage", header: "Stage", render: (r) => (
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    r.current_stage === 'converted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {r.current_stage?.replace(/_/g, ' ') || 'New'}
                  </span>
                )},
                { key: "reference", header: "Source", render: (r) => r.reference || '—' },
                { key: "assigned", header: "Assigned To", render: (r) => r.assigned_to__name || 'Unassigned' },
                { key: "date", header: "Date", render: (r) => format(new Date(r.created_at), "dd MMM") },
              ]}
              data={data.recent_leads || []}
              searchable={false}
            />
          </SectionCard>
        </div>

      </div>

      <div className="mt-6">
        <SectionCard title="Recent Notifications">
          <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
            {(data.recent_notifications || []).map((notification, idx) => (
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
