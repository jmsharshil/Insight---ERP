export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualifications: string;
  subjectExpertise: string[];
  employmentType: "full-time" | "part-time" | "contract";
  joinedDate: string;
  bankDetails: { accountNo: string; bankName: string; ifsc: string };
  hourlyRate: Record<string, number>;
  status: "active" | "inactive";
}

export interface SessionReport {
  id: string;
  facultyId: string;
  date: string;
  subject: string;
  topic: string;
  chapter: string;
  completionPercent: number;
  remarks: string;
  batch: string;
}

export interface PayrollRecord {
  id: string;
  facultyId: string;
  month: string;
  hoursTaught: number;
  hourlyRate: number;
  grossAmount: number;
  lateEntryDeductions: number;
  absenceDeductions: number;
  netPayable: number;
  status: "draft" | "pending_approval" | "approved" | "disbursed";
  approvedBy?: string;
  disbursedAt?: string;
}

export interface FacultyAttendanceEntry {
  date: string;
  checkIn: string;
  checkOut: string;
  hours: number;
  late: boolean;
}

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English"];
const BATCHES = ["JEE-A1", "JEE-A2", "NEET-B1", "NEET-B2", "FOUNDATION-C1"];

export const FACULTY_MEMBERS: FacultyMember[] = Array.from({ length: 8 }).map((_, i) => {
  const subjects = [SUBJECTS[i % 5], SUBJECTS[(i + 1) % 5]];
  return {
    id: `FAC-${String(i + 1).padStart(3, "0")}`,
    name: [
      "Dr. Meera Nair", "Prof. Rakesh Sinha", "Ms. Anjali Kapoor", "Mr. Vikram Rao",
      "Dr. Priya Iyer", "Mr. Sanjay Bhatt", "Ms. Nisha Reddy", "Prof. Ajay Menon",
    ][i],
    email: `faculty${i + 1}@insight.edu`,
    phone: `+91 98765 1${String(i).padStart(4, "0")}`,
    qualifications: ["M.Sc, PhD", "M.Tech", "M.Sc, B.Ed", "M.A, B.Ed", "PhD"][i % 5],
    subjectExpertise: subjects,
    employmentType: (["full-time", "full-time", "part-time", "contract"] as const)[i % 4],
    joinedDate: `202${1 + (i % 3)}-0${(i % 9) + 1}-15`,
    bankDetails: {
      accountNo: `12345${String(i).padStart(5, "0")}`,
      bankName: "HDFC Bank",
      ifsc: "HDFC0001234",
    },
    hourlyRate: subjects.reduce((acc, s) => ({ ...acc, [s]: 800 + i * 50 }), {}),
    status: i === 7 ? "inactive" : "active",
  };
});

export const SESSION_REPORTS: SessionReport[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `SR-${String(i + 1).padStart(3, "0")}`,
  facultyId: FACULTY_MEMBERS[i % FACULTY_MEMBERS.length].id,
  date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  subject: SUBJECTS[i % SUBJECTS.length],
  topic: `Chapter ${(i % 12) + 1} — Topic ${(i % 4) + 1}`,
  chapter: `Ch ${(i % 12) + 1}`,
  completionPercent: 60 + (i * 7) % 41,
  remarks: ["All caught up", "Need revision", "Doubts cleared", "Test scheduled"][i % 4],
  batch: BATCHES[i % BATCHES.length],
}));

const MONTHS = ["Mar 2024", "Apr 2024", "May 2024"];
export const PAYROLL_RECORDS: PayrollRecord[] = MONTHS.flatMap((month, m) =>
  FACULTY_MEMBERS.map((f, i) => {
    const hours = 60 + ((i + m) * 7) % 40;
    const rate = Object.values(f.hourlyRate)[0];
    const gross = hours * rate;
    const lateDed = (i % 3) * 200;
    const absDed = (i % 4) * 300;
    return {
      id: `PAY-${m}-${i}`,
      facultyId: f.id,
      month,
      hoursTaught: hours,
      hourlyRate: rate,
      grossAmount: gross,
      lateEntryDeductions: lateDed,
      absenceDeductions: absDed,
      netPayable: gross - lateDed - absDed,
      status: m === 2 ? (i < 3 ? "pending_approval" : "draft") : "disbursed",
      approvedBy: m < 2 ? "Priya Sharma" : undefined,
      disbursedAt: m < 2 ? `2024-0${m + 4}-30` : undefined,
    } as PayrollRecord;
  }),
);

export const FACULTY_ATTENDANCE: FacultyAttendanceEntry[] = Array.from({ length: 10 }).map((_, i) => {
  const lateMin = i % 4 === 0 ? 12 : 0;
  return {
    date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    checkIn: `09:${String(lateMin).padStart(2, "0")}`,
    checkOut: `17:${String(i * 3 % 60).padStart(2, "0")}`,
    hours: 8 - (lateMin / 60),
    late: lateMin > 5,
  };
});
