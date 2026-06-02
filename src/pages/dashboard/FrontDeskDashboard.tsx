import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { DoorOpen, Phone, UserPlus, Users } from "lucide-react";

export default function FrontDeskDashboard() {
  return (
    <DashboardLayout
      pageTitle="Front Desk Dashboard"
      stats={[
      { title: "New Inquiries", value: "8", icon: UserPlus, trend: "Today", trendType: "up" },
      { title: "Unassigned Leads", value: "3", icon: Users, trend: "Awaiting", trendType: "neutral" },
      { title: "Walk-ins Today", value: "5", icon: DoorOpen, trend: "+2 vs yesterday", trendType: "up" },
      { title: "Calls Received", value: "11", icon: Phone, trend: "Avg 3min", trendType: "neutral" }
      ]}
    >
      <SectionCard title="Quick Lead Intake" action={<Button className="bg-primary text-primary-foreground hover:bg-primary-dark" size="sm"><UserPlus className="w-4 h-4 mr-1.5"/>New Inquiry</Button>}>
      <p className="text-sm text-muted-foreground">Capture walk-in and phone inquiries here. Forms open in Part 2.</p>
    </SectionCard>
    </DashboardLayout>
  );
}
