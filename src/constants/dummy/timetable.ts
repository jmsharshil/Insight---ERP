export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface TimetableSlot {
  id: string;
  batch: string;
  day: Day;
  period: 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  subject: string;
  facultyId: string;
  facultyName: string;
  classroom: string;
  isConflict?: boolean;
}

export const DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PERIODS = [1, 2, 3, 4, 5, 6] as const;
export const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "09:00", end: "10:00" },
  2: { start: "10:15", end: "11:15" },
  3: { start: "11:30", end: "12:30" },
  4: { start: "13:30", end: "14:30" },
  5: { start: "14:45", end: "15:45" },
  6: { start: "16:00", end: "17:00" },
};

export const TT_BATCHES = ["Batch A", "Batch B", "Morning", "Evening"];

export const FACULTY = [
  { id: "u012", name: "Dr. Meera Nair" },
  { id: "f02", name: "Prof. Rajeev Pillai" },
  { id: "f03", name: "Dr. Sneha Iyer" },
  { id: "f04", name: "Prof. Kunal Joshi" },
  { id: "f05", name: "Dr. Asha Reddy" },
];

export const SUBJECTS = ["Accountancy", "Economics", "Business Law", "Mathematics", "Taxation", "Auditing", "Costing", "Strategy"];
export const CLASSROOMS = ["R-101", "R-102", "R-201", "R-202", "R-301"];

let idCounter = 0;
const slot = (
  batch: string, day: Day, period: 1|2|3|4|5|6, subject: string, fIdx: number, room: string,
): TimetableSlot => ({
  id: `TT-${++idCounter}`,
  batch, day, period,
  startTime: PERIOD_TIMES[period].start,
  endTime: PERIOD_TIMES[period].end,
  subject,
  facultyId: FACULTY[fIdx].id,
  facultyName: FACULTY[fIdx].name,
  classroom: room,
});

function batchTimetable(batch: string, offset: number): TimetableSlot[] {
  const out: TimetableSlot[] = [];
  DAYS.forEach((day, di) => {
    for (let p = 1; p <= 5; p++) {
      const subj = SUBJECTS[(di + p + offset) % SUBJECTS.length];
      const fac = (di + p + offset) % FACULTY.length;
      const room = CLASSROOMS[(di + offset) % CLASSROOMS.length];
      out.push(slot(batch, day, p as 1|2|3|4|5, subj, fac, room));
    }
  });
  return out;
}

const allSlots: TimetableSlot[] = [
  ...batchTimetable("Batch A", 0),
  ...batchTimetable("Batch B", 1),
  ...batchTimetable("Morning", 2),
  ...batchTimetable("Evening", 3),
];

// Inject 3 conflicts: same faculty, same day/period, different batches
const conflictA = allSlots.find(s => s.batch === "Batch A" && s.day === "Monday" && s.period === 1)!;
const conflictB = allSlots.find(s => s.batch === "Batch B" && s.day === "Monday" && s.period === 1)!;
conflictB.facultyId = conflictA.facultyId;
conflictB.facultyName = conflictA.facultyName;
conflictA.isConflict = true;
conflictB.isConflict = true;

const cA2 = allSlots.find(s => s.batch === "Morning" && s.day === "Wednesday" && s.period === 3)!;
const cB2 = allSlots.find(s => s.batch === "Evening" && s.day === "Wednesday" && s.period === 3)!;
cB2.facultyId = cA2.facultyId; cB2.facultyName = cA2.facultyName;
cA2.isConflict = true; cB2.isConflict = true;

const cA3 = allSlots.find(s => s.batch === "Batch A" && s.day === "Friday" && s.period === 4)!;
const cB3 = allSlots.find(s => s.batch === "Batch B" && s.day === "Friday" && s.period === 4)!;
cB3.classroom = cA3.classroom; // room clash
cA3.isConflict = true; cB3.isConflict = true;

export const DUMMY_TIMETABLE = allSlots;
