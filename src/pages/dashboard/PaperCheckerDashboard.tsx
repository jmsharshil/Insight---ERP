import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, UserPlus, Wallet } from "lucide-react";

export default function PaperCheckerDashboard() {
  return (
    <DashboardLayout
      pageTitle="Paper Checker Dashboard"
      stats={[
      { title: "Assigned Papers", value: "7", icon: FileText, trend: "This batch", trendType: "neutral" },
      { title: "Submitted", value: "4", icon: CheckCircle2, trend: "On time", trendType: "up" },
      { title: "Pending", value: "3", icon: Clock, trend: "Due in 2 days", trendType: "warning" },
      { title: "Payroll", value: "₹1,400", icon: Wallet, trend: "Pending", trendType: "warning" }
      ]}
    >
      <SectionCard title="Paper Queue">
      <DataTable
        columns={[
          { key: "subject", header: "Subject" },
          { key: "papers", header: "Papers" },
          { key: "deadline", header: "Deadline" },
          { key: "status", header: "Status" },
        ]}
        data={[
          { subject: "Physics — Class 12", papers: 32, deadline: "June 1", status: "In Progress" },
          { subject: "Chemistry — Class 12", papers: 28, deadline: "June 3", status: "Pending" },
          { subject: "Maths — Class 11", papers: 24, deadline: "June 5", status: "Pending" },
        ]}
      />
    </SectionCard>
    </DashboardLayout>
  );
}
