import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { batchAction, dropdownActions } from "@/redux/actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import DashboardTab from "./tabs/DashboardTab";
import StudentsAttendanceTab from "./tabs/StudentsTab";
import HistoryTab from "./tabs/HistoryTab";
import FacultyTab from "./tabs/FacultyTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import DefaultersTab from "./tabs/DefaultersTab";
import ViolationsTab from "./tabs/ViolationsTab";
import RegisterTab from "./tabs/RegisterTab";
import EmployeeRegisterTab from "./tabs/EmployeeRegisterTab";
import EmployeePersonalHistoryTab from "./tabs/EmployeePersonalHistoryTab";
import StudentPersonalHistoryTab from "./tabs/StudentPersonalHistoryTab";

export default function AttendancePage() {
  const dispatch = useDispatch();
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  
  const [scanLoading, setScanLoading] = useState<"check_in" | "check_out" | null>(null);
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

  //   // 2. Fetch students for dropdowns
  //   dispatch({
  //     type: dropdownActions.GET_DROPDOWN,
  //     method: "GET",
  //     endPoint: `/api/v1/students/${branchQuery}`,
  //     auth: true,
  //     getResponse: (res: any) => {
  //       const list = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
  //       if (Array.isArray(list)) {
  //         setDropdowns(prev => ({
  //           ...prev,
  //           students: list.map((item: any) => ({
  //             id: item.id,
  //             name: item.full_name || item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim(),
  //             branch_id: item.branch || item.branch_id,
  //           })),
  //         }));
  //       }
  //     },
  //   });

  //   // 3. Fetch faculty for dropdowns
  //   dispatch({
  //     type: dropdownActions.GET_DROPDOWN,
  //     method: "GET",
  //     endPoint: `/api/v1/faculty/${branchQuery}`,
  //     auth: true,
  //     getResponse: (res: any) => {
  //       const list = res?.data || res;
  //       if (Array.isArray(list)) {
  //         setDropdowns(prev => ({
  //           ...prev,
  //           faculty: list.map((item: any) => ({
  //             id: item.id,
  //             user_id: item.user || item.user_id,
  //             name: item.full_name || item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim(),
  //             branch_id: item.branch || item.branch_id,
  //           })),
  //         }));
  //       }
  //     },
  //   });
  }, [dispatch, user]);

  const isParentOrStudent = user?.role === "parents" || user?.role === "student";
  const isFaculty = user?.role === "faculty";
  const isExamSupervisor = user?.role === "exam_supervisor" || user?.role === "paper_checker";
  const isSecurityOrHouseKeeping = user?.role === "security" || user?.role === "house_keeping";
  const isRestrictedRole = user && [
    "accountant",
    "exam_supervisor",
    "tele_caller",
    "sales_executive",
    "sales_senior_executive",
    "counsellor",
    "front_desk"
  ].includes(user.role);
  const showViolations = user?.role === "super_admin" || user?.role === "branch_manager" || user?.role === "admin_senior_executive" || user?.role === "admin_executive";

  const hideMainTabs = isFaculty || isExamSupervisor || isSecurityOrHouseKeeping || isRestrictedRole;

  const isEmployee = user && !isParentOrStudent;
  const isAdmin = user && ["super_admin", "admin", "branch_manager"].includes(user.role);
  const isEmployeeHistoryRole = user && !["super_admin", "student", "parents", "paper_checker"].includes(user.role);
  const defaultTab = isParentOrStudent ? "students" : hideMainTabs ? "my_history" : "dashboard";

  const handleScan = (type: "check_in" | "check_out") => {
    setScanLoading(type);
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "POST",
      endPoint: "/api/v1/attendance/employee/scan/",
      body: { scan_type: type },
      auth: true,
      getResponse: (res: any) => {
        toast.success(res?.message || (type === "check_in" ? "Check In recorded." : "Check Out recorded."));
        setScanLoading(null);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to record ${type.replace("_", " ")}`);
        setScanLoading(null);
      },
    } as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Track and manage student & faculty attendance.</p>
        </div>
        {/* {isEmployee && (
          <div className="flex gap-2">
            <Button 
              onClick={() => handleScan("check_in")} 
              disabled={scanLoading !== null}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {scanLoading === "check_in" ? "Checking In..." : "Check In"}
            </Button>
            <Button 
              onClick={() => handleScan("check_out")} 
              dis abled={scanLoading !== null}
              variant="destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {scanLoading === "check_out" ? "Checking Out..." : "Check Out"}
            </Button>
          </div>
        )} */}
      </div>

      <Tabs defaultValue={defaultTab} className="mt-2">
        <TabsList className="">
          {!isParentOrStudent && !hideMainTabs && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
          {isEmployeeHistoryRole && <TabsTrigger value="my_history">My Attendance</TabsTrigger>}
          {!hideMainTabs && <TabsTrigger value="students">Students</TabsTrigger>}
          {/* {!isParentOrStudent && !hideMainTabs && <TabsTrigger value="register">Student Register</TabsTrigger>} */}
          {/* {isAdmin && <TabsTrigger value="staff_register">Staff Register</TabsTrigger>} */}
          {/* {!hideMainTabs && <TabsTrigger value="history">History</TabsTrigger>} */}
          {!isParentOrStudent && !hideMainTabs && <TabsTrigger value="faculty">Staff</TabsTrigger>}
          {!isParentOrStudent && !hideMainTabs && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          {/* {!isParentOrStudent && !hideMainTabs && <TabsTrigger value="defaulters">Defaulters</TabsTrigger>} */}
          {showViolations && <TabsTrigger value="violations">Violations</TabsTrigger>}
        </TabsList>

        {!isParentOrStudent && !hideMainTabs && (
          <TabsContent value="dashboard" className="mt-4">
            <DashboardTab dropdowns={dropdowns} />
          </TabsContent>
        )}

        {!hideMainTabs && (
          <TabsContent value="students" className="mt-4">
            <StudentsAttendanceTab dropdowns={dropdowns} />
          </TabsContent>
        )}

        {!isParentOrStudent && !hideMainTabs && (
          <TabsContent value="register" className="mt-4">
            <RegisterTab dropdowns={dropdowns} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="staff_register" className="mt-4">
            <EmployeeRegisterTab dropdowns={dropdowns} />
          </TabsContent>
        )}

        {isEmployeeHistoryRole && (
          <TabsContent value="my_history" className="mt-4">
            <EmployeePersonalHistoryTab />
          </TabsContent>
        )}

        {/* {!hideMainTabs && (
          <TabsContent value="history" className="mt-4">
            {isParentOrStudent ? (
              <StudentPersonalHistoryTab dropdowns={dropdowns} />
            ) : (
              <HistoryTab dropdowns={dropdowns} />
            )}
          </TabsContent>
        )} */}

        {!isParentOrStudent && !hideMainTabs && (
          <TabsContent value="faculty" className="mt-4">
            <FacultyTab dropdowns={dropdowns} />
          </TabsContent>
        )}

        {!isParentOrStudent && !hideMainTabs && (
          <TabsContent value="analytics" className="mt-4">
            <AnalyticsTab dropdowns={dropdowns} />
          </TabsContent>
        )}

        {!isParentOrStudent && !hideMainTabs && (
          <TabsContent value="defaulters" className="mt-4">
            <DefaultersTab dropdowns={dropdowns} />
          </TabsContent>
        )}

        <TabsContent value="violations" className="mt-4">
          <ViolationsTab dropdowns={dropdowns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
