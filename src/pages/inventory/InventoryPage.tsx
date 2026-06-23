import { useEffect } from "react";
import { useUI } from "@/hooks/useUI";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import ItemsTab       from "./tabs/ItemsTab";
import CategoriesTab  from "./tabs/CategoriesTab";
import AllocationsTab from "./tabs/AllocationsTab";
import ForecastTab    from "./tabs/ForecastTab";

const TABS = [
  { value: "items",       label: "Items" },
  { value: "allocations", label: "Allocations" },
  { value: "categories",  label: "Categories" },
  { value: "forecast",    label: "Forecast" },
];

export default function InventoryPage() {
  const { setPageTitle } = useUI();

  useEffect(() => {
    setPageTitle("Inventory Management");
  }, [setPageTitle]);

  return (
    <div className="space-y-5">
      <Tabs defaultValue="items">
        <TabsList className="flex-wrap gap-1 h-auto p-1">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <ItemsTab />
        </TabsContent>

        <TabsContent value="allocations" className="mt-4">
          <AllocationsTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="forecast" className="mt-4">
          <ForecastTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
