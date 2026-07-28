import { useEffect, useState, useMemo } from "react";
import { axiosRequest } from "@/service/axiosRequest";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Clock } from "lucide-react";
import { THEME } from "@/config/theme";

interface LeaveBalance {
  user_id: string;
  user_name: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  remaining: number;
}

interface LeaveTakenByType {
  leave_type: string;
  total_days: number;
  count: number;
}

interface AnalyticsData {
  leave_balance: LeaveBalance[];
  leave_taken_by_type: LeaveTakenByType[];
  pending_approvals: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const raw = localStorage.getItem("Insight_Login_Data");
        const token = raw ? JSON.parse(raw)?.access : "";
        const baseUrl = import.meta.env.VITE_APP_BASE_URL || "";

        const res = await axiosRequest({
          method: "GET",
          url: `${baseUrl}/api/v1/reports/leaves/`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setData(res.data?.data || null);
      } catch (err) {
        console.error("Error fetching leave analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Prepare data for bar chart: used vs remaining by user
  const userBalances = useMemo(() => {
    if (!data) return [];
    const grouped = data.leave_balance.reduce((acc, curr) => {
      if (!acc[curr.user_name]) {
        acc[curr.user_name] = { name: curr.user_name, used: 0, remaining: 0 };
      }
      acc[curr.user_name].used += curr.used_days;
      acc[curr.user_name].remaining += curr.remaining;
      return acc;
    }, {} as Record<string, { name: string, used: number, remaining: number }>);
    
    // Sort by most used leave, take top 10
    return Object.values(grouped)
      .sort((a, b) => b.used - a.used)
      .slice(0, 10);
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.leave_taken_by_type.map(item => ({
      name: item.leave_type.charAt(0).toUpperCase() + item.leave_type.slice(1),
      value: item.total_days
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 mt-2">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending Approvals</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pending_approvals}</div>
            <p className="text-xs text-muted-foreground mt-1">Leaves awaiting manager approval</p>
          </CardContent>
        </Card>
        
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leaves Taken</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.leave_taken_by_type.reduce((acc, curr) => acc + curr.total_days, 0)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all leave types</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff on Leave</CardTitle>
            <Users className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(data.leave_balance.filter(l => l.used_days > 0).map(l => l.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Staff members who have taken leave</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Taken by Type Pie Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Leaves Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} days`, 'Total Days']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">No leave data available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Leave Takers Bar Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Leave Usage by Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {userBalances.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userBalances} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      tick={{ fontSize: 11, textAnchor: 'end' }}
                      height={60}
                      interval={0}
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                    <Bar dataKey="used" name="Used Days" stackId="a" fill={THEME.colors.primary} radius={[0, 0, 4, 4]} />
                    <Bar dataKey="remaining" name="Remaining Days" stackId="a" fill={THEME.colors.gray} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">No user leave data available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
