import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Eye, UserPlus, Wallet } from "lucide-react";

export default function ExamSupervisorDashboard() {
  return (
    <DashboardLayout
      pageTitle="Exam Supervisor Dashboard"
      stats={[
      { title: "Upcoming Supervisions", value: "2", icon: Eye, trend: "This week", trendType: "neutral" },
      { title: "Today's Exams", value: "1", icon: BookOpen, trend: "Physics — 2 PM", trendType: "neutral" },
      { title: "Hours This Month", value: "14", icon: Clock, trend: "+2 vs last month", trendType: "up" },
      { title: "Payroll", value: "₹2,800", icon: Wallet, trend: "Pending", trendType: "warning" }
      ]}
    >
      <SectionCard title="Upcoming Schedule">
      <DataTable
        columns={[
          { key: "date", header: "Date" },
          { key: "exam", header: "Exam" },
          { key: "room", header: "Room" },
          { key: "duration", header: "Duration" },
        ]}
        data={[
          { date: "May 30", exam: "Physics — Class 12", room: "Hall A", duration: "3h" },
          { date: "June 2", exam: "Mathematics — Class 11", room: "Hall B", duration: "3h" },
        ]}
        searchable={false}
      />
    </SectionCard>
    </DashboardLayout>
  );
}
