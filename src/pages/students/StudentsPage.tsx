import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { studentActions, admissionActions } from "@/redux/actions";
import { setStudents, setStudentsLoading } from "@/redux/slices/studentSlice";
import { setAdmissions, setAdmissionsLoading } from "@/redux/slices/admissionSlice";
import { API } from "@/service/api";
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
  const dispatch = useDispatch<AppDispatch>();
  const [params, setParams] = useSearchParams();

  const activeTab = params.get("tab") || "admissions";
  const [addOpen, setAddOpen] = useState(false);

  const { admissions, count: rawAdmissionsCount, loading: admissionsLoading } = useSelector((state: RootState) => state.admissions);
  const { students, count: rawStudentsCount, loading: studentsLoading } = useSelector((state: RootState) => state.students);

  // Background fetch for students if not active tab and not loaded yet
  useEffect(() => {
    if (user?.role !== "counsellor" && activeTab !== "students" && students.length === 0 && !studentsLoading) {
      const endPoint = user && user.role === "branch_manager" && user.branch
        ? `${API.STUDENTS.LIST}${API.STUDENTS.LIST.includes('?') ? '&' : '?'}branch_id=${user.branch}`
        : API.STUDENTS.LIST;

      dispatch({
        type: studentActions.GET_STUDENTS,
        method: "GET",
        endPoint: endPoint,
        auth: true,
        setLoading: (val: boolean) => dispatch(setStudentsLoading(val)),
        getResponse: (res: any) => {
          if (res?.success && res?.data) {
            dispatch(setStudents({ data: res.data, count: res.count ?? res.data?.length ?? 0 }));
          }
        },
        getError: () => {},
      });
    }
  }, [dispatch, user, activeTab, students.length, studentsLoading]);

  // Background fetch for admissions if not active tab and not loaded yet
  useEffect(() => {
    if (activeTab !== "admissions" && admissions.length === 0 && !admissionsLoading) {
      let url = API.ADMISSIONS.LIST;
      const qParams = new URLSearchParams();
      if (user && user.role === "branch_manager" && user.branch) {
        qParams.append("branch", user.branch);
      }
      const qs = qParams.toString();
      const endPoint = qs ? `${url}?${qs}` : url;

      dispatch({
        type: admissionActions.GET_ADMISSIONS,
        method: "GET",
        endPoint: endPoint,
        auth: true,
        setLoading: (val: boolean) => dispatch(setAdmissionsLoading(val)),
        getResponse: (res: any) => {
          if (res?.success && res?.data) {
            dispatch(setAdmissions({ data: res.data, count: res.count ?? res.data?.length ?? 0 }));
          }
        },
        getError: () => {},
      });
    }
  }, [dispatch, user, activeTab, admissions.length, admissionsLoading]);

  // Total admissions count from paginated API response
  const admissionsCount = useMemo(() => {
    return rawAdmissionsCount || admissions.length;
  }, [rawAdmissionsCount, admissions.length]);

  // Total students count from paginated API response
  const studentsTotalCount = useMemo(() => {
    return rawStudentsCount || students.length;
  }, [rawStudentsCount, students.length]);

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="admissions" className="gap-2">
            <span>Admissions</span>
            <span className="inline-flex items-center justify-center rounded-full bg-muted-foreground/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
              {admissionsLoading && admissions.length === 0 ? "..." : admissionsCount}
            </span>
          </TabsTrigger>
          {user?.role !== "counsellor" && (
            <>
              <TabsTrigger value="students" className="gap-2">
                <span>Students</span>
                <span className="inline-flex items-center justify-center rounded-full bg-muted-foreground/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                  {studentsLoading && students.length === 0 ? "..." : studentsTotalCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="branches">Branch</TabsTrigger>
            </>
          )}
        </TabsList>

        {user?.role !== "counsellor" && (
          <TabsContent value="branches" className="mt-0">
            <BranchesTab />
          </TabsContent>
        )}

        <TabsContent value="admissions" className="mt-0">
          <AdmissionsTab />
        </TabsContent>

        {user?.role !== "counsellor" && (
          <TabsContent value="students" className="mt-0">
            <StudentsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
