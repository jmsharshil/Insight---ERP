import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Percent, UserPlus, Wallet } from "lucide-react";

export default function StudentDashboard() {
  return (
    <DashboardLayout
      pageTitle="Student Dashboard"
      stats={[
      { title: "Attendance %", value: "87%", icon: Percent, trend: "+2% this month", trendType: "up" },
      { title: "Next Exam", value: "Physics", icon: BookOpen, trend: "In 3 days", trendType: "warning" },
      { title: "Fee Due", value: "₹8,500", icon: Wallet, trend: "Due in 5 days", trendType: "warning" },
      { title: "Today's Classes", value: "3", icon: Calendar, trend: "Next at 11 AM", trendType: "neutral" }
      ]}
    >
      <SectionCard title="Today's Timetable">
      <ul className="space-y-3">
        {[{t:"09:00 AM",s:"Physics",f:"Dr. Meera Nair",r:"Room 204"},
          {t:"11:00 AM",s:"Mathematics",f:"Prof. R. Kumar",r:"Room 102"},
          {t:"02:00 PM",s:"Chemistry",f:"Dr. A. Verma",r:"Lab 3"}].map((c,i)=>(
          <li key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
            <div className="font-mono text-sm font-bold text-primary-dark min-w-[80px]">{c.t}</div>
            <div className="flex-1">
              <p className="font-medium text-sm">{c.s}</p>
              <p className="text-xs text-muted-foreground">{c.f} · {c.r}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
    </DashboardLayout>
  );
}
