import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import { setSelectedExam, setQuestions, setSeating, setMalpractice } from "@/redux/slices/examSlice";
import type { Exam } from "@/redux/slices/examSlice";
import { dropdownActions } from "@/redux/actions";

// ── Tab Components ────────────────────────────────────────────────────────────
import ExamsListTab    from "./tabs/ExamsListTab";
import QuestionsTab    from "./tabs/QuestionsTab";
import SeatingTab      from "./tabs/SeatingTab";
import MalpracticeTab  from "./tabs/MalpracticeTab";
import PapersTab       from "./tabs/PapersTab";
import ResultsTab      from "./tabs/ResultsTab";

// ─── Role-based tab config ────────────────────────────────────────────────────
const getVisibleTabs = (role: string) => {
  const all = [
    { value: "list",        label: "Exams",       roles: ["super_admin","branch_manager","admin","faculty","student","parent","parents"] },
    { value: "questions",   label: "Questions",   roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "seating",     label: "Seating",     roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "malpractice", label: "Malpractice", roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "papers",      label: "Papers",      roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "results",     label: "Results",     roles: ["super_admin","branch_manager","admin","faculty","student","parent","parents"] },
  ];
  return all.filter(t => t.roles.includes(role));
};

export default function ExamsPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const { selectedExam, error } = useSelector((s: RootState) => s.exams);

  const [activeTab, setActiveTab] = useState("list");
  const [facultyList, setFacultyList] = useState<{ id: string; name: string; user_id?: string }[]>([]);

  const role = user?.role ?? "student";
  const visibleTabs = getVisibleTabs(role);

  // Resolve the real Faculty Profile UUID (same logic as PersonalTimetableTab)
  const resolvedFacultyId = useMemo(() => {
    if (user?.role !== "faculty" || !user) return "";
    const profile = facultyList.find(
      f => f.user_id === user.id || f.name?.toLowerCase() === user.name?.toLowerCase()
    );
    return profile?.id ?? "";
  }, [facultyList, user]);

  useEffect(() => {
    setPageTitle("Exams");
  }, [setPageTitle]);

  // Fetch faculty list to resolve the logged-in faculty's profile UUID
  useEffect(() => {
    if (user?.role !== "faculty") return;
    // When a faculty user calls /api/v1/faculty/, the backend returns their OWN profile
    // as a single object: { success: true, data: { id: "...", ... } }
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      getResponse: (res: any) => {
        // Case 1: Single faculty object (faculty calling their own profile)
        if (res?.data && !Array.isArray(res.data) && res.data.id) {
          setFacultyList([{
            id: res.data.id,
            name: res.data.full_name || res.data.name || "",
            user_id: res.data.user || res.data.user_id,
          }]);
          return;
        }
        // Case 2: Array / paginated list (admin calling all faculty)
        const raw = res?.data?.results ?? res?.results ?? res?.data ?? res;
        const list = Array.isArray(raw) ? raw : [];
        if (list.length > 0) {
          setFacultyList(list.map((f: any) => ({
            id: f.id,
            name: f.full_name || f.name || `${f.first_name || ""} ${f.last_name || ""}`.trim(),
            user_id: f.user || f.user_id,
          })));
        }
      },
      getError: () => {},
    } as any);
  }, [user?.role, dispatch]);



  const handleSelectExam = (exam: Exam) => {
    dispatch(setSelectedExam(exam));
    // Clear sub-data when switching exam
    dispatch(setQuestions([]));
    dispatch(setSeating([]));
    dispatch(setMalpractice([]));
    // Switch to questions tab for admins/faculty, results for students/parents
    if (["student","parent","parents"].includes(role)) {
      setActiveTab("results");
    } else {
      setActiveTab("questions");
    }
  };

  const handleBackToList = () => {
    dispatch(setSelectedExam(null));
    setActiveTab("list");
  };

  // ── Detail view — shown when an exam is selected ──────────────────────────
  const showDetail = !!selectedExam && activeTab !== "list";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Exams"
        subtitle={showDetail ? "Manage exam details, questions, and seating." : "View and manage all exams."}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-600 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col flex-1"
      >
        <Tabs value={activeTab} onValueChange={v => {
          setActiveTab(v);
          // When navigating to list tab, clear selected exam
          if (v === "list") { dispatch(setSelectedExam(null)); }
        }}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-px mb-6">
            <TabsList className="bg-transparent h-auto p-0 border-none justify-start w-auto overflow-x-auto">
              {visibleTabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.value !== "list" && !selectedExam}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Selected exam pill */}
            {selectedExam && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-full border border-border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{selectedExam.title}</span>
                  <Badge variant="outline" className="text-[10px] uppercase bg-white">
                    {selectedExam.exam_type}
                  </Badge>
                </div>
                <div className="w-px h-4 bg-border mx-1" />
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground" onClick={handleBackToList}>
                  <ArrowLeft className="w-3 h-3" /> Back
                </Button>
              </motion.div>
            )}
          </div>

          {/* ── Exams List ──────────────────────────────────────────────── */}
          <TabsContent value="list" className="mt-0 outline-none">
            <ExamsListTab
              onSelectExam={handleSelectExam}
              selectedExamId={selectedExam?.id ?? null}
              resolvedFacultyId={resolvedFacultyId}
            />
          </TabsContent>

          {/* ── Questions ────────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "questions") && (
            <TabsContent value="questions" className="mt-0 outline-none">
              {selectedExam
                ? <QuestionsTab examId={selectedExam.id} />
                : <EmptySelectPrompt message="Select an exam from the list to view its questions." />}
            </TabsContent>
          )}

          {/* ── Seating ──────────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "seating") && (
            <TabsContent value="seating" className="mt-0 outline-none">
              {selectedExam
                ? <SeatingTab examId={selectedExam.id} />
                : <EmptySelectPrompt message="Select an exam from the list to manage seating." />}
            </TabsContent>
          )}

          {/* ── Malpractice ──────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "malpractice") && (
            <TabsContent value="malpractice" className="mt-0 outline-none">
              {selectedExam
                ? <MalpracticeTab examId={selectedExam.id} />
                : <EmptySelectPrompt message="Select an exam from the list to view malpractice reports." />}
            </TabsContent>
          )}

          {/* ── Papers ───────────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "papers") && (
            <TabsContent value="papers" className="mt-0 outline-none">
              {selectedExam
                ? <PapersTab examId={selectedExam.id} />
                : <EmptySelectPrompt message="Select an exam from the list to view papers." />}
            </TabsContent>
          )}

          {/* ── Results ──────────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "results") && (
            <TabsContent value="results" className="mt-0 outline-none">
              {selectedExam
                ? <ResultsTab exam={selectedExam} />
                : <EmptySelectPrompt message="Select an exam from the list to view results." />}
            </TabsContent>
          )}

        </Tabs>
      </motion.div>
    </div>
  );
}

// ─── Empty state when no exam is selected ─────────────────────────────────────
function EmptySelectPrompt({ message }: { message: string }) {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-border">
      <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
