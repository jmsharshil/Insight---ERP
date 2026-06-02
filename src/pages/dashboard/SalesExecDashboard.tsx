import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Phone, UserPlus, Users } from "lucide-react";

export default function SalesExecDashboard() {
  return (
    <DashboardLayout
      pageTitle="Sales Executive Dashboard"
      stats={[
      { title: "My Inquiries", value: "11", icon: Users, trend: "Active", trendType: "neutral" },
      { title: "Follow-ups Today", value: "3", icon: Clock, trend: "By 6 PM", trendType: "warning" },
      { title: "Calls This Week", value: "24", icon: Phone, trend: "+6 vs avg", trendType: "up" },
      { title: "Closed This Month", value: "4", icon: CheckCircle2, trend: "On track", trendType: "up" }
      ]}
    >
      <SectionCard title="My Inquiries">
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "course", header: "Interest" },
          { key: "stage", header: "Stage" },
          { key: "nextAction", header: "Next Action" },
        ]}
        data={[
          { name: "Vivek Joshi", course: "JEE", stage: "Contacted", nextAction: "Send brochure" },
          { name: "Ritika Nair", course: "NEET", stage: "Negotiating", nextAction: "Fee discussion" },
          { name: "Aditya Rao", course: "CA", stage: "New", nextAction: "Initial call" },
        ]}
      />
    </SectionCard>
    </DashboardLayout>
  );
}
