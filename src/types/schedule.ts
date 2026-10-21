export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type SaturdayRule = "odd" | "even" | "all" | "off";

export interface DaySchedule {
  start_time: string;
  end_time: string;
  working_hours?: number;
  is_off: boolean;
  saturday_rule?: SaturdayRule;
}

export type WeeklySchedule = Record<DayOfWeek, DaySchedule>;

export interface DayMeta {
  key: DayOfWeek;
  label: string;
  shortLabel: string;
  isWeekend?: boolean;
}

export const DAYS_ORDER: DayMeta[] = [
  { key: "monday", label: "Monday", shortLabel: "Mon" },
  { key: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "friday", label: "Friday", shortLabel: "Fri" },
  { key: "saturday", label: "Saturday", shortLabel: "Sat" },
  { key: "sunday", label: "Sunday", shortLabel: "Sun", isWeekend: true },
];

export interface WeeklyScheduleStats {
  totalActiveDays: number;
  totalWeeklyHours: number;
  averageDailyHours: number;
  offDaysCount: number;
}
