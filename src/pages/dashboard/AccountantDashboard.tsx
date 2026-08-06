import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { 
  Wallet, AlertCircle, Clock, CreditCard, RefreshCcw, Calendar 
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";

interface AccountantData {
  kpis: {
    fee_collected: number | string;
    pending_fees: number | string;
    overdue_fees: number | string;
    pending_payments: number;
    pending_refunds: number;
    pending_installments: number;
  };
  fee_collection_trend: {
    labels: string[];
    values: number[];
  };
  recent_payments: {
    id: string;
    receipt_number: string;
    amount: number;
    mode: string;
    date: string;
    student_name: string;
  }[];
  recent_notifications: {
    id: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
  }[];
  leave: any;
}

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

  const parseAmtStr = (val: string | number) => {
    if (!val && val !== 0) return "₹0";
    if (typeof val === 'number') return `₹${val.toLocaleString('en-IN')}`;
    const match = val.match(/^([\d.]+)\s*(?:\((.*?)\))?$/);
    if (match) {
      const num = parseFloat(match[1]);
      const formattedNum = `₹${num.toLocaleString('en-IN')}`;
      if (match[2]) {
         return `${formattedNum} (${match[2]})`;
      }
      return formattedNum;
    }
    return val.toString();
  };

  const stats: StatItem[] = [
    {
      title: "Fee Collected",
      value: parseAmtStr(data.kpis?.fee_collected),
      icon: Wallet,
      trendType: "up",
      link: "/fees",
    },
    {
      title: "Pending Fees",
      value: parseAmtStr(data.kpis?.pending_fees),
      icon: Clock,
      trendType: "neutral",
      link: "/fees",
    },
    {
      title: "Overdue Fees",
      value: parseAmtStr(data.kpis?.overdue_fees),
      icon: AlertCircle,
      trendType: Number(data.kpis?.overdue_fees) > 0 ? "down" : "neutral",
      link: "/fees",
    },
    {
      title: "Pending Payments",
      value: data.kpis?.pending_payments || 0,
      icon: CreditCard,
      trendType: "neutral",
      link: "/fees",
    },
    {
      title: "Pending Refunds",
      value: data.kpis?.pending_refunds || 0,
      icon: RefreshCcw,
      trendType: "neutral",
      link: "/fees",
    },
  ];

  const feeTrendData = data.fee_collection_trend?.labels?.map((label, idx) => ({
    label,
    value: data.fee_collection_trend.values[idx] || 0
  })) || [];

  const paymentColumns = [
    { header: "Receipt No.", accessor: "receipt_number" as const, key: "receipt_number" },
    { header: "Student", accessor: "student_name" as const, key: "student_name" },
    { header: "Amount", render: (row: any) => `₹${row.amount.toLocaleString('en-IN')}`, key: "amount" },
    { header: "Mode", render: (row: any) => <span className="capitalize">{row.mode}</span>, key: "mode" },
    { header: "Date", accessor: (row: any) => format(new Date(row.date), "dd MMM yyyy"), key: "date" }
  ];

  const notificationColumns = [
    { header: "Title", accessor: "title" as const, key: "title" },
    { header: "Details", render: (row: any) => <span className="truncate max-w-[200px] block" title={row.body}>{row.body}</span>, key: "body" },
    { header: "Date", accessor: (row: any) => format(new Date(row.created_at), "dd MMM, HH:mm"), key: "date" }
  ];

  return (
    <DashboardLayout pageTitle="Accountant Dashboard" stats={stats}>
      <div className="grid grid-cols-1 mt-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SectionCard title="Recent Payments">
          <DataTable 
            data={data.recent_payments || []} 
          columns={paymentColumns}
          />
        </SectionCard>

        <SectionCard title="Recent Notifications">
          <DataTable 
            data={data.recent_notifications || []} 
            columns={notificationColumns}
          />
        </SectionCard>
      </div>

    </DashboardLayout>
  );
}
