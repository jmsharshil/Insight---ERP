import {
  DayOfWeek,
  DaySchedule,
  WeeklySchedule,
  DAYS_ORDER,
  WeeklyScheduleStats,
} from "@/types/schedule";

/**
 * Calculates duration in decimal hours between start_time and end_time.
 * Supports midnight-crossing shifts (e.g. 22:00 to 06:00 = 8 hrs).
 */
export function calculateHoursBetweenTimes(
  startTime?: string | null,
  endTime?: string | null
): number {
  if (!startTime || !endTime) return 0;

  const parseToMinutes = (timeStr: string): number | null => {
    const parts = timeStr.trim().split(":");
    if (parts.length < 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };

  const startMins = parseToMinutes(startTime);
  const endMins = parseToMinutes(endTime);

  if (startMins === null || endMins === null) return 0;

  let diffMins = endMins - startMins;
  if (diffMins < 0) {
    // Overnight shift crossing midnight
    diffMins = 24 * 60 - startMins + endMins;
  }

  const hours = diffMins / 60;
  return Math.round(hours * 100) / 100;
}

/**
 * Computes total active days, total weekly hours, and active daily average.
 * Off-days (is_off = true) do NOT dilute the daily average.
 */
export function calculateWeeklyStats(
  schedule?: Partial<WeeklySchedule> | null
): WeeklyScheduleStats {
  if (!schedule) {
    return {
      totalActiveDays: 0,
      totalWeeklyHours: 0,
      averageDailyHours: 0,
      offDaysCount: 0,
    };
  }

  let totalActiveDays = 0;
  let totalWeeklyHours = 0;
  let offDaysCount = 0;

  DAYS_ORDER.forEach(({ key }) => {
    const day = schedule[key];
    if (!day) return;

    if (day.is_off) {
      offDaysCount++;
    } else {
      const hours =
        day.working_hours ??
        calculateHoursBetweenTimes(day.start_time, day.end_time);
      if (hours > 0) {
        totalActiveDays++;
        totalWeeklyHours += hours;
      }
    }
  });

  const averageDailyHours =
    totalActiveDays > 0
      ? Math.round((totalWeeklyHours / totalActiveDays) * 100) / 100
      : 0;

  return {
    totalActiveDays,
    totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
    averageDailyHours,
    offDaysCount,
  };
}

/**
 * Creates a standard weekly schedule default:
 * - Mon-Sat: default work start/end, is_off: false
 * - Sunday: 10:00 - 14:00, is_off: true
 */
export function createDefaultWeeklySchedule(
  defaultStartTime = "10:00:00",
  defaultEndTime = "19:00:00"
): WeeklySchedule {
  const defaultHours = calculateHoursBetweenTimes(
    defaultStartTime,
    defaultEndTime
  );

  return {
    monday: {
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      working_hours: defaultHours,
      is_off: false,
    },
    tuesday: {
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      working_hours: defaultHours,
      is_off: false,
    },
    wednesday: {
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      working_hours: defaultHours,
      is_off: false,
    },
    thursday: {
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      working_hours: defaultHours,
      is_off: false,
    },
    friday: {
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      working_hours: defaultHours,
      is_off: false,
    },
    saturday: {
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      working_hours: defaultHours,
      is_off: false,
    },
    sunday: {
      start_time: "10:00:00",
      end_time: "14:00:00",
      working_hours: 4.0,
      is_off: true,
    },
  };
}

/**
 * Normalizes input data into a clean WeeklySchedule object.
 * Handles strings, partial objects, boolean variants, and legacy start/end fallbacks.
 */
export function normalizeWeeklySchedule(
  input?: any,
  fallbackStart?: string | null,
  fallbackEnd?: string | null
): WeeklySchedule {
  let parsed = input;

  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
    } catch {
      parsed = null;
    }
  }

  const defaultSchedule = createDefaultWeeklySchedule(
    fallbackStart || "10:00:00",
    fallbackEnd || "19:00:00"
  );

  if (!parsed || typeof parsed !== "object" || Object.keys(parsed).length === 0) {
    return defaultSchedule;
  }

  const normalized: Partial<WeeklySchedule> = {};

  DAYS_ORDER.forEach(({ key }) => {
    const rawDay = parsed[key] || parsed[key.toLowerCase()] || parsed[key.toUpperCase()];
    const fallbackDay = defaultSchedule[key];

    if (!rawDay) {
      normalized[key] = { ...fallbackDay };
      return;
    }

    const isOffRaw = rawDay.is_off ?? rawDay.isOff;
    const is_off =
      isOffRaw === true ||
      isOffRaw === "true" ||
      isOffRaw === 1 ||
      isOffRaw === "1" ||
      isOffRaw === "yes";

    const start_time = (rawDay.start_time || rawDay.startTime || fallbackDay.start_time || "").trim();
    const end_time = (rawDay.end_time || rawDay.endTime || fallbackDay.end_time || "").trim();

    let working_hours: number;
    if (rawDay.working_hours !== undefined && rawDay.working_hours !== null && rawDay.working_hours !== "") {
      working_hours = Number(rawDay.working_hours);
    } else {
      working_hours = calculateHoursBetweenTimes(start_time, end_time);
    }

    normalized[key] = {
      start_time: formatTimeToStandard(start_time),
      end_time: formatTimeToStandard(end_time),
      working_hours: isNaN(working_hours) ? 0 : working_hours,
      is_off,
    };
  });

  return normalized as WeeklySchedule;
}

/**
 * Formats time string to "HH:MM:SS" or "HH:MM".
 */
export function formatTimeToStandard(timeStr?: string | null): string {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length === 1 && parts[0]) {
    return `${parts[0].padStart(2, "0")}:00:00`;
  }
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  }
  if (parts.length >= 3) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].slice(0, 2).padStart(2, "0")}`;
  }
  return timeStr;
}

/**
 * Formats "10:00:00" to "10:00 AM".
 */
export function formatTimeDisplay(timeStr?: string | null): string {
  if (!timeStr) return "—";
  try {
    const parts = timeStr.trim().split(":");
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMins = String(minutes).padStart(2, "0");
    return `${formattedHours}:${formattedMins} ${ampm}`;
  } catch {
    return timeStr;
  }
}

/**
 * Extracts flat fields (e.g. monday_start_time, monday_end_time, monday_is_off)
 * for compatibility with multipart/form-data uploads.
 */
export function weeklyScheduleToFlatFields(
  schedule: WeeklySchedule
): Record<string, string> {
  const result: Record<string, string> = {};

  DAYS_ORDER.forEach(({ key }) => {
    const day = schedule[key];
    if (day) {
      if (day.start_time) result[`${key}_start_time`] = day.start_time;
      if (day.end_time) result[`${key}_end_time`] = day.end_time;
      result[`${key}_is_off`] = day.is_off ? "true" : "false";
    }
  });

  return result;
}
