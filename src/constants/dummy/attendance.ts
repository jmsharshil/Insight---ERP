import { DUMMY_STUDENTS } from "./students";

export type AttStatus = "present" | "absent" | "late" | "half-day";
export type ScanType = "qr" | "manual";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  batch: string;
  date: string; // yyyy-mm-dd
  checkIn?: string;
  checkOut?: string;
  status: AttStatus;
  scanType: ScanType;
  deviceId?: string;
  violation?: "repeated_delay" | "unauthorised_absence";
}

function dateNDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function pickStatus(seed: number): AttStatus {
  const r = seed % 10;
  if (r < 7) return "present";
  if (r === 7) return "late";
  if (r === 8) return "half-day";
  return "absent";
}

let idC = 0;
export const DUMMY_ATTENDANCE: AttendanceRecord[] = [];

for (let d = 0; d < 30; d++) {
  const date = dateNDaysAgo(d);
  DUMMY_STUDENTS.forEach((s, si) => {
    const status = pickStatus(si + d);
    const isAbsent = status === "absent";
    const isLate = status === "late";
    DUMMY_ATTENDANCE.push({
      id: `ATT-${++idC}`,
      studentId: s.id,
      studentName: s.name,
      batch: s.batch,
      date,
      checkIn: isAbsent ? undefined : isLate ? "09:18" : "08:55",
      checkOut: isAbsent ? undefined : status === "half-day" ? "13:00" : "17:30",
      status,
      scanType: si % 4 === 0 ? "manual" : "qr",
      deviceId: si % 4 === 0 ? undefined : "GATE-01",
      violation: isLate && d < 5 ? "repeated_delay" : undefined,
    });
  });
}

export const ATT_STATUS_META: Record<AttStatus, { label: string; bg: string; color: string }> = {
  present: { label: "Present", bg: "bg-green-100", color: "text-green-700" },
  absent: { label: "Absent", bg: "bg-red-100", color: "text-red-700" },
  late: { label: "Late", bg: "bg-amber-100", color: "text-amber-700" },
  "half-day": { label: "Half Day", bg: "bg-blue-100", color: "text-blue-700" },
};
