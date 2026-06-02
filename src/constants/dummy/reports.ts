export const REPORT_KPIS = {
  totalRevenue: 1845200,
  avgAttendance: 91.4,
  newAdmissions: 34,
  conversionRate: 78.3,
};

export const FEE_MONTHLY = [
  { month: "Dec", amount: 320000 },
  { month: "Jan", amount: 410000 },
  { month: "Feb", amount: 380000 },
  { month: "Mar", amount: 450000 },
  { month: "Apr", amount: 460000 },
  { month: "May", amount: 452000 },
];

export const PAYMENT_MODES = [
  { name: "Online", value: 62 },
  { name: "Cash", value: 22 },
  { name: "Bank Transfer", value: 16 },
];

export const FEE_STATUS_ROWS = Array.from({ length: 8 }).map((_, i) => ({
  student: `Student ${i + 1}`,
  batch: ["JEE-A1", "NEET-B1", "JEE-A2"][i % 3],
  paid: 30000 + i * 1000,
  pending: i % 3 === 0 ? 10000 : 0,
  overdue: i === 2 || i === 6,
}));

export const ATTENDANCE_TREND = Array.from({ length: 30 }).map((_, i) => ({
  day: `D${i + 1}`,
  percent: 80 + Math.round(Math.sin(i / 3) * 12 + 6),
}));

export const ROOM_OCCUPANCY = Array.from({ length: 5 }).map((_, i) => ({
  room: `R-10${i + 1}`,
  morning: 18 + i * 2,
  afternoon: 15 + i,
  evening: 10 + (i % 3),
}));

export const FACULTY_LOAD = Array.from({ length: 6 }).map((_, i) => ({
  name: ["Meera", "Rakesh", "Anjali", "Vikram", "Priya", "Sanjay"][i],
  assigned: 22 + i,
  completed: 18 + i,
}));

export const SUBJECT_AVG = [
  { subject: "Physics", avg: 72 },
  { subject: "Chemistry", avg: 68 },
  { subject: "Math", avg: 78 },
  { subject: "Biology", avg: 74 },
  { subject: "English", avg: 81 },
];

export const ATT_VS_SCORE = Array.from({ length: 20 }).map((_, i) => ({
  attendance: 60 + i * 2,
  score: 50 + i * 2 + ((i * 7) % 10),
}));

export const CRM_FUNNEL = [
  { stage: "New", value: 240 },
  { stage: "Contacted", value: 180 },
  { stage: "Interested", value: 120 },
  { stage: "Converted", value: 64 },
  { stage: "Lost", value: 28 },
];

export const COUNSELLOR_PERF = [
  { name: "Amit", assigned: 60, converted: 24 },
  { name: "Sneha", assigned: 54, converted: 18 },
  { name: "Ravi", assigned: 72, converted: 32 },
];

export const LOST_REASONS = [
  { name: "Fee too high", value: 38 },
  { name: "Location", value: 22 },
  { name: "Joined elsewhere", value: 28 },
  { name: "Not interested", value: 12 },
];

export const LEAVE_BY_TYPE = [
  { type: "PL", count: 22 },
  { type: "SL", count: 14 },
  { type: "CL", count: 9 },
  { type: "Special", count: 4 },
];
