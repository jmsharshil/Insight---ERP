import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Building2, UserPlus, Users, Wallet } from "lucide-react";

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout
      pageTitle="Super Admin Dashboard"
      stats={[
      { title: "Total Students", value: "2,418", icon: Users, trend: "+8.4% vs last month", trendType: "up" },
      { title: "Total Branches", value: "3", icon: Building2, trend: "All operational", trendType: "neutral" },
      { title: "Monthly Revenue", value: "₹18.4L", icon: Wallet, trend: "+12% MoM", trendType: "up" },
      { title: "Active Leads", value: "156", icon: UserPlus, trend: "+24 this week", trendType: "up" }
      ]}
    >
      <SectionCard title="Branch Performance" description="Overview of all branches">
      <DataTable
        columns={[
          { key: "branch", header: "Branch" },
          { key: "students", header: "Students" },
          { key: "attendance", header: "Attendance %" },
          { key: "revenue", header: "Revenue" },
          { key: "status", header: "Status", render: (r) => <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">{r.status}</span> },
        ]}
        data={[
          { branch: "Surat Main", students: 847, attendance: "91%", revenue: "₹7.2L", status: "Active" },
          { branch: "Vadodara", students: 712, attendance: "88%", revenue: "₹6.1L", status: "Active" },
          { branch: "Ahmedabad", students: 859, attendance: "93%", revenue: "₹5.1L", status: "Active" },
        ]}
        searchable={false}
      />
    </SectionCard>
    </DashboardLayout>
  );
}
