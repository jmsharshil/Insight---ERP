import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { useUI } from "@/hooks/useUI";
import DashboardTab from "./tabs/DashboardTab";
import StudentsAttendanceTab from "./tabs/StudentsTab";
import HistoryTab from "./tabs/HistoryTab";
import FacultyTab from "./tabs/FacultyTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import DefaultersTab from "./tabs/DefaultersTab";
import ViolationsTab from "./tabs/ViolationsTab";

export default function AttendancePage() {
  // const navigate = useNavigate();
  const { setPageTitle } = useUI();
  useEffect(() => { setPageTitle("Attendance"); }, [setPageTitle]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Track and manage student & faculty attendance."
      />

      <Tabs defaultValue="dashboard" className="mt-2">
        <TabsList className="">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab />
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <StudentsAttendanceTab />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>

        <TabsContent value="faculty" className="mt-4">
          <FacultyTab />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="defaulters" className="mt-4">
          <DefaultersTab />
        </TabsContent>

        <TabsContent value="violations" className="mt-4">
          <ViolationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
