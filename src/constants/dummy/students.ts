export type StudentStatus = "active" | "inactive" | "transferred" | "alumni";

export interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  course: string;
  batch: string;
  status: StudentStatus;
  photo?: string;
  dob: string;
  address: string;
  bloodGroup: string;
  admissionDate: string;
  feePaid: number;
  feeTotal: number;
  attendancePercent: number;
  linkedParentId?: string;
  digitalId: { qrCode: string; validUntil: string };
  inventory: { uniforms: number; books: string[] };
  documents: { name: string; uploadedAt: string }[];
}

const COURSES = ["CA Foundation", "CS Executive", "CMA Inter", "B.Com", "MBA"];
const BATCHES = ["Batch A", "Batch B", "Morning", "Evening"];
const STATUSES: StudentStatus[] = ["active", "active", "active", "active", "inactive", "transferred", "alumni"];
const BLOOD = ["A+", "B+", "O+", "AB+", "A-", "O-"];

const FIRST = ["Dhruv","Aarav","Diya","Vihaan","Ananya","Aditya","Ishaan","Saanvi","Reyansh","Myra","Kabir","Aanya","Arjun","Avni","Vivaan","Pari","Atharv","Kiara","Krish","Sara","Yash","Riya","Veer","Anika","Rudra"];
const LAST = ["Shah","Sharma","Patel","Iyer","Reddy","Singh","Desai","Joshi","Kapoor","Verma","Nair","Mehta","Gupta","Bose","Rao"];

export const DUMMY_STUDENTS: Student[] = Array.from({ length: 25 }, (_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
  const course = COURSES[i % COURSES.length];
  const batch = BATCHES[i % BATCHES.length];
  const feeTotal = 60000 + (i % 5) * 10000;
  const feePaid = i % 4 === 0 ? feeTotal : Math.floor(feeTotal * (0.3 + (i % 7) * 0.1));
  return {
    id: `STU-2024-${String(i + 1).padStart(3, "0")}`,
    admissionNumber: `STU-2024-${String(i + 1).padStart(3, "0")}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@insight.edu`,
    phone: `+91 98${String(7600000 + i * 113).padStart(8, "0")}`,
    guardianName: `${LAST[i % LAST.length]} Family`,
    guardianPhone: `+91 99${String(8600000 + i * 211).padStart(8, "0")}`,
    course,
    batch,
    status: STATUSES[i % STATUSES.length],
    dob: `200${4 + (i % 5)}-0${1 + (i % 9)}-1${i % 9}`,
    address: `${100 + i}, Insight Lane, Surat`,
    bloodGroup: BLOOD[i % BLOOD.length],
    admissionDate: `2024-06-${String(1 + (i % 28)).padStart(2, "0")}`,
    feePaid,
    feeTotal,
    attendancePercent: 65 + (i * 7) % 35,
    linkedParentId: i % 3 === 0 ? "u011" : undefined,
    digitalId: { qrCode: `QR-STU-2024-${String(i + 1).padStart(3, "0")}`, validUntil: "2025-12-31" },
    inventory: { uniforms: 2, books: [`${course} Vol 1`, `${course} Vol 2`] },
    documents: [
      { name: "Aadhaar.pdf", uploadedAt: "2024-06-01" },
      { name: "MarkSheet.pdf", uploadedAt: "2024-06-01" },
    ],
  };
});

export const STUDENT_STATUS_META: Record<StudentStatus, { label: string; bg: string; color: string }> = {
  active: { label: "Active", bg: "bg-green-100", color: "text-green-700" },
  inactive: { label: "Inactive", bg: "bg-gray-200", color: "text-black" },
  transferred: { label: "Transferred", bg: "bg-blue-100", color: "text-blue-700" },
  alumni: { label: "Alumni", bg: "bg-amber-100", color: "text-amber-700" },
};

export const COURSE_LIST = COURSES;
export const BATCH_LIST = BATCHES;
