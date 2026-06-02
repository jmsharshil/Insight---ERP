import DashboardLayout from "@/components/common/DashboardLayout";
import SectionCard from "@/components/common/SectionCard";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, QrCode, ScanLine, UserPlus } from "lucide-react";

export default function AdminExecDashboard() {
  return (
    <DashboardLayout
      pageTitle="Admin Executive Dashboard"
      stats={[
      { title: "Attendance Entries", value: "124", icon: ScanLine, trend: "Today", trendType: "up" },
      { title: "QR Scans Today", value: "98", icon: QrCode, trend: "+15 vs yesterday", trendType: "up" },
      { title: "Pending Entries", value: "6", icon: ClipboardList, trend: "To process", trendType: "neutral" },
      { title: "Avg. Entry Time", value: "42s", icon: Clock, trend: "Faster than avg", trendType: "up" }
      ]}
    >
      <SectionCard title="Today's Tasks">
      <ul className="divide-y divide-border">
        {[{t:"Mark attendance for Class 12-A",d:"Pending",s:"warning"},
          {t:"Update timetable for next week",d:"In progress",s:"info"},
          {t:"Verify 6 student records",d:"Pending",s:"warning"},
          {t:"Submit daily attendance report",d:"Done",s:"success"}].map((it,i)=>(
          <li key={i} className="flex items-center justify-between py-3">
            <span className="text-sm">{it.t}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${it.s}/10 text-${it.s}`}>{it.d}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
    </DashboardLayout>
  );
}
