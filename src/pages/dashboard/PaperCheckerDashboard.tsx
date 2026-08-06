import { useEffect, useState } from "react";
import DashboardLayout, { StatItem } from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import { 
  CheckCircle2, Clock, FileText, AlertCircle
} from "lucide-react";
import { axiosRequest } from "@/service/axiosRequest";
import { ReportsSkeleton } from "@/components/common/Skeletons";
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

  const stats: StatItem[] = [
    {
      title: "Pending Papers",
      value: data.kpis?.total_pending || 0,
      icon: Clock,
      trendType: (data.kpis?.total_pending || 0) > 0 ? "warning" : "neutral",
    },
    {
      title: "Checked Today",
      value: data.kpis?.checked_papers_today || 0,
      icon: CheckCircle2,
      trendType: "neutral",
    },
    {
      title: "Assigned Today",
      value: data.kpis?.assigned_papers_today || 0,
      icon: FileText,
      trendType: "neutral",
    },
    {
      title: "Open Queries",
      value: data.kpis?.open_queries || 0,
      icon: AlertCircle,
      trendType: (data.kpis?.open_queries || 0) > 0 ? "down" : "neutral",
    }
  ];

  return (
    <DashboardLayout pageTitle="Paper Checker Dashboard" stats={stats}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SectionCard title="Pending Papers">
          <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
            {data.pending_papers && data.pending_papers.length > 0 ? (
              data.pending_papers.map((paper: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground">{paper.exam_title}</p>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pending</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-col gap-1">
                    <p><span className="font-medium text-foreground/80">Student:</span> {paper.student_name}</p>
                    <p><span className="font-medium text-foreground/80">Subject:</span> {paper.subject}</p>
                    {paper.exam_date && <p><span className="font-medium text-foreground/80">Date:</span> {format(new Date(paper.exam_date), "dd MMM yyyy")}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No pending papers to check.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Recent Checked Papers">
          <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
            {data.recent_checked_papers && data.recent_checked_papers.length > 0 ? (
              data.recent_checked_papers.map((paper: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-foreground">{paper.exam_title}</p>
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Checked</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-col gap-1">
                    <p><span className="font-medium text-foreground/80">Student:</span> {paper.student_name}</p>
                    <p><span className="font-medium text-foreground/80">Subject:</span> {paper.subject}</p>
                    <p><span className="font-medium text-foreground/80">Marks:</span> {paper.marks_obtained}</p>
                    {paper.checked_at && <p><span className="font-medium text-foreground/80">Checked:</span> {format(new Date(paper.checked_at), "dd MMM yyyy, HH:mm")}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recently checked papers.</p>
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
