import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { 
  CalendarDays, CalendarClock, Clock, Wallet 
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
import { format } from "date-fns";
import HoverValue from "@/components/common/HoverValue";

export default function ExamSupervisorDashboard() {
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
      <DashboardLayout pageTitle="Exam Supervisor Dashboard" stats={[]}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Failed to load dashboard data.</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats: StatItem[] = [
    {
      title: "Today's Exams",
      value: data.kpis?.today_sessions || 0,
      icon: CalendarDays,
      trendType: (data.kpis?.today_sessions || 0) > 0 ? "up" : "neutral",
    },
    {
      title: "Monthly Exams",
      value: data.kpis?.monthly_sessions || 0,
      icon: CalendarClock,
      trendType: "neutral",
    },
    {
      title: "Upcoming Exams",
      value: data.kpis?.upcoming_exams || 0,
      icon: Clock,
      trendType: "neutral",
    }
  ];

  return (
    <DashboardLayout pageTitle="Exam Supervisor Dashboard" stats={stats}>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <SectionCard title="Payroll Summary">
          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> This Month
              </p>
              <p className="text-3xl font-bold font-heading mt-2">
                ₹<HoverValue value={data.payroll_summary?.this_month || 0} />
              </p>
            </div>
            <div className="bg-muted p-4 rounded-xl border border-border">
              <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
              <p className="text-xl font-semibold mt-1">
                ₹<HoverValue value={data.payroll_summary?.pending || 0} />
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Upcoming Exams">
          <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
            {data.upcoming_exams && data.upcoming_exams.length > 0 ? (
              data.upcoming_exams.map((exam: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-semibold">{exam.title || exam.name || 'Exam'}</p>
                    {exam.date && <p className="text-xs text-muted-foreground mt-1">Date: {exam.date}</p>}
                  </div>
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Upcoming</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams.</p>
            )}
          </div>
        </SectionCard>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        <SectionCard title="Today's Schedule">
          <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
            {data.today_schedule && data.today_schedule.length > 0 ? (
              data.today_schedule.map((session: any, idx: number) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">{session.subject__name || 'Session'}</p>
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
