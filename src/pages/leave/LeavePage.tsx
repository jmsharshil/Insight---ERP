import { useEffect } from "react";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";

import ApplicationsTab from "./tabs/ApplicationsTab";
import PoliciesTab     from "./tabs/PoliciesTab";
import HolidaysTab     from "./tabs/HolidaysTab";
import BalancesTab     from "./tabs/BalancesTab";
import LateEntriesTab  from "./tabs/LateEntriesTab";

// ── Role-based tab config ────────────────────────────────────────────────────
const TAB_CONFIG = [
  {
    value: "applications",
    label: "Applications",
    roles: ["super_admin", "branch_manager", "admin_senior_executive", "faculty", "front_desk", "counsellor"],
  },
  {
    value: "policies",
    label: "Policies",
    roles: ["super_admin", "branch_manager"],
  },
  {
    value: "holidays",
    label: "Public Holidays",
    roles: ["super_admin", "branch_manager"],
  },
  {
    value: "balances",
    label: "Leave Balance",
    roles: ["super_admin", "branch_manager", "admin_senior_executive", "faculty", "front_desk", "counsellor"],
  },
  {
    value: "late_entries",
    label: "Late Entries",
    roles: ["super_admin", "branch_manager", "admin_senior_executive", "faculty", "front_desk", "counsellor"],
  },
];

const getVisibleTabs = (role: string) =>
  TAB_CONFIG.filter(t => t.roles.includes(role));

export default function LeavePage() {
  const { setPageTitle } = useUI();
  const { user }         = useAuth();

  const role        = user?.role ?? "faculty";
  const visibleTabs = getVisibleTabs(role);
  const defaultTab  = visibleTabs[0]?.value ?? "applications";

  useEffect(() => {
    setPageTitle("Leave Management");
  }, [setPageTitle]);

  return (
    <div className="space-y-5">
      {/* <PageHeader title="Leave Management" subtitle="Manage leave applications, policies, holidays, and attendance." /> */}

      <Tabs defaultValue={defaultTab}>
        <TabsList className=" flex-wrap gap-1 h-auto p-1">
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Applications */}
        <TabsContent value="applications" className="mt-4">
          <ApplicationsTab />
        </TabsContent>

        {/* Policies — super_admin / branch_manager only */}
        <TabsContent value="policies" className="mt-4">
          <PoliciesTab />
        </TabsContent>

        {/* Holidays — super_admin / branch_manager only */}
        <TabsContent value="holidays" className="mt-4">
          <HolidaysTab />
        </TabsContent>

        {/* Balances */}
        <TabsContent value="balances" className="mt-4">
          <BalancesTab />
        </TabsContent>

        {/* Late Entries */}
        <TabsContent value="late_entries" className="mt-4">
          <LateEntriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
