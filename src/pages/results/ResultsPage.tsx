import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUI } from "@/hooks/useUI";

import SummaryTab from "./tabs/SummaryTab";
import SubjectWiseTab from "./tabs/SubjectWiseTab";
import FacultyWiseTab from "./tabs/FacultyWiseTab";
import BatchWiseTab from "./tabs/BatchWiseTab";

export default function ResultsPage() {
  const { setPageTitle } = useUI();
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    setPageTitle("Results Analytics");
  }, [setPageTitle]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Results Analytics"
        subtitle="View and analyze organization-wide exam performance."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col flex-1"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-px mb-6">
            <TabsList className="bg-transparent h-auto p-0 border-none justify-start w-auto overflow-x-auto">
              <TabsTrigger
                value="summary"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="subject-wise"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Subject-Wise Results
              </TabsTrigger>
              <TabsTrigger
                value="faculty-wise"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Faculty-Wise Results
              </TabsTrigger>
              <TabsTrigger
                value="batch-wise"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Batch-Wise Results
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="mt-0 outline-none">
            <SummaryTab />
          </TabsContent>
          
          <TabsContent value="subject-wise" className="mt-0 outline-none">
            <SubjectWiseTab />
          </TabsContent>

          <TabsContent value="faculty-wise" className="mt-0 outline-none">
            <FacultyWiseTab />
          </TabsContent>

          <TabsContent value="batch-wise" className="mt-0 outline-none">
            <BatchWiseTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
