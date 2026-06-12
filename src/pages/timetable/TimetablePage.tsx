import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";
import { dropdownActions, subjectAction, batchAction, ClassroomAction } from "@/redux/actions";
import { API } from "@/service/api";
import type { AppDispatch } from "@/store";

// ── Tab Components ────────────────────────────────────────────────────────────
import TimetableGridView  from "./components/TimetableGridView";
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
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabValue>("slots");

  // ── Shared dropdown data (loaded once, passed as props) ───────────────────
  const [batches,     setBatches]     = useState<{ id: string; name: string }[]>([]);
  const [subjects,    setSubjects]    = useState<{ id: string; name: string }[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: string; name: string; employee_id?: string }[]>([]);
  const [classrooms,  setClassrooms]  = useState<{ id: string; name: string }[]>([]);
  const [chapters,    setChapters]    = useState<{ id: string; name: string; order: number; subject?: string }[]>([]);
  const [examTypes,   setExamTypes]   = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setPageTitle("Timetable");
  }, [setPageTitle]);

  // ── Fetch all dropdown data on mount ──────────────────────────────────────
  useEffect(() => {
    // Batches
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: API.BATCHES.LIST,
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setBatches(Array.isArray(data) ? data : (data?.results ?? []));
      },
      getError: () => {},
    });

    // Subjects
    dispatch({
      type: subjectAction.GET_SUBJECTS,
      method: "GET",
      endPoint: "/api/v1/subjects/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(data)) setSubjects(data);
      },
      getError: () => {},
    });

    // Faculty
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setFacultyList(data?.results ?? (Array.isArray(data) ? data : []));
      },
      getError: () => {},
    });

    // Classrooms
    dispatch({
      type: ClassroomAction.GET_CLASSROOMS,
      method: "GET",
      endPoint: "/api/v1/classrooms/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setClassrooms(Array.isArray(data) ? data : (data?.results ?? []));
      },
      getError: () => {},
    });

    // Chapters
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/chapters/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(data)) setChapters(data);
      },
      getError: () => {},
    });

    // Exam Types (for slot form dropdown)
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/timetable/exam-types/",
      auth: true,
      getResponse: (res: any) => {
        if (res?.success) {
          const data = Array.isArray(res.data) ? res.data : [];
          setExamTypes(data.map((et: any) => ({ id: et.id, name: et.name })));
        }
      },
      getError: () => {},
    });
  }, [dispatch]);

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Schedule sessions, manage exam types, and view personal timetables."
      />

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
               examTypes={examTypes}
               chapters={chapters}
               defaultView="grid"
            />
          </TabsContent>

          <TabsContent value="slots" className="mt-0">
            <SlotsTab
              batches={batches}
              subjects={subjects}
              facultyList={facultyList}
              classrooms={classrooms}
              examTypes={examTypes}
              chapters={chapters}
              defaultView="list"
            />
          </TabsContent>

          <TabsContent value="exam_types" className="mt-0">
            <ExamTypesTab />
          </TabsContent>

          <TabsContent value="personal" className="mt-0">
            <PersonalTimetableTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
