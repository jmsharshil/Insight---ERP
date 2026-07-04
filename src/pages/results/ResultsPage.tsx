import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";
import { downloadExcel } from "@/lib/exportUtils";
import { API } from "@/service/api";

import SummaryTab from "./tabs/SummaryTab";
import SubjectWiseTab from "./tabs/SubjectWiseTab";
import FacultyWiseTab from "./tabs/FacultyWiseTab";
import BatchWiseTab from "./tabs/BatchWiseTab";

export default function ResultsPage() {
  const { setPageTitle } = useUI();
  const [activeTab, setActiveTab] = useState("summary");
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setPageTitle("Results Analytics");
  }, [setPageTitle]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let type = activeTab;
      if (activeTab === "summary") type = "analytics";
      
      await downloadExcel(API.RESULTS_ANALYTICS.EXPORT, { type }, `results_${type}.xlsx`);
      toast.success("Export completed successfully");
    } catch (err) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (Branch	Students	Attendance %	Revenue	Status
    Surat Main	847	91%	₹7.2L	Active
    Vadodara	712	88%	₹6.1L	Active
    Ahmedabad	859	93%	₹5.1L	Active
    
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Results Analytics"
        subtitle="View and analyze organization-wide exam performance."
        actions={
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Excel
          </Button>
        }
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
