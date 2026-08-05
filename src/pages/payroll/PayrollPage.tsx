import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, Wallet, Clock, Settings, FileText, View } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState(defaultTab);

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
    setActiveTab("payslips");
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
            ? "Manage payroll runs, payslips, late policies, and extra hours."
            : "View your personal payslips and track your salary history."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <TabsTrigger value="extra-hours" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all">
                  <Clock className="w-4 h-4" /> Extra Hours
                </TabsTrigger>
              </>
            )}

            {/* Policy Tab - purely admin/manager */}
            {isAdmin && (
              <TabsTrigger value="policy" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition-all">
                <Settings className="w-4 h-4" /> Late Policy
              </TabsTrigger>
            )}

          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="mt-2 outline-none">
          {/* Employee Tabs */}
          <TabsContent value="my-payroll" className="outline-none border-none p-0 m-0"><MyPayrollTab /></TabsContent>
          {canPreviewSalary && <TabsContent value="preview" className="outline-none border-none p-0 m-0"><SalaryPreviewTab /></TabsContent>}

          {/* Admin Tabs */}
          {(isAdmin || isAccount) && (
            <>
              <TabsContent value="runs" className="outline-none border-none p-0 m-0">
                <PayrollRunsTab branches={branches} onViewPayslips={handleViewPayslips} />
              </TabsContent>
              <TabsContent value="payslips" className="outline-none border-none p-0 m-0">
                <PayslipsTab />
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