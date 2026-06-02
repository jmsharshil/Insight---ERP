import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Calendar, FileSearch, Receipt, UserPlus, Wallet } from "lucide-react";

export default function AccountantDashboard() {
  return (
    <DashboardLayout
      pageTitle="Accountant Dashboard"
      stats={[
      { title: "Today's Collections", value: "₹45,200", icon: Wallet, trend: "+12% vs avg", trendType: "up" },
      { title: "Pending Verifications", value: "6", icon: FileSearch, trend: "Cash receipts", trendType: "warning" },
      { title: "Pending Refunds", value: "2", icon: Receipt, trend: "To process", trendType: "neutral" },
      { title: "Next Payroll Run", value: "31st", icon: Calendar, trend: "5 days", trendType: "neutral" }
      ]}
    >
      <SectionCard title="Quick Actions" action={<Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary-dark">Run Payroll</Button>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["Approve Payment","Process Refund","Verify Cash Receipt","Generate Invoice"].map(a=>(
          <button key={a} className="rounded-lg border border-border bg-card hover:bg-primary-light hover:border-primary transition-all p-4 text-sm font-medium">{a}</button>
        ))}
      </div>
    </SectionCard>
    </DashboardLayout>
  );
}
