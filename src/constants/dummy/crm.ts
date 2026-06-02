export type LeadStatus = "new" | "contacted" | "interested" | "converted" | "lost";
export type LeadSource = "walk-in" | "referral" | "online" | "telecall";
export type AssignedRole = "counsellor" | "sales_exec" | "telecaller";

export interface InteractionNote {
  id: string;
  author: string;
  content: string;
  type: "call" | "visit" | "note" | "status_change";
  createdAt: string;
}

export interface Lead {
  id: string;
  studentName: string;
  guardianName: string;
  contact: string;
  email: string;
  courseInterested: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string;
  assignedToName: string;
  assignedRole: AssignedRole;
  lostReason?: string;
  notes: InteractionNote[];
  createdAt: string;
  updatedAt: string;
}

const COURSES = ["CA Foundation", "CS Executive", "CMA Inter", "B.Com", "MBA"];
const SOURCES: LeadSource[] = ["walk-in", "referral", "online", "telecall"];
const STATUSES: LeadStatus[] = ["new", "contacted", "interested", "converted", "lost"];

const NAMES = [
  "Aarav Sharma", "Diya Patel", "Vihaan Iyer", "Ananya Reddy", "Aditya Singh",
  "Ishaan Desai", "Saanvi Joshi", "Reyansh Kapoor", "Myra Verma", "Kabir Nair",
  "Aanya Mehta", "Arjun Gupta", "Avni Bose", "Vivaan Rao", "Pari Shah",
  "Atharv Kulkarni", "Kiara Trivedi", "Krish Bhatt", "Sara Pillai", "Yash Menon",
  "Riya Banerjee", "Veer Choudhary", "Anika Kohli", "Rudra Mishra", "Tara Saxena",
  "Aryan Chawla", "Disha Goel", "Kunal Khanna", "Aisha Kapoor", "Dev Sinha",
];
const GUARDIANS = [
  "Rakesh Sharma", "Sunita Patel", "Vikram Iyer", "Lakshmi Reddy", "Manoj Singh",
  "Pradeep Desai", "Anita Joshi", "Rajesh Kapoor", "Geeta Verma", "Suresh Nair",
];

const COUNSELLORS = [
  { id: "u006", name: "Amit Verma", role: "counsellor" as AssignedRole },
];
const TELECALLERS = [{ id: "u007", name: "Sneha Rao", role: "telecaller" as AssignedRole }];
const SALES = [{ id: "u009", name: "Pooja Singh", role: "sales_exec" as AssignedRole }];
const POOL = [...COUNSELLORS, ...TELECALLERS, ...SALES];

function daysAgo(d: number) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

export const DUMMY_LEADS: Lead[] = Array.from({ length: 30 }, (_, i) => {
  const status = STATUSES[i % STATUSES.length];
  const assignee = POOL[i % POOL.length];
  const created = daysAgo(30 - i);
  return {
    id: `INQ-${String(i + 1).padStart(3, "0")}`,
    studentName: NAMES[i % NAMES.length],
    guardianName: GUARDIANS[i % GUARDIANS.length],
    contact: `+91 9${String(800000000 + i * 7919).padStart(9, "0")}`,
    email: `${NAMES[i % NAMES.length].toLowerCase().replace(" ", ".")}@gmail.com`,
    courseInterested: COURSES[i % COURSES.length],
    source: SOURCES[i % SOURCES.length],
    status,
    assignedTo: assignee.id,
    assignedToName: assignee.name,
    assignedRole: assignee.role,
    lostReason: status === "lost" ? "Joined competitor" : undefined,
    notes: [
      {
        id: `n${i}-1`,
        author: assignee.name,
        content: "Initial inquiry recorded.",
        type: "note",
        createdAt: created,
      },
      ...(status !== "new"
        ? [
            {
              id: `n${i}-2`,
              author: assignee.name,
              content: "Called the parent; explained course structure.",
              type: "call" as const,
              createdAt: daysAgo(28 - i),
            },
          ]
        : []),
    ],
    createdAt: created,
    updatedAt: daysAgo(Math.max(0, 30 - i - 2)),
  };
});

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; color: string; bg: string }
> = {
  new: { label: "New", color: "text-blue-700", bg: "bg-blue-100" },
  contacted: { label: "Contacted", color: "text-indigo-700", bg: "bg-indigo-100" },
  interested: { label: "Interested", color: "text-amber-800", bg: "bg-amber-100" },
  converted: { label: "Converted", color: "text-green-700", bg: "bg-green-100" },
  lost: { label: "Lost", color: "text-red-700", bg: "bg-red-100" },
};

export const COURSE_OPTIONS = COURSES;
export const SOURCE_OPTIONS = SOURCES;
export const ASSIGNEE_POOL = POOL;
