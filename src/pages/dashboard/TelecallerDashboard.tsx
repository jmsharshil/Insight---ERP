import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Phone, PhoneCall, UserPlus } from "lucide-react";

export default function TelecallerDashboard() {
  return (
    <DashboardLayout
      pageTitle="Telecaller Dashboard"
      stats={[
      { title: "Assigned Leads", value: "18", icon: Phone, trend: "Active", trendType: "neutral" },
      { title: "Calls Made Today", value: "12", icon: PhoneCall, trend: "+4 vs avg", trendType: "up" },
      { title: "Pending Follow-ups", value: "6", icon: Clock, trend: "Today", trendType: "warning" },
      { title: "Connected Rate", value: "68%", icon: CheckCircle2, trend: "+5% MoM", trendType: "up" }
      ]}
    >
      <SectionCard title="Today's Call Queue">
      <DataTable
        columns={[
          { key: "name", header: "Lead Name" },
          { key: "phone", header: "Phone" },
          { key: "course", header: "Interested In" },
          { key: "status", header: "Status" },
          { key: "lastCall", header: "Last Call" },
        ]}
        data={[
          { name: "Rohan Mehta", phone: "+91 98... 432", course: "JEE Foundation", status: "Pending", lastCall: "—" },
          { name: "Anjali Patel", phone: "+91 98... 911", course: "NEET", status: "Follow-up", lastCall: "May 28" },
          { name: "Karan Singh", phone: "+91 98... 110", course: "CA", status: "Pending", lastCall: "—" },
          { name: "Diya Shah", phone: "+91 98... 552", course: "JEE Advanced", status: "Follow-up", lastCall: "May 27" },
        ]}
      />
    </SectionCard>
    </DashboardLayout>
  );
}
