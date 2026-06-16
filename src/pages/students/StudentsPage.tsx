import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { COURSE_LIST, BATCH_LIST } from "@/constants/dummy/students";

import AdmissionsTab from "./AdmissionsTab";
import StudentsTab from "./StudentsTab";
import BranchesTab from "./BranchesTab";

export default function StudentsPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const activeTab = params.get("tab") || "admissions";
  const [addOpen, setAddOpen] = useState(false);

  const setActiveTab = (tab: string) => {
    setParams((prev) => {
      prev.set("tab", tab);
      return prev;
    }, { replace: true });
  };

  const canManage = user && !["student", "parent", "parents", "faculty"].includes(user.role);

  useEffect(() => {
    setPageTitle("Students & Admissions");
  }, [setPageTitle]);

  const prefillLeadId = params.get("prefill");
  const prefillLead = null; // Mock prefill logic
  useEffect(() => {
    if (prefillLeadId) setAddOpen(true);
  }, [prefillLeadId]);

  return (
    <div>
      {/* <PageHeader
        title="Student Management"
        subtitle="View, manage and onboard students."
        // actions={
        //   canManage ? (
        //     <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary-dark text-primary-foreground">
        //       <Plus className="w-4 h-4" /> Add Student
        //     </Button>
        //   ) : undefined
        // }
      /> */}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="admissions">Admissions</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="branches">Branch</TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="mt-0">
          <BranchesTab />
        </TabsContent>

        <TabsContent value="admissions" className="mt-0">
          <AdmissionsTab />
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <StudentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
