import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, Wallet, Clock, Settings, FileText, View, Gauge } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { RootState, AppDispatch } from "@/store";
import { dropdownActions } from "@/redux/actions";

import PayrollRunsTab from "./tabs/PayrollRunsTab";
import PayslipsTab from "./tabs/PayslipsTab";
import LatePolicyTab from "./tabs/LatePolicyTab";
import ExtraHoursTab from "./tabs/ExtraHoursTab";
import MyPayrollTab from "./tabs/MyPayrollTab";
import SalaryPreviewTab from "./tabs/SalaryPreviewTab";
import ReimbursementsTab from "./tabs/ReimbursementsTab";
import OdometerReadingsTab from "./tabs/OdometerReadingsTab";
import { setSelectedRun } from "@/redux/slices/payrollSlice";

export default function PayrollPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.role ?? "";
  const [branches, setBranches] = useState<any[]>([]);

  const isAdmin    = ["super_admin", "branch_manager"].includes(role);
  const isAccount  = ["accountant"].includes(role);
  const isFaculty  = ["faculty"].includes(role);
  const canPreviewSalary = ["faculty", "exam_supervisor"].includes(role);
  
  // Decide default tab based on role
  const defaultTab = (isAdmin || isAccount) ? "runs" : "my-payroll";
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const activeTab = urlTab || defaultTab;

  const handleTabChange = (val: string) => {
    // When switching primary tabs, reset parameters to avoid cross-tab filter contamination
    setSearchParams({ tab: val });
  };

  const isUUID = (val: any): boolean => {
    if (!val || typeof val !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  };

  const extractUserUUID = (note?: any, row?: any): string | null => {
    const candidates = [
      note?.user_id,
      note?.user,
      row?.user_id,
      row?.faculty_id,
      row?.faculty,
      row?.employee?.id,
      row?.user?.id,
      row?.employee_id,
      row?.user,
    ];

    for (const c of candidates) {
      if (isUUID(c)) {
        return String(c).trim();
      }
    }
    return null;
  };

  const handleNavigateToOdometer = (note?: any, row?: any) => {
    const next = new URLSearchParams();
    next.set("tab", "odometer");
    const userUuid = extractUserUUID(note, row);
    if (userUuid) {
      next.set("user_id", userUuid);
    } else {
      const userName = row?.faculty_name || (typeof row?.user === "string" ? row.user : "") || row?.name;
      if (userName) {
        next.set("user_id", userName);
      }
    }
    if (note?.date) {
      next.set("from_date", note.date);
      next.set("to_date", note.date);
    }
    setSearchParams(next);
  };

  useEffect(() => {
    if (isAdmin || isAccount) {
      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "GET",
        endPoint: "/api/v1/branches/",
        auth: true,
        getResponse: (res: any) => {
          const data = res?.data?.results || res?.data || res?.results || res;
          if (Array.isArray(data)) setBranches(data);
        },
        getError: () => {
          toast.error("Failed to load branches");
        },
      } as any);
    }
  }, [isAdmin, isAccount, dispatch, toast]);

  const handleViewPayslips = (run: any) => {
    dispatch(setSelectedRun(run));
    setSearchParams({ tab: "payslips" });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          Payroll & Salaries
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin || isAccount
            ? "Manage payroll runs, payslips, late policies, extra hours, and travel odometer claims."
            : "View your personal payslips, travel odometer claims, and track your salary history."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} activationMode="manual" className="w-full">
        {/* Dynamic Tab List based on role */}
        <div className="bg-white rounded-lg border border-border p-1 mb-5 inline-flex w-full md:w-auto overflow-x-auto">
          <TabsList className="bg-transparent gap-1 w-full justify-start md:w-auto">
            {/* Employee self-service tabs */}
            {user?.role !== "super_admin" && (
              <TabsTrigger
                value="my-payroll"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all"
              >
                <Wallet className="w-4 h-4" /> My Payroll
              </TabsTrigger>
            )}

            {/* Admin / Management tabs */}
            {(isAdmin || isAccount) && (
              <>
                <TabsTrigger value="runs" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all">
                  <Calculator className="w-4 h-4" /> Payroll Runs
                </TabsTrigger>
                <TabsTrigger value="payslips" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all">
                  <FileText className="w-4 h-4" /> Payslips
                </TabsTrigger>
                {/* <TabsTrigger value="extra-hours" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all">
                  <Clock className="w-4 h-4" /> Extra Hours
                </TabsTrigger> */}
              </>
            )}

            {/* Policy Tab - purely admin/manager */}
            {isAdmin && (
              <TabsTrigger value="policy" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all">
                <Settings className="w-4 h-4" /> Late Policy
              </TabsTrigger>
            )}

            {/* Common Tabs (Admins & Employees) */}
            <TabsTrigger
              value="odometer"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all"
            >
              <Gauge className="w-4 h-4" /> Odometer Readings
            </TabsTrigger>

            <TabsTrigger
              value="reimbursements"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-4 h-4" /> Reimbursements
            </TabsTrigger>

            {canPreviewSalary && (
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all"
              >
                <View className="w-4 h-4" /> Salary Preview
              </TabsTrigger>
            )}

          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="mt-2 outline-none">
          {/* Employee & Common Tabs */}
          <TabsContent value="my-payroll" className="outline-none border-none p-0 m-0"><MyPayrollTab onNavigateToOdometer={handleNavigateToOdometer} /></TabsContent>
          <TabsContent value="odometer" className="outline-none border-none p-0 m-0"><OdometerReadingsTab /></TabsContent>
          <TabsContent value="reimbursements" className="outline-none border-none p-0 m-0"><ReimbursementsTab /></TabsContent>
          {canPreviewSalary && <TabsContent value="preview" className="outline-none border-none p-0 m-0"><SalaryPreviewTab /></TabsContent>}

          {/* Admin Tabs */}
          {(isAdmin || isAccount) && (
            <>
              <TabsContent value="runs" className="outline-none border-none p-0 m-0">
                <PayrollRunsTab branches={branches} onViewPayslips={handleViewPayslips} />
              </TabsContent>
              <TabsContent value="payslips" className="outline-none border-none p-0 m-0">
                <PayslipsTab onNavigateToOdometer={handleNavigateToOdometer} />
              </TabsContent>
              <TabsContent value="extra-hours" className="outline-none border-none p-0 m-0">
                <ExtraHoursTab />
              </TabsContent>
            </>
          )}

          {isAdmin && (
            <TabsContent value="policy" className="outline-none border-none p-0 m-0">
              <LatePolicyTab branches={branches} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
