import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import ItemsTab from "./tabs/ItemsTab";
import CategoriesTab from "./tabs/CategoriesTab";
import AllocationsTab from "./tabs/AllocationsTab";
import ForecastTab from "./tabs/ForecastTab";

const ALL_TABS = [
  { value: "categories", label: "Categories" },
  { value: "items", label: "Items" },
  { value: "allocations", label: "Allocations" },
  { value: "forecast", label: "Forecast" },
];

const SALES_ROLES = ["sales_senior_executive", "sales_executive", "tele_caller"];
const ADMIN_ROLES = ["super_admin", "branch_manager", "admin_senior_executive", "admin_executive"];

export default function InventoryPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();

  useEffect(() => {
    setPageTitle("Inventory Management");
  }, [setPageTitle]);

  const isSalesOnly = useMemo(() => {
    if (!user) return false;
    const additionalRolesList = Array.isArray(user.additional_roles)
      ? user.additional_roles
      : typeof user.additional_roles === "string"
        ? user.additional_roles.split(",").map((s) => s.trim())
        : [];
    const allUserRoles = [user.role, ...additionalRolesList];
    const hasAdmin = allUserRoles.some((r) => ADMIN_ROLES.includes(r));
    if (hasAdmin) return false;

    return allUserRoles.some((r) => SALES_ROLES.includes(r));
  }, [user]);

  const visibleTabs = useMemo(() => {
    if (isSalesOnly) {
      return ALL_TABS.filter((t) => t.value === "allocations");
    }
    return ALL_TABS;
  }, [isSalesOnly]);

  const [activeTab, setActiveTab] = useState(isSalesOnly ? "allocations" : "categories");

  useEffect(() => {
    if (isSalesOnly) {
      setActiveTab("allocations");
    }
  }, [isSalesOnly]);

  return (
    <div className="space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {!isSalesOnly && visibleTabs.length > 1 && (
          <TabsList className="flex-wrap gap-1 h-auto p-1">
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {!isSalesOnly && (
          <TabsContent value="categories" className="mt-4">
            <CategoriesTab />
          </TabsContent>
        )}

        {!isSalesOnly && (
          <TabsContent value="items" className="mt-4">
            <ItemsTab />
          </TabsContent>
        )}

        <TabsContent value="allocations" className="mt-4">
          <AllocationsTab />
        </TabsContent>

        {!isSalesOnly && (
          <TabsContent value="forecast" className="mt-4">
            <ForecastTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

