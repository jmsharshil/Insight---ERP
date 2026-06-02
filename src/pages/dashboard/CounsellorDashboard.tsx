import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Phone, UserPlus, Users } from "lucide-react";

export default function CounsellorDashboard() {
  return (
    <DashboardLayout
      pageTitle="Counsellor Dashboard"
      stats={[
      { title: "My Leads", value: "23", icon: Users, trend: "+3 this week", trendType: "up" },
      { title: "Contacted Today", value: "5", icon: Phone, trend: "On target", trendType: "up" },
      { title: "Converted This Week", value: "2", icon: CheckCircle2, trend: "+1 vs last week", trendType: "up" },
      { title: "Follow-ups Due", value: "4", icon: Clock, trend: "Within 24h", trendType: "warning" }
      ]}
    >
      <SectionCard title="My Pipeline">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:"New",c:8,col:"bg-blue-100 text-blue-800"},
          {l:"Contacted",c:7,col:"bg-indigo-100 text-indigo-800"},
          {l:"Negotiating",c:5,col:"bg-amber-100 text-amber-800"},
          {l:"Converted",c:3,col:"bg-green-100 text-green-800"}].map(s=>(
          <div key={s.l} className="rounded-lg border border-border p-4">
            <p className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.col}`}>{s.l}</p>
            <p className="mt-3 font-heading font-bold text-2xl">{s.c}</p>
            <p className="text-xs text-muted-foreground mt-0.5">leads</p>
          </div>
        ))}
      </div>
    </SectionCard>
    </DashboardLayout>
  );
}
