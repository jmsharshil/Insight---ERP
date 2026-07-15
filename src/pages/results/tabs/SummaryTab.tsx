import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { dropdownActions } from "@/redux/actions";
import { API } from "@/service/api";
import { motion } from "framer-motion";
import { Users, CheckCircle, GraduationCap, Trophy, BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function SummaryTab() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: API.RESULTS_ANALYTICS.SUMMARY,
      auth: true,
      setLoading: (v: boolean) => setLoading(v),
      getResponse: (res: any) => {
        setData(res?.data || res);
      },
      getError: (err: any) => {
        console.error("Failed to fetch summary", err);
      }
    } as any);
  }, [dispatch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-border">
        <p className="text-muted-foreground">No analytics data available.</p>
      </div>
    );
  }

  const overall = data.overall || {};

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Total Students
            </p>
            <h4 className="text-2xl font-bold font-heading">{overall.total_students || 0}</h4>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Passed Students
            </p>
            <h4 className="text-2xl font-bold font-heading">{overall.passed_students || 0}</h4>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Pass Percentage
            </p>
            <h4 className="text-2xl font-bold font-heading">
              {overall.pass_percentage ? overall.pass_percentage.toFixed(2) : 0}%
            </h4>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-xl border border-border flex items-center gap-4 shadow-sm"
        >
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Avg Marks
            </p>
            <h4 className="text-2xl font-bold font-heading">
              {overall.average_marks ? overall.average_marks.toFixed(2) : 0}
            </h4>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Top Subjects */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col">
          <h3 className="font-heading font-semibold mb-4 text-sm">Top Subjects (By Pass %)</h3>
          {data.top_subjects && data.top_subjects.length > 0 ? (
            <div className="w-full mt-4" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.top_subjects.map((s: any) => {
                    const name = s.exam__subject__name || s.subject_name || "Unknown";
                    return {
                      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
                      fullName: name,
                      passPct: s.pass_pct ? Number(s.pass_pct.toFixed(2)) : 0,
                      avgMarks: s.avg_marks ? Number(s.avg_marks.toFixed(2)) : 0,
                    };
                   })}
                  margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: "#6b7280" }} 
                    angle={-45}
                    textAnchor="end" 
                    axisLine={false} 
                    tickLine={false} 
                    interval={0}
                    height={70}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "#6b7280" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullName || label;
                      }
                      return label;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="passPct" name="Pass %" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="avgMarks" name="Avg Marks" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 w-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No subject data available.</p>
            </div>
          )}
        </div>

        {/* Top Faculty */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col">
          <h3 className="font-heading font-semibold mb-4 text-sm">Top Faculty (By Pass %)</h3>
          {data.top_faculty && data.top_faculty.length > 0 ? (
            <div className="w-full mt-4" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.top_faculty.map((f: any) => {
                    const name = f.exam__faculty__user__name || f.faculty_name || "Unknown";
                    return {
                      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
                      fullName: name,
                      passPct: f.pass_pct ? Number(f.pass_pct.toFixed(2)) : 0,
                      avgMarks: f.avg_marks ? Number(f.avg_marks.toFixed(2)) : 0,
                    };
                  })}
                  margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: "#6b7280" }} 
                    angle={-45} 
                    textAnchor="end" 
                    axisLine={false} 
                    tickLine={false} 
                    interval={0}
                    height={70}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "#6b7280" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullName || label;
                      }
                      return label;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="passPct" name="Pass %" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="avgMarks" name="Avg Marks" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 w-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No faculty data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
