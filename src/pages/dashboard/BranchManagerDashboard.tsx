import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Clock, Percent, UserPlus, Users, Wallet } from "lucide-react";

export default function BranchManagerDashboard() {
  return (
    <DashboardLayout
      pageTitle="Branch Manager Dashboard"
      stats={[
      { title: "Branch Students", value: "847", icon: Users, trend: "+12 this week", trendType: "up" },
      { title: "Attendance Today", value: "91%", icon: Percent, trend: "+2% vs yesterday", trendType: "up" },
      { title: "Pending Approvals", value: "7", icon: Clock, trend: "3 leave, 4 cash", trendType: "neutral" },
      { title: "Dues Outstanding", value: "₹2.1L", icon: Wallet, trend: "-₹35k this week", trendType: "down" }
      ]}
    >
      <SectionCard title="Pending Approvals">
      <DataTable
        columns={[
          { key: "type", header: "Type" },
          { key: "requester", header: "Requested By" },
          { key: "details", header: "Details" },
          { key: "date", header: "Date" },
          { key: "amount", header: "Amount" },
        ]}
        data={[
          { type: "Leave", requester: "Dr. Meera Nair", details: "Casual leave", date: "May 30", amount: "—" },
          { type: "Cash Fee", requester: "Kavya Desai", details: "Receipt #4528", date: "May 30", amount: "₹12,500" },
          { type: "Leave", requester: "Rahul Patel", details: "Sick leave", date: "May 29", amount: "—" },
          { type: "Cash Fee", requester: "Kavya Desai", details: "Receipt #4527", date: "May 29", amount: "₹8,000" },
        ]}
      />
    </SectionCard>
    </DashboardLayout>
  );
}
