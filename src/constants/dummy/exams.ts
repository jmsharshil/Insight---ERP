import { DUMMY_STUDENTS } from "./students";

export type ExamStatus = "scheduled" | "ongoing" | "completed" | "result_published";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  marks: number;
}

export interface Exam {
  id: string;
  title: string;
  type: "online" | "offline";
  subject: string;
  batch: string[];
  scheduledDate: string;
  startTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  status: ExamStatus;
  createdBy: string;
  geoFenced: boolean;
  assignedCheckers?: string[];
  questions?: Question[];
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  percentile: number;
  status: "pass" | "fail";
  recheckStatus?: "none" | "requested" | "in_review" | "resolved";
  submittedAt: string;
}

const SUBJECTS = ["Accountancy", "Economics", "Business Law", "Mathematics", "Taxation"];
const BATCHES = ["Batch A", "Batch B", "Morning", "Evening"];

function dateOffset(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

const sampleQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i + 1}`,
  text: `Sample question ${i + 1}: Which of the following best represents the concept of ${SUBJECTS[i % SUBJECTS.length]}?`,
  options: ["Option A — fundamental principle", "Option B — application case", "Option C — opposite concept", "Option D — none of the above"],
  correctIndex: i % 4,
  marks: 2,
}));

export const DUMMY_EXAMS: Exam[] = Array.from({ length: 10 }, (_, i) => {
  const type = i % 2 === 0 ? "online" : "offline";
  const offset = i - 4; // some past, some future
  const status: ExamStatus =
    offset < -2 ? "result_published" :
    offset < 0 ? "completed" :
    offset === 0 ? "ongoing" : "scheduled";
  return {
    id: `EXM-2024-${String(i + 1).padStart(3, "0")}`,
    title: `${SUBJECTS[i % SUBJECTS.length]} ${type === "online" ? "MCQ Test" : "Term Exam"}`,
    type,
    subject: SUBJECTS[i % SUBJECTS.length],
    batch: [BATCHES[i % BATCHES.length], BATCHES[(i + 1) % BATCHES.length]],
    scheduledDate: dateOffset(offset),
    startTime: "10:00",
    duration: 60,
    totalMarks: 50,
    passingMarks: 20,
    status,
    createdBy: "Rahul Patel",
    geoFenced: type === "online",
    assignedCheckers: type === "offline" ? ["u014"] : undefined,
    questions: type === "online" ? sampleQuestions : undefined,
  };
});

export const DUMMY_RESULTS: ExamResult[] = [];
let rId = 0;
DUMMY_EXAMS.filter(e => e.status === "completed" || e.status === "result_published").forEach(e => {
  DUMMY_STUDENTS.slice(0, 15).forEach((s, i) => {
    const marks = 15 + ((i * 7 + e.id.length) % 36);
    DUMMY_RESULTS.push({
      id: `RES-${++rId}`,
      examId: e.id,
      studentId: s.id,
      studentName: s.name,
      marksObtained: marks,
      totalMarks: e.totalMarks,
      percentage: Math.round((marks / e.totalMarks) * 100),
      percentile: 50 + ((i * 13) % 50),
      status: marks >= e.passingMarks ? "pass" : "fail",
      recheckStatus: i % 9 === 0 ? "requested" : "none",
      submittedAt: e.scheduledDate,
    });
  });
});

export const EXAM_STATUS_META: Record<ExamStatus, { label: string; bg: string; color: string }> = {
  scheduled: { label: "Scheduled", bg: "bg-blue-100", color: "text-blue-700" },
  ongoing: { label: "Ongoing", bg: "bg-amber-100", color: "text-amber-700" },
  completed: { label: "Completed", bg: "bg-gray-200", color: "text-black" },
  result_published: { label: "Results Published", bg: "bg-green-100", color: "text-green-700" },
};
