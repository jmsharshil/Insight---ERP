import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { dropdownActions, subjectAction, batchAction, ClassroomAction } from "@/redux/actions";
import { API } from "@/service/api";
import type { AppDispatch } from "@/store";

// ── Tab Components ────────────────────────────────────────────────────────────
import SlotsTab           from "./tabs/SlotsTab";
import ExamTypesTab       from "./tabs/ExamTypesTab";
import PersonalTimetableTab from "./tabs/PersonalTimetableTab";

// ── Static Choice Maps ────────────────────────────────────────────────────────
const TABS = [
  { value: "grid",       label: "Weekly Grid"     },
  { value: "slots",      label: "All Slots"       },
  { value: "exam_types", label: "Exam Types"      },
  { value: "personal",   label: "Personal View"   },
] as const;

const DAY_TO_NUM: Record<string, string> = {
  Monday: "0", Tuesday: "1", Wednesday: "2",
  Thursday: "3", Friday: "4", Saturday: "5", Sunday: "6",
};

type TabValue = typeof TABS[number]["value"];

export default function TimetablePage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabValue>("grid");

  // ── Shared dropdown data (loaded once, passed as props) ───────────────────
  const [dropdowns, setDropdowns] = useState<any>({
    branches: [],
    batches: [],
    subjects: [],
    courses: [],
    faculty: [],
  });
  const [classrooms,  setClassrooms]  = useState<{ id: string; name: string }[]>([]);
  const [chapters,    setChapters]    = useState<{ id: string; name: string; order: number; subject?: string }[]>([]);

  const [examinersList, setExaminersList] = useState<{ id: string; name: string; employee_id?: string }[]>([]);
  const [paperCheckersList, setPaperCheckersList] = useState<{ id: string; name: string; employee_id?: string }[]>([]);

  useEffect(() => {
    setPageTitle("Timetable");
  }, [setPageTitle]);

  // ── Fetch all dropdown data on mount (attendance pattern) ─────────────────
  useEffect(() => {
    const batchesEndpoint = user && user.role === "branch_manager" && user.branch
      ? `/api/v1/batches/dropdowns/?branch_id=${user.branch}`
      : "/api/v1/batches/dropdowns/";

    // 1. Fetch common dropdowns (batches, subjects, courses) in one call
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: batchesEndpoint,
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        if (data) {
          setDropdowns((prev: any) => ({
            ...prev,
            ...data,
          }));

          if (data.classrooms) {
            setClassrooms(data.classrooms);
          }

          if (data.subjects) {
            const flatChapters: any[] = [];
            data.subjects.forEach((subj: any) => {
              if (subj.chapters && Array.isArray(subj.chapters)) {
                subj.chapters.forEach((ch: any) => {
                  flatChapters.push({
                    id: ch.id,
                    name: ch.name,
                    order: ch.order,
                    subject: subj.id,
                  });
                });
              }
            });
            setChapters(flatChapters);
          }
        }
      },
      getError: () => {},
    });

    const facultyEndpoint = user && user.role === "branch_manager" && user.branch
      ? `/api/v1/faculty/?branch_id=${user.branch}`
      : "/api/v1/faculty/";

    // 2. Fetch faculty
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: facultyEndpoint,
      auth: true,
      getResponse: (res: any) => {
        const list = res?.data || res;
        if (Array.isArray(list)) {
          setDropdowns((prev: any) => ({
            ...prev,
            faculty: list.map((item: any) => ({
              id: item.id,
              name: item.full_name || item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim(),
              employee_id: item.employee_id,
              user_id: item.user || item.user_id,
            })),
          }));
        }
      },
      getError: () => {},
    });



    // 4. Exam Staff (Examiners & Paper Checkers)
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/auth/users/?role=exam_supervisor&role=paper_checker",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data || res;
        if (Array.isArray(data)) {
          const parsed = data.map((item: any) => ({
            id: item.id,
            name: item.full_name || item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim(),
            employee_id: item.employee_id,
            role: item.role,
            roles: item.roles,
          }));

          // Try to segregate by role if the backend returns it, otherwise populate both with the combined data
          const supervisors = parsed.filter(u => u.role === "exam_supervisor" || (Array.isArray(u.roles) && u.roles.includes("exam_supervisor")));
          const checkers = parsed.filter(u => u.role === "paper_checker" || (Array.isArray(u.roles) && u.roles.includes("paper_checker")));

          if (supervisors.length > 0 || checkers.length > 0) {
            setExaminersList(supervisors);
            setPaperCheckersList(checkers);
          } else {
            setExaminersList(parsed);
            setPaperCheckersList(parsed);
          }
        }
      },
      getError: () => {},
    });
  }, [dispatch]);

  // ── Derive flat arrays for child components ───────────────────────────────
  const batches = Array.isArray(dropdowns.batches) ? dropdowns.batches : [];

  const subjects = Array.isArray(dropdowns.subjects) ? dropdowns.subjects : [];
  const facultyList = Array.isArray(dropdowns.faculty) ? dropdowns.faculty : [];

  return (
    <div>
    

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
          <TabsList className="mb-5">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="grid" className="mt-0">
            <SlotsTab
               batches={batches}
               subjects={subjects}
               facultyList={facultyList}
               classrooms={classrooms}
               chapters={chapters}
               examinersList={examinersList}
               paperCheckersList={paperCheckersList}
               defaultView="grid"
            />
          </TabsContent>

          <TabsContent value="slots" className="mt-0">
            <SlotsTab
              batches={batches}
              subjects={subjects}
              facultyList={facultyList}
              classrooms={classrooms}
              chapters={chapters}
              examinersList={examinersList}
              paperCheckersList={paperCheckersList}
              defaultView="list"
            />
          </TabsContent>


          <TabsContent value="personal" className="mt-0">
            <PersonalTimetableTab facultyList={facultyList} />
          </TabsContent>
          <TabsContent value="exam_types" className="mt-0">
            <ExamTypesTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
