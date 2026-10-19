import React, { useMemo } from "react";
import {
  DayOfWeek,
  DaySchedule,
  WeeklySchedule,
  DAYS_ORDER,
} from "@/types/schedule";
import {
  calculateHoursBetweenTimes,
  calculateWeeklyStats,
  formatTimeDisplay,
  formatTimeToStandard,
} from "@/utils/schedule";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  ShieldCheck,
  Sparkles,
  Info,
  CalendarX,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

interface WeeklyScheduleEditorProps {
  value?: Partial<WeeklySchedule> | null;
  onChange?: (schedule: WeeklySchedule, averageDailyHours: number) => void;
  isEditing?: boolean;
  className?: string;
}

export const WeeklyScheduleEditor: React.FC<WeeklyScheduleEditorProps> = ({
  value,
  onChange,
  isEditing = true,
  className = "",
}) => {
  // Safe schedule with fallback for every day
  const schedule: WeeklySchedule = useMemo(() => {
    const s: Partial<WeeklySchedule> = value ? { ...value } : {};
    DAYS_ORDER.forEach(({ key, isWeekend }) => {
      if (!s[key]) {
        s[key] = {
          start_time: isWeekend ? "10:00:00" : "10:00:00",
          end_time: isWeekend ? "14:00:00" : "19:00:00",
          working_hours: isWeekend ? 4.0 : 9.0,
          is_off: !!isWeekend,
        };
      }
    });
    return s as WeeklySchedule;
  }, [value]);

  const stats = useMemo(() => calculateWeeklyStats(schedule), [schedule]);

  const handleDayChange = (dayKey: DayOfWeek, updates: Partial<DaySchedule>) => {
    if (!onChange) return;

    const currentDay = schedule[dayKey];
    const newDay: DaySchedule = {
      ...currentDay,
      ...updates,
    };

    // Auto-calculate daily working hours if times changed
    if (updates.start_time !== undefined || updates.end_time !== undefined) {
      newDay.working_hours = calculateHoursBetweenTimes(
        newDay.start_time,
        newDay.end_time
      );
    }

    const updatedSchedule: WeeklySchedule = {
      ...schedule,
      [dayKey]: newDay,
    };

    const newStats = calculateWeeklyStats(updatedSchedule);
    onChange(updatedSchedule, newStats.averageDailyHours);
  };

  const handleApplyToAllActive = (sourceDayKey: DayOfWeek = "monday") => {
    if (!onChange) return;
    const source = schedule[sourceDayKey];
    if (!source) return;

    const updated: WeeklySchedule = { ...schedule };
    DAYS_ORDER.forEach(({ key }) => {
      if (!updated[key].is_off) {
        updated[key] = {
          ...updated[key],
          start_time: source.start_time,
          end_time: source.end_time,
          working_hours: calculateHoursBetweenTimes(
            source.start_time,
            source.end_time
          ),
        };
      }
    });

    const newStats = calculateWeeklyStats(updated);
    onChange(updated, newStats.averageDailyHours);
  };

  const handleSetStandardDefault = () => {
    if (!onChange) return;
    const updated: WeeklySchedule = {
      monday: { start_time: "10:00:00", end_time: "19:00:00", working_hours: 9.0, is_off: false },
      tuesday: { start_time: "10:00:00", end_time: "19:00:00", working_hours: 9.0, is_off: false },
      wednesday: { start_time: "10:00:00", end_time: "19:00:00", working_hours: 9.0, is_off: false },
      thursday: { start_time: "10:00:00", end_time: "19:00:00", working_hours: 9.0, is_off: false },
      friday: { start_time: "10:00:00", end_time: "19:00:00", working_hours: 9.0, is_off: false },
      saturday: { start_time: "10:00:00", end_time: "19:00:00", working_hours: 9.0, is_off: false },
      sunday: { start_time: "10:00:00", end_time: "14:00:00", working_hours: 4.0, is_off: true },
    };
    const newStats = calculateWeeklyStats(updated);
    onChange(updated, newStats.averageDailyHours);
  };

  // Helper to extract HH:MM for time inputs
  const toInputValue = (timeStr?: string) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ─── Metric Badges Bar ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span>Avg Daily Hours</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-primary">
              {stats.averageDailyHours}
            </span>
            <span className="text-xs text-muted-foreground">hrs/day</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Synced with user profile
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Days</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-foreground">
              {stats.totalActiveDays}
            </span>
            <span className="text-xs text-muted-foreground">/ 7 days</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {stats.totalWeeklyHours} hrs weekly total
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 flex flex-col justify-between col-span-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Off-Days ({stats.offDaysCount} scheduled)</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] h-5 font-medium">
              Zero Deduction
            </Badge>
          </div>
          <div className="text-[11px] text-emerald-900/80 mt-1 leading-snug">
            Days with <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-[10px] font-mono">is_off: true</code> are exempt from absence salary deductions and delay penalties.
          </div>
        </div>
      </div>

      {/* ─── Quick Actions (in Edit Mode) ──────────────────── */}
      {isEditing && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-border/50 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Daily Shifts & Timings
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyToAllActive("monday")}
              className="h-7 text-[11px] px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
              title="Copy Monday shift timings to all working days"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Copy Mon to Working Days
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSetStandardDefault}
              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
            >
              Reset Default
            </Button>
          </div>
        </div>
      )}

      {/* ─── Day Rows List ──────────────────────────────────── */}
      <div className="space-y-2">
        {DAYS_ORDER.map(({ key, label, shortLabel, isWeekend }) => {
          const day = schedule[key];
          const calculatedHours =
            day.working_hours ??
            calculateHoursBetweenTimes(day.start_time, day.end_time);

          if (!isEditing) {
            // Read-Only Card Row
            return (
              <div
                key={key}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                  day.is_off
                    ? "bg-slate-50/80 border-slate-200/80 text-muted-foreground"
                    : "bg-white border-border text-foreground hover:bg-muted/10"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-semibold min-w-[70px] ${
                      day.is_off ? "text-slate-500" : "text-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  {isWeekend && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-300 text-amber-700 bg-amber-50/50">
                      Weekend
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {day.is_off ? (
                    <div className="flex items-center gap-2">
                      {day.start_time && day.end_time && (
                        <span className="font-mono text-[11px] text-muted-foreground/70 hidden sm:inline">
                          ({formatTimeDisplay(day.start_time)} – {formatTimeDisplay(day.end_time)})
                        </span>
                      )}
                      <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium h-5">
                        <CalendarX className="w-3 h-3 mr-1 text-slate-500" />
                        Off Day
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-medium">
                        {formatTimeDisplay(day.start_time)} – {formatTimeDisplay(day.end_time)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-[11px] font-semibold h-5"
                      >
                        {calculatedHours} hrs
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Editable Row
          return (
            <motion.div
              key={key}
              layout
              className={`p-3 rounded-xl border transition-all ${
                day.is_off
                  ? "bg-slate-50/60 border-slate-200/70"
                  : "bg-white border-border shadow-xs hover:border-primary/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Day Name & Off Toggle */}
                <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[170px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {label}
                    </span>
                    {isWeekend && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                        Weekend
                      </span>
                    )}
                  </div>

                  {/* Off-Day Toggle */}
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id={`switch-${key}`}
                      checked={day.is_off}
                      onCheckedChange={(checked) =>
                        handleDayChange(key, { is_off: checked })
                      }
                      className="data-[state=checked]:bg-emerald-600"
                    />
                    <Label
                      htmlFor={`switch-${key}`}
                      className={`text-xs cursor-pointer select-none font-medium ${
                        day.is_off ? "text-emerald-700" : "text-muted-foreground"
                      }`}
                    >
                      {day.is_off ? "Off Day" : "Working"}
                    </Label>
                  </div>
                </div>

                {/* Shift Inputs & Working Hours */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                  <div className={`flex items-center gap-1.5 transition-opacity ${day.is_off ? "opacity-60" : ""}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        Start
                      </span>
                      <Input
                        type="time"
                        value={toInputValue(day.start_time)}
                        disabled={day.is_off}
                        onChange={(e) =>
                          handleDayChange(key, {
                            start_time: formatTimeToStandard(e.target.value),
                          })
                        }
                        className={`h-8 w-28 text-xs font-mono ${
                          day.is_off
                            ? "bg-muted/70 text-muted-foreground border-dashed cursor-not-allowed select-none"
                            : "bg-background"
                        }`}
                      />
                    </div>

                    <span className="text-muted-foreground text-xs pt-3 font-mono">–</span>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        End
                      </span>
                      <Input
                        type="time"
                        value={toInputValue(day.end_time)}
                        disabled={day.is_off}
                        onChange={(e) =>
                          handleDayChange(key, {
                            end_time: formatTimeToStandard(e.target.value),
                          })
                        }
                        className={`h-8 w-28 text-xs font-mono ${
                          day.is_off
                            ? "bg-muted/70 text-muted-foreground border-dashed cursor-not-allowed select-none"
                            : "bg-background"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Hours Badge / Off Badge */}
                  <div className="flex flex-col items-end min-w-[75px] pt-1 sm:pt-3">
                    {day.is_off ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] h-6 font-medium whitespace-nowrap"
                        title="Designated Off-Day (Salary Not Deducted)"
                      >
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                        0 Ded.
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-xs font-mono font-semibold h-6 whitespace-nowrap"
                      >
                        {calculatedHours} hrs
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtle note for off-days with shift timings preserved */}
              {day.is_off && day.start_time && day.end_time && (
                <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> No penalty if absent
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ─── Informational Callout ───────────────────────────── */}
      <div className="rounded-xl bg-blue-50/70 border border-blue-200/70 p-3 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed text-[11px]">
          <p className="font-semibold text-blue-950">
            Automated Payroll & Attendance Integration
          </p>
          <p className="text-blue-900/80">
            1. Daily working hours are calculated automatically from shift timings.
            <br />
            2. Days with <strong className="font-medium">Off Day</strong> active are fully paid with <strong>zero deduction</strong> and excluded from shortfall delay penalties.
            <br />
            3. The user's overall <code className="bg-blue-100/70 px-1 py-0.5 rounded font-mono text-[10px]">working_hours</code> field is automatically set to the average of all active working days ({stats.averageDailyHours} hrs).
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleEditor;
