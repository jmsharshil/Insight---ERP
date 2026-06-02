import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { BookOpen, CalendarClock, FileSearch, UserPlus } from "lucide-react";

export default function AdminSeniorExecDashboard() {
  return (
    <DashboardLayout
      pageTitle="Admin Sr. Executive Dashboard"
      stats={[
      { title: "Today's Admissions", value: "4", icon: UserPlus, trend: "On track", trendType: "up" },
      { title: "Timetable Conflicts", value: "2", icon: CalendarClock, trend: "Needs review", trendType: "down" },
      { title: "Recheck Requests", value: "3", icon: FileSearch, trend: "Pending", trendType: "neutral" },
      { title: "Upcoming Exams", value: "2", icon: BookOpen, trend: "This week", trendType: "neutral" }
      ]}
    >
      <SectionCard title="Quick Actions">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {["Add Student","Create Timetable","Add Fee Entry","Schedule Exam","Approve Recheck","View Reports"].map(a=>(
          <button key={a} className="rounded-lg border border-border bg-card hover:bg-primary-light hover:border-primary transition-all p-4 text-sm font-medium text-text-primary">{a}</button>
        ))}
      </div>
    </SectionCard>
    </DashboardLayout>
  );
}
