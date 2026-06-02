import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { BookOpen, Percent, UserCheck, UserPlus, Wallet } from "lucide-react";

export default function ParentDashboard() {
  return (
    <DashboardLayout
      pageTitle="Parent Dashboard"
      stats={[
      { title: "Child", value: "Dhruv Shah", icon: UserCheck, trend: "Class 12 Science", trendType: "neutral" },
      { title: "Attendance Today", value: "Present ✅", icon: Percent, trend: "On time", trendType: "up" },
      { title: "Fee Due", value: "₹8,500", icon: Wallet, trend: "5 days left", trendType: "warning" },
      { title: "Next Exam", value: "Physics", icon: BookOpen, trend: "In 3 days", trendType: "warning" }
      ]}
    >
      <SectionCard title="Recent Notifications">
      <ul className="divide-y divide-border">
        {[{t:"Physics exam scheduled for June 2",d:"2h ago"},
          {t:"Fee installment due on June 4",d:"1d ago"},
          {t:"Parent-teacher meeting on June 8",d:"2d ago"},
          {t:"Dhruv was awarded \"Best Performer\" in Mathematics test",d:"3d ago"}].map((n,i)=>(
          <li key={i} className="py-3 flex items-start justify-between gap-3">
            <p className="text-sm">{n.t}</p>
            <span className="text-xs text-muted-foreground flex-shrink-0">{n.d}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
    </DashboardLayout>
  );
}
