export interface MalpracticeReport {
  id: string;
  studentId: string;
  studentName: string;
  incidentType: string;
  description: string;
  evidenceUrl?: string;
  reportedAt: string;
}

export interface SupervisionSlot {
  id: string;
  examId: string;
  examTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  supervisorId: string;
  supervisorName: string;
  status: "assigned" | "checked_in" | "completed";
  checkInTime?: string;
  isLate: boolean;
  hoursSupervised: number;
  compensation: number;
  malpracticeReports: MalpracticeReport[];
}

const SUPERVISORS = ["Kiran Patil", "Manish Tiwari", "Anjali Kapoor"];
const EXAMS = ["JEE Mock Test 5", "NEET Sectional - Biology", "Foundation Class Test", "JEE Full Length 12"];

export const SUPERVISION_SLOTS: SupervisionSlot[] = Array.from({ length: 8 }).map((_, i) => {
  const status: SupervisionSlot["status"] = i < 3 ? "completed" : i < 5 ? "checked_in" : "assigned";
  const date = new Date(Date.now() + (i - 3) * 86400000).toISOString().slice(0, 10);
  return {
    id: `SUP-${String(i + 1).padStart(3, "0")}`,
    examId: `EX-${String(i + 1).padStart(3, "0")}`,
    examTitle: EXAMS[i % EXAMS.length],
    date,
    startTime: "10:00",
    endTime: "13:00",
    room: `Room ${100 + i}`,
    supervisorId: `u01${3 + (i % 2)}`,
    supervisorName: SUPERVISORS[i % SUPERVISORS.length],
    status,
    checkInTime: status !== "assigned" ? (i % 3 === 0 ? "10:08" : "09:55") : undefined,
    isLate: status !== "assigned" && i % 3 === 0,
    hoursSupervised: status === "completed" ? 3 : 0,
    compensation: status === "completed" ? 1500 : 0,
    malpracticeReports: i === 1 ? [{
      id: "MAL-001",
      studentId: "STU-005",
      studentName: "Dhruv Shah",
      incidentType: "Mobile phone use",
      description: "Student found using mobile during exam.",
      reportedAt: new Date(Date.now() - 86400000).toISOString(),
    }] : [],
  };
});

export const INCIDENT_TYPES = [
  "Mobile phone use",
  "Talking with another student",
  "Carrying notes/material",
  "Impersonation",
  "Other",
];
