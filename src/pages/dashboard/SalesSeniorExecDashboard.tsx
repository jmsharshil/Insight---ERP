import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Percent, TrendingUp, UserPlus, UserX, Users } from "lucide-react";

export default function SalesSeniorExecDashboard() {
  return (
    <DashboardLayout
      pageTitle="Sales Sr. Executive Dashboard"
      stats={[
      { title: "Team Leads", value: "156", icon: Users, trend: "Across team", trendType: "neutral" },
      { title: "Conversions This Month", value: "34", icon: TrendingUp, trend: "+8 MoM", trendType: "up" },
      { title: "Conversion Rate", value: "21.8%", icon: Percent, trend: "+2.3% MoM", trendType: "up" },
      { title: "Lost Leads", value: "12", icon: UserX, trend: "Review reasons", trendType: "down" }
      ]}
    >
      <SectionCard title="Team Performance">
      <DataTable
        columns={[
          { key: "name", header: "Team Member" },
          { key: "leads", header: "Leads" },
          { key: "conversions", header: "Conversions" },
          { key: "rate", header: "Rate" },
        ]}
        data={[
          { name: "Pooja Singh", leads: 38, conversions: 11, rate: "28.9%" },
          { name: "Amit Verma", leads: 35, conversions: 9, rate: "25.7%" },
          { name: "Sneha Rao", leads: 42, conversions: 8, rate: "19.0%" },
          { name: "Kavya Desai", leads: 41, conversions: 6, rate: "14.6%" },
        ]}
        exportable
      />
    </SectionCard>
    </DashboardLayout>
  );
}
