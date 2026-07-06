import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import { setSelectedExam } from "@/redux/slices/examSlice";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";

import QuestionsTab    from "./tabs/QuestionsTab";
import MalpracticeTab  from "./tabs/MalpracticeTab";
import PapersTab       from "./tabs/PapersTab";
import ResultsTab      from "./tabs/ResultsTab";

const getVisibleTabs = (role: string) => {
  const all = [
    { value: "questions",   label: "Questions",   roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "malpractice", label: "Malpractice", roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "papers",      label: "Papers",      roles: ["super_admin","branch_manager","admin","faculty"] },
    { value: "results",     label: "Results",     roles: ["super_admin","branch_manager","admin","faculty","student","parent","parents"] },
  ];
  return all.filter(t => t.roles.includes(role));
};

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { setPageTitle } = useUI();
  const { user } = useAuth();

  const { selectedExam, error, exams } = useSelector((s: RootState) => s.exams);
  const role = user?.role ?? "student";
  const visibleTabs = getVisibleTabs(role);

  const defaultTab = ["student","parent","parents"].includes(role) ? "results" : role === "paper_checker" ? "papers" : "questions";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(!selectedExam || selectedExam.id !== id);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setPageTitle(selectedExam ? selectedExam.title : "Exam Details");
  }, [setPageTitle, selectedExam]);

  useEffect(() => { 
    if (!selectedExam || selectedExam.id !== id) {
      const found = exams.find(e => e.id === id);
      if (found) {
        dispatch(setSelectedExam(found));
        setLoading(false);
      } else {
        setLoading(true);
        dispatch({
          type: examActions.GET_EXAMS,
          method: "GET",
          endPoint: API.EXAMS.DETAIL(id as string),
          auth: true,
          setLoading: (v: boolean) => setLoading(v),
          getResponse: (res: any) => {
            const data = res?.data || res;
            dispatch(setSelectedExam(data));
          },
          getError: () => {
            setLoading(false);
          }
        } as any);
      }
    }
  }, [id, selectedExam, exams, dispatch]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading exam details...</div>;
  }
  if (!selectedExam) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Exam not found.</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={selectedExam.title}
        subtitle="Manage exam details, questions, and seating."
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-px mb-6">
            <TabsList className="bg-transparent h-auto p-0 border-none justify-start w-auto overflow-x-auto">
              {visibleTabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs uppercase bg-white">
                {selectedExam.exam_mode} - {selectedExam.exam_type}
              </Badge>
              <div className="w-px h-4 bg-border mx-1" />
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground" onClick={() => navigate("/exams")}>
                <ArrowLeft className="w-3 h-3" /> Back
              </Button>
            </div>
          </div>

          {/* ── Tabs Content ──────────────────────────────────────────────── */}
          {visibleTabs.some(t => t.value === "questions") && (
            <TabsContent value="questions" className="mt-0 outline-none">
              <QuestionsTab examId={selectedExam.id} />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "malpractice") && (
            <TabsContent value="malpractice" className="mt-0 outline-none">
              <MalpracticeTab examId={selectedExam.id} />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "papers") && (
            <TabsContent value="papers" className="mt-0 outline-none">
              <PapersTab examId={selectedExam.id} />
            </TabsContent>
          )}

          {visibleTabs.some(t => t.value === "results") && (
            <TabsContent value="results" className="mt-0 outline-none">
              <ResultsTab exam={selectedExam} />
            </TabsContent>
          )}

        </Tabs>
      </motion.div>
    </div>
  );
}
