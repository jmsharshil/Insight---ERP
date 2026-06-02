import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarOff, CheckCircle2, UserPlus, Wallet } from "lucide-react";

export default function FacultyDashboard() {
  return (
    <DashboardLayout
      pageTitle="Faculty Dashboard"
      stats={[
      { title: "Today's Sessions", value: "3", icon: Calendar, trend: "Next at 11 AM", trendType: "neutral" },
      { title: "Sessions This Week", value: "12", icon: CheckCircle2, trend: "+2 vs avg", trendType: "up" },
      { title: "Leave Balance", value: "8 days", icon: CalendarOff, trend: "Casual + Sick", trendType: "neutral" },
      { title: "Payroll Status", value: "Pending", icon: Wallet, trend: "Runs on 31st", trendType: "warning" }
      ]}
    >
      <SectionCard title="Submit Session Report" action={<Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary-dark">Quick Submit</Button>}>
      <p className="text-sm text-muted-foreground">Log today's sessions, topics covered, and student attendance. Full form opens in Part 2.</p>
    </SectionCard>
    </DashboardLayout>
  );
}
