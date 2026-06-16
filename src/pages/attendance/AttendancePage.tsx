import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { batchAction, dropdownActions } from "@/redux/actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import DashboardTab from "./tabs/DashboardTab";
import StudentsAttendanceTab from "./tabs/StudentsTab";
import HistoryTab from "./tabs/HistoryTab";
import FacultyTab from "./tabs/FacultyTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import DefaultersTab from "./tabs/DefaultersTab";
import ViolationsTab from "./tabs/ViolationsTab";
import RegisterTab from "./tabs/RegisterTab";

export default function AttendancePage() {
  const dispatch = useDispatch();
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const [dropdowns, setDropdowns] = useState<any>({
    branches: [],
    batches: [],
    subjects: [],
    courses: [],
    students: [],
    faculty: [],
  });

  useEffect(() => {
    setPageTitle("Attendance");
  }, [setPageTitle]);

  useEffect(() => {
    const isBranchManager = user && user.role === "branch_manager" && user.branch;
    const branchQuery = isBranchManager ? `?branch_id=${user.branch}` : "";

    // 1. Fetch common dropdowns
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: `/api/v1/batches/dropdowns/${branchQuery}`,
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        if (data) {
          setDropdowns(prev => ({
            ...prev,
            ...data,
          }));
        }
      },
    });

    // 2. Fetch students for dropdowns
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: `/api/v1/students/${branchQuery}`,
      auth: true,
      getResponse: (res: any) => {
        const list = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(list)) {
          setDropdowns(prev => ({
            ...prev,
            students: list.map((item: any) => ({
              id: item.id,
              name: item.full_name || item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim(),
              branch_id: item.branch || item.branch_id,
            })),
          }));
        }
      },
    });

    // 3. Fetch faculty for dropdowns
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: `/api/v1/faculty/${branchQuery}`,
      auth: true,
      getResponse: (res: any) => {
        const list = res?.data || res;
        if (Array.isArray(list)) {
          setDropdowns(prev => ({
            ...prev,
            faculty: list.map((item: any) => ({
              id: item.id,
              name: item.full_name || item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim(),
              branch_id: item.branch || item.branch_id,
            })),
          }));
        }
      },
    });
  }, [dispatch, user]);

  return (
    <div>
      {/* <PageHeader
        title="Attendance"
        subtitle="Track and manage student & faculty attendance."
      /> */}

      <Tabs defaultValue="dashboard" className="mt-2">
        <TabsList className="">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab dropdowns={dropdowns} />
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <StudentsAttendanceTab dropdowns={dropdowns} />
        </TabsContent>

        <TabsContent value="register" className="mt-4">
          <RegisterTab dropdowns={dropdowns} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab dropdowns={dropdowns} />
        </TabsContent>

        <TabsContent value="faculty" className="mt-4">
          <FacultyTab dropdowns={dropdowns} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab dropdowns={dropdowns} />
        </TabsContent>

        <TabsContent value="defaulters" className="mt-4">
          <DefaultersTab dropdowns={dropdowns} />
        </TabsContent>

        <TabsContent value="violations" className="mt-4">
          <ViolationsTab dropdowns={dropdowns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
