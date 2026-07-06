import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import PageHeader from "@/components/layout/PageHeader";
import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import type { AppDispatch } from "@/store";
import { setSelectedExam, setQuestions, setSeating, setMalpractice } from "@/redux/slices/examSlice";
import type { Exam } from "@/redux/slices/examSlice";
import { dropdownActions } from "@/redux/actions";

import ExamsListTab from "./tabs/ExamsListTab";

export default function ExamsPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [facultyList, setFacultyList] = useState<{ id: string; name: string; user_id?: string }[]>([]);

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
    dispatch(setSelectedExam(null)); // Clear any selected exam when returning to the list
  }, [setPageTitle, dispatch]);

  // Fetch faculty list to resolve the logged-in faculty's profile UUID
  useEffect(() => {
    if (user?.role !== "faculty") return;
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      getResponse: (res: any) => {
        if (res?.data && !Array.isArray(res.data) && res.data.id) {
          setFacultyList([{
            id: res.data.id,
            name: res.data.full_name || res.data.name || "",
            user_id: res.data.user || res.data.user_id,
          }]);
          return;
        }
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
    navigate(`/exams/${exam.id}`);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Exams"
        subtitle="View and manage all exams."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col flex-1"
      >
        <ExamsListTab
          onSelectExam={handleSelectExam}
          selectedExamId={null}
          resolvedFacultyId={resolvedFacultyId}
        />
      </motion.div>
    </div>
  );
}
