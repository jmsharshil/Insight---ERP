import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { axiosRequest } from "@/service/axiosRequest";
import { BookOpen, Calendar, Percent, Wallet, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TimetableItem {
  day: string;
  subject: string;
  time: string;
  faculty: string;
  type: string;
}

interface ExamResult {
  id: string;
  exam__title: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  is_pass: boolean;
  rank: number | null;
  percentile?: number | null;
}

interface UpcomingExam {
  id: string;
  title: string;
  scheduled_date: string;
  subject__name: string;
  exam_type: string;
}

interface PendingInstallment {
  id: string;
  amount: number;
  due_date: string;
  plan__student_fee__fee_structure__name: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface DashboardData {
  kpis: {
    attendance_rate: number | string;
    exam_attendance?: number | string;
    fees_due: number;
    upcoming_exams_count: number;
    avg_score: number | string;
  };
  upcoming_exams: UpcomingExam[];
  recent_results: ExamResult[];
  timetable: TimetableItem[];
  fee_details: {
    due_count: number;
    next_due_date: string | null;
    pending_installments?: PendingInstallment[];
  };
  charts: {
    my_performance: {
      subjects: string[];
      scores: number[];
    };
  };
  unread_notifications?: number;
  recent_notifications?: Notification[];
  leave?: {
    pending_count: number;
    recent_leaves: {
      id: string;
      leave_type: string;
      from_date: string;
      to_date: string;
      status: string;
      reason: string;
      parent_consulted: boolean;
      parent_signature_date: string | null;
      created_at: string;
      status_display: string;
    }[];
    balances: any[];
    type: string;
  };
}

export default function ParentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
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
        console.error("Error fetching parent dashboard:", err);
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

  if (!data) {
    return (
      <DashboardLayout pageTitle="Parent Dashboard" stats={[]}>
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
      title: "Class Attendance",
      value: `${data.kpis.attendance_rate}`.includes('%') ? data.kpis.attendance_rate : `${data.kpis.attendance_rate}%`,
      icon: Percent,
      trendType: parsePct(data.kpis.attendance_rate) >= 75 ? "up" : "down",
      link: "/attendance",
    },
    {
      title: "Exam Attendance",
      value: data.kpis.exam_attendance ? (`${data.kpis.exam_attendance}`.includes('%') ? data.kpis.exam_attendance : `${data.kpis.exam_attendance}%`) : "N/A",
      icon: Percent,
      trendType: data.kpis.exam_attendance ? (parsePct(data.kpis.exam_attendance) >= 75 ? "up" : "down") : "neutral",
      link: "/exams",
    },
    {
      title: "Avg Score",
      value: `${data.kpis.avg_score}`.includes('%') ? data.kpis.avg_score : `${data.kpis.avg_score}%`,
      icon: BookOpen,
      trendType: "neutral",
      link: "/exams",
    },
    {
      title: "Fees Due",
      value: `₹${data.kpis.fees_due}`,
      icon: Wallet,
      trend: data.fee_details.due_count > 0 ? `${data.fee_details.due_count} pending` : "No dues",
      trendType: data.kpis.fees_due > 0 ? "warning" : "up",
      link: "/fees",
    },
    {
      title: "Upcoming Exams",
      value: data.kpis.upcoming_exams_count.toString(),
      icon: Calendar,
      trendType: data.kpis.upcoming_exams_count > 0 ? "neutral" : "up",
      link: "/exams",
    },
  ];

  const chartData = data.charts?.my_performance?.subjects?.map((sub, idx) => ({
    subject: sub.length > 15 ? sub.substring(0, 15) + "..." : sub,
    fullSubject: sub,
    score: data.charts.my_performance.scores[idx],
  })) || [];

  return (
    <DashboardLayout pageTitle="Parent Dashboard" stats={stats}>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">        
        {/* Recent Leaves */}
        <SectionCard title="Recent Leaves">
          {data.leave?.recent_leaves && data.leave.recent_leaves.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leave.recent_leaves.slice(0, 5).map((leave) => (
                    <tr key={leave.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground capitalize">
                        {leave.leave_type}
                        {leave.reason && (
                           <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={leave.reason}>{leave.reason}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs">
                          {new Date(leave.from_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })} 
                          {leave.from_date !== leave.to_date && ` - ${new Date(leave.to_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border",
                          leave.status === "approved" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                          leave.status === "rejected" ? "text-red-600 bg-red-50 border-red-200" :
                          "text-amber-600 bg-amber-50 border-amber-200"
                        )}>
                          {leave.status_display || leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center bg-muted/20 rounded-lg mt-4">
              <p className="text-sm text-muted-foreground">No recent leaves.</p>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Performance Chart */}
        <SectionCard title="Child's Performance (Recent Exams)">
          <div className="h-64 w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 12, fill: "#64748b" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "#64748b" }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullSubject || label}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">No performance data available.</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Timetable */}
        <SectionCard title="Upcoming Classes">
          {data.timetable?.length > 0 ? (
            <ul className="space-y-3 mt-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {data.timetable.map((c, i) => {
                const [start] = c.time.split("-");
                return (
                  <li key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-2 min-w-[70px]">
                      <span className="text-[10px] uppercase font-bold text-primary">{c.day.substring(0,3)}</span>
                      <span className="font-mono text-xs font-bold text-primary-dark">{start?.substring(0, 5)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" title={c.subject}>{c.subject}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <span className="truncate">{c.faculty}</span>
                        {c.type === "prelim" && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded ml-2 font-medium">Prelim</span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex h-64 items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">No classes scheduled.</p>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <SectionCard title="Recent Results">
          {data.recent_results?.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Exam</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Percentile</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_results.slice(0, 5).map((res) => (
                    <tr key={res.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground truncate max-w-[150px]" title={res.exam__title}>
                        {res.exam__title}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{res.marks_obtained}</span>
                          <span className="text-[10px] text-muted-foreground">/ {res.total_marks}</span>
                          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {res.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {res.percentile != null ? res.percentile : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {res.is_pass ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-[10px] font-bold border border-red-200">
                            <XCircle className="w-3 h-3" /> FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">No recent results.</p>
            </div>
          )}
        </SectionCard>

        {/* Upcoming Exams */}
        <SectionCard title="Upcoming Exams">
          {data.upcoming_exams?.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Date</th>
                    <th className="px-4 py-3">Exam Details</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcoming_exams.slice(0, 5).map((exam) => (
                    <tr key={exam.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {new Date(exam.scheduled_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground truncate max-w-[180px]" title={exam.title}>{exam.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={exam.subject__name}>{exam.subject__name}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="uppercase text-[10px] font-bold bg-muted px-2 py-1 rounded text-muted-foreground border border-border tracking-wider">
                          {exam.exam_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">No upcoming exams.</p>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Pending Installments */}
        <SectionCard title="Pending Fee Installments">
          {data.fee_details?.pending_installments && data.fee_details.pending_installments.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Fee Structure</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fee_details.pending_installments.slice(0, 5).map((inst) => (
                    <tr key={inst.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground truncate max-w-[200px]" title={inst.plan__student_fee__fee_structure__name}>
                        {inst.plan__student_fee__fee_structure__name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">
                          {new Date(inst.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold font-heading">
                        ₹{inst.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center bg-muted/20 rounded-lg mt-4">
              <p className="text-sm text-muted-foreground">No pending installments.</p>
            </div>
          )}
        </SectionCard>

        {/* Recent Notifications */}
        <SectionCard title="Recent Notifications">
          {data.recent_notifications && data.recent_notifications.length > 0 ? (
            <ul className="space-y-3 mt-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {data.recent_notifications.map((notif) => (
                <li key={notif.id} className="flex items-start gap-4 p-3 rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className={cn("w-2 h-2 mt-1.5 rounded-full shrink-0", "bg-primary")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm truncate", "font-medium text-foreground")} title={notif.title}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-foreground mt-1 line-clamp-2" title={notif.body}>
                      {notif.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(notif.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-48 items-center justify-center bg-muted/20 rounded-lg mt-4">
              <p className="text-sm text-muted-foreground">No recent notifications.</p>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
