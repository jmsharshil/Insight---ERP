import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  ShieldAlert, 
  MapPin, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Clock,
  CalendarDays, 
  Building2, 
  Mail, 
  ExternalLink, 
  X,
  UserCheck,
  UserX,
  Briefcase
} from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setSelectedFaculty, setSelectedFacultyLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { AttendanceDetailSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatDateToYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    from_date: formatDateToYMD(sevenDaysAgo),
    to_date: formatDateToYMD(today),
  };
};

export default function FacultyAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  
  const { selectedFaculty, selectedFacultyLoading } = useSelector((s: RootState) => s.attendance);

  const defaultRange = getDefaultDateRange();
  const initialFromDate = searchParams.get("from_date") || defaultRange.from_date;
  const initialToDate = searchParams.get("to_date") || defaultRange.to_date;

  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [isFiltering, setIsFiltering] = useState(false);

  const fetchFacultyDetail = (
    facultyId: string, 
    params?: { from_date?: string; to_date?: string },
    isRefetch = false
  ) => {
    if (!isRefetch) {
      dispatch(setSelectedFaculty(null));
    }
    setIsFiltering(true);
    dispatch({
      type: attendanceActions.GET_FACULTY_DETAIL,
      method: "GET",
      endPoint: API.ATTENDANCE.FACULTY_DETAIL(facultyId, params),
      auth: true,
      setLoading: (v: boolean) => {
        dispatch(setSelectedFacultyLoading(v));
        if (!v) setIsFiltering(false);
      },
      getResponse: (res: any) => {
        setIsFiltering(false);
        if (res?.success && res?.data) {
          dispatch(setSelectedFaculty(res.data));
        } else {
          toast.error("Failed to load faculty detail.");
        }
      },
      getError: (err: any) => {
        setIsFiltering(false);
        toast.error(err?.response?.data?.message || "Failed to fetch faculty detail");
      },
    });
  };

  useEffect(() => {
    if (id) {
      const defaultRange = getDefaultDateRange();
      const pFrom = searchParams.get("from_date") || defaultRange.from_date;
      const pTo = searchParams.get("to_date") || defaultRange.to_date;
      setFromDate(pFrom);
      setToDate(pTo);
      fetchFacultyDetail(id, {
        from_date: pFrom,
        to_date: pTo,
      });
    }
    return () => {
      dispatch(setSelectedFaculty(null));
    };
  }, [id]);

  const handleApplyFilter = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From Date cannot be later than To Date");
      return;
    }
    const newParams: Record<string, string> = {};
    if (fromDate) newParams.from_date = fromDate;
    if (toDate) newParams.to_date = toDate;
    setSearchParams(newParams);
    if (id) {
      fetchFacultyDetail(id, newParams, true);
    }
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    setSearchParams({});
    if (id) {
      fetchFacultyDetail(id, undefined, true);
    }
  };

  const pct = (v: number) => {
    if (v >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (v >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "present":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "absent":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "checkout_pending":
        return "bg-amber-50 text-amber-700 border-amber-300";
      case "half_day":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "week_off":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "leave":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "holiday":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "late":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "—";
    try {
      if (timeStr.includes("T") || timeStr.includes("-")) {
        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatDayName = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-US", { weekday: "short" });
      }
      return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
    } catch {
      return "";
    }
  };

  const calculateDuration = (inTimeStr: string | null, outTimeStr: string | null) => {
    if (!inTimeStr || !outTimeStr) return null;
    try {
      const inDate = new Date(inTimeStr);
      const outDate = new Date(outTimeStr);
      const diffMs = outDate.getTime() - inDate.getTime();
      if (diffMs <= 0) return null;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return null;
    }
  };

  if (selectedFacultyLoading && !selectedFaculty) {
    return (
      <div className="mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate('/attendance', { state: { tab: 'faculty' } })} className="h-9 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Faculty
        </Button>
        <AttendanceDetailSkeleton />
      </div>
    );
  }

  if (!selectedFaculty) {
    return (
      <div className="container mx-auto p-6 text-center py-20">
        <h3 className="text-lg font-semibold text-muted-foreground mb-4">No faculty data found</h3>
        <Button variant="outline" onClick={() => navigate('/attendance', { state: { tab: 'faculty' } })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const { 
    employee_profile: faculty, 
    attendance_percentage,
    summary, 
    day_wise_attendance = [], 
    recent_absences = [],
    check_in_history = [], 
    check_out_history = [],
    monthly_trend = []
  } = selectedFaculty;

  return (
    <div className="mx-auto space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="h-9 text-sm border-border hover:bg-muted"
          onClick={() => navigate('/attendance', { state: { tab: 'faculty' } })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Faculty
        </Button>
      </div>

      {/* Top Banner: Profile & Attendance Overview */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col xl:flex-row gap-8 justify-between items-start xl:items-center">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Profile Info */}
        <div className="flex items-start sm:items-center gap-6 relative z-10 w-full xl:w-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/20 to-primary/30 flex items-center justify-center text-primary font-black text-2xl sm:text-3xl shadow-xs border border-primary/20 shrink-0">
            {faculty?.name ? faculty.name.slice(0, 2).toUpperCase() : "EM"}
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate">
                {faculty?.name || "Employee"}
              </h2>
              {faculty?.role && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold capitalize px-2.5 py-0.5">
                  {faculty.role.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                <span className="font-mono font-medium text-foreground">{faculty?.employee_id || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                <span className="font-medium text-foreground truncate max-w-[200px]" title={faculty?.branch_name || "N/A"}>
                  {faculty?.branch_name || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                <span className="font-medium text-foreground truncate max-w-[240px]" title={faculty?.email || "N/A"}>
                  {faculty?.email || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Percentage Card */}
        <div className="flex items-center gap-6 relative z-10 bg-muted/30 p-5 sm:p-6 rounded-2xl border border-border/60 shrink-0 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Attendance Rate
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
                {(attendance_percentage || 0).toFixed(1)}
              </span>
              <span className="text-2xl text-primary font-bold">%</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant="outline" className={`border text-xs font-bold px-3 py-1 uppercase tracking-wider ${pct(attendance_percentage || 0)}`}>
              {(attendance_percentage || 0) >= 75 ? 'Excellent' : (attendance_percentage || 0) >= 50 ? 'Average' : 'Low'}
            </Badge>
            <span className="text-[11px] text-muted-foreground font-medium">
              {summary?.working_days || 0} Working Days
            </span>
          </div>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Date Range Filter</h3>
              {(fromDate || toDate) && (
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-semibold px-2">
                  Active Filter
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {fromDate && toDate 
                ? `Showing records from ${formatDate(fromDate)} to ${formatDate(toDate)}`
                : fromDate 
                ? `Showing records from ${formatDate(fromDate)} onwards`
                : toDate 
                ? `Showing records up to ${formatDate(toDate)}`
                : "Select date boundaries to filter attendance records (?from_date= & ?to_date=)"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date inputs & action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">From:</span>
              <Input
                type="date"
                className="h-9 w-36 text-xs bg-muted/20"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">To:</span>
              <Input
                type="date"
                className="h-9 w-36 text-xs bg-muted/20"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              onClick={handleApplyFilter}
              disabled={isFiltering}
            >
              {isFiltering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Filter className="w-3.5 h-3.5" />
                  Apply
                </>
              )}
            </Button>
            {(fromDate || toDate) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs border-border gap-1"
                onClick={handleClearFilter}
                disabled={isFiltering}
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards Grid */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total Days", value: summary?.total_days ?? 0, color: "text-slate-800", bg: "bg-slate-50", border: "border-slate-200" },
          { label: "Working Days", value: summary?.working_days ?? 0, color: "text-blue-700", bg: "bg-blue-50/60", border: "border-blue-200" },
          { label: "Present", value: summary?.present_count ?? 0, color: "text-emerald-700", bg: "bg-emerald-50/70", border: "border-emerald-200" },
          { label: "Absent", value: summary?.absent_count ?? 0, color: "text-rose-700", bg: "bg-rose-50/70", border: "border-rose-200" },
          { label: "Week Off", value: summary?.week_off_count ?? 0, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-200" },
          { label: "Late / Pending", value: summary?.late_count ?? 0, color: "text-amber-700", bg: "bg-amber-50/70", border: "border-amber-200" },
          { label: "Leave", value: summary?.leave_count ?? 0, color: "text-sky-700", bg: "bg-sky-50/60", border: "border-sky-200" },
          { label: "Holiday", value: summary?.holiday_count ?? 0, color: "text-teal-700", bg: "bg-teal-50/60", border: "border-teal-200" },
        ].map((item) => (
          <div
            key={item.label}
            className={`${item.bg} ${item.border} rounded-xl p-3 flex flex-col items-center justify-center border shadow-xs transition-transform hover:-translate-y-0.5`}
          >
            <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
            <div className={`text-[10px] uppercase font-bold ${item.color} mt-1 tracking-wider text-center`}>
              {item.label}
            </div>
          </div>
        ))}
      </div> */}

      {/* Full width tabs */}
      <Tabs defaultValue="day_wise" className="w-full space-y-6">
        <TabsList className="w-full flex justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
          <TabsTrigger 
            value="day_wise" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-semibold text-sm"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Day-wise Records ({day_wise_attendance?.length || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="absences" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-semibold text-sm"
          >
            <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" />
            Recent Absences ({recent_absences?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Day-wise Records */}
        <TabsContent value="day_wise" className="mt-0">
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex flex-wrap justify-between items-center gap-2">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Day-wise Attendance Records
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Showing {day_wise_attendance?.length || 0} records
                </span>
                {(fromDate || toDate) && (
                  <Badge variant="outline" className="text-[11px] bg-primary/5 text-primary border-primary/20">
                    Filtered
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4">
              {day_wise_attendance && day_wise_attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/15">
                      <tr className="border-b border-border text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Subject / Slot</th>
                        <th className="py-3 px-3">Check-In Details</th>
                        <th className="py-3 px-3">Check-Out Details</th>
                        <th className="py-3 px-3">Working Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {day_wise_attendance.map((day: any, idx: number) => {
                        const checkIn = check_in_history?.find((e: any) => e.id === day.id);
                        const checkOut = check_out_history?.find((e: any) => e.id === day.id);

                        const checkInTime = day.checked_in_at || checkIn?.time;
                        const checkOutTime = day.checked_out_at || checkOut?.time;
                        const checkInMethod = day.check_in_method_display || (day.check_in_method === "qr" ? "QR Scan" : day.check_in_method);
                        const checkOutMethod = day.check_out_method_display || (day.check_out_method === "qr" ? "QR Scan" : day.check_out_method);

                        // Check-in location extraction
                        const checkInLoc = day.location_details?.check_in || (day.location_details?.latitude ? day.location_details : null);
                        const checkInLat = checkInLoc?.latitude;
                        const checkInLng = checkInLoc?.longitude;
                        const checkInVerified = checkInLoc?.location_verified;

                        // Check-out location extraction
                        const checkOutLoc = day.location_details?.check_out;
                        const checkOutLat = checkOutLoc?.latitude;
                        const checkOutLng = checkOutLoc?.longitude;
                        const checkOutVerified = checkOutLoc?.location_verified;

                        const duration = calculateDuration(checkInTime, checkOutTime);

                        return (
                          <tr key={day.id || idx} className="hover:bg-muted/15 transition-colors">
                            {/* Date Column */}
                            <td className="py-3 px-3 font-medium align-top min-w-[120px]">
                              <div className="flex flex-col">
                                <span className="font-mono text-foreground font-semibold">
                                  {formatDate(day.date)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDayName(day.date)}
                                </span>
                                {day.is_week_off && (
                                  <span className="text-[10px] text-indigo-600 font-semibold mt-0.5">Week Off</span>
                                )}
                                {day.is_holiday && (
                                  <span className="text-[10px] text-teal-600 font-semibold mt-0.5">Holiday</span>
                                )}
                              </div>
                            </td>

                            {/* Status Column */}
                            <td className="py-3 px-3 align-top min-w-[130px]">
                              <div className="flex flex-col items-start gap-1">
                                <Badge variant="outline" className={`text-xs font-semibold capitalize ${getStatusBadge(day.status)}`}>
                                  {day.status_display || day.status?.replace(/_/g, " ")}
                                </Badge>
                                {day.is_leave && day.leave_type && (
                                  <span className="text-[11px] text-blue-600 font-medium">
                                    {day.leave_type}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Slot / Timetable Column */}
                            <td className="py-3 px-3 align-top min-w-[150px]">
                              {day.timetable_slot ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground text-xs">{day.timetable_slot.subject_name}</span>
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    {day.timetable_slot.slot_code} ({day.timetable_slot.start_time} - {day.timetable_slot.end_time})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>

                            {/* Check-in Column: Time, Method, Verification & Map */}
                            <td className="py-3 px-3 align-top min-w-[200px]">
                              {checkInTime ? (
                                <div className="space-y-1.5">
                                  {/* Time & Method Tag */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-foreground text-xs bg-muted/40 px-2 py-0.5 rounded border border-border/60">
                                      {formatTime(checkInTime)}
                                    </span>
                                    {checkInMethod && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-medium">
                                        {checkInMethod.toLowerCase().includes("qr") && <QrCode className="w-3 h-3 text-primary" />}
                                        {checkInMethod}
                                      </span>
                                    )}
                                  </div>

                                  {/* GPS & Location Verification */}
                                  {checkInLat && checkInLng ? (
                                    <div className="flex flex-col gap-1 text-[11px]">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                     

                                        <a 
                                          href={`https://www.google.com/maps/search/?api=1&query=${checkInLat},${checkInLng}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:underline bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/60 transition-colors"
                                        >
                                          <MapPin className="w-2.5 h-2.5" />
                                          <span>Map</span>
                                          <ExternalLink className="w-2 h-2 opacity-60" />
                                        </a>
                                      </div>
                                      <span className="font-mono text-[10px] text-muted-foreground">
                                        {checkInLat.toFixed(5)}, {checkInLng.toFixed(5)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground">No GPS data</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>

                            {/* Check-out Column: Time, Method, Verification & Map */}
                            <td className="py-3 px-3 align-top min-w-[200px]">
                              {checkOutTime ? (
                                <div className="space-y-1.5">
                                  {/* Time & Method Tag */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-foreground text-xs bg-muted/40 px-2 py-0.5 rounded border border-border/60">
                                      {formatTime(checkOutTime)}
                                    </span>
                                    {checkOutMethod && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                                        {checkOutMethod.toLowerCase().includes("qr") && <QrCode className="w-3 h-3 text-blue-600" />}
                                        {checkOutMethod}
                                      </span>
                                    )}
                                  </div>

                                  {/* GPS & Location Verification */}
                                  {checkOutLat && checkOutLng ? (
                                    <div className="flex flex-col gap-1 text-[11px]">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {checkOutVerified ? (
                                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                            Verified Loc
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded gap-1">
                                            <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                            Unverified Loc
                                          </span>
                                        )}

                                        <a 
                                          href={`https://www.google.com/maps/search/?api=1&query=${checkOutLat},${checkOutLng}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:underline bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/60 transition-colors"
                                        >
                                          <MapPin className="w-2.5 h-2.5" />
                                          <span>Map</span>
                                          <ExternalLink className="w-2 h-2 opacity-60" />
                                        </a>
                                      </div>
                                      <span className="font-mono text-[10px] text-muted-foreground">
                                        {checkOutLat.toFixed(5)}, {checkOutLng.toFixed(5)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground">No GPS recorded</span>
                                  )}
                                </div>
                              ) : day.status === "checkout_pending" ? (
                                <div className="space-y-1">
                                  <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 border-amber-300 font-semibold gap-1">
                                    <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                    Checkout Pending
                                  </Badge>
                                  <div className="text-[10px] text-muted-foreground">Currently checked in</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>

                            {/* Working Duration Column */}
                            <td className="py-3 px-3 align-top min-w-[130px]">
                              {duration ? (
                                <div className="flex flex-col">
                                  <span className="font-mono font-bold text-foreground text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded inline-flex items-center gap-1 w-fit">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    {duration}
                                  </span>
                                 
                                </div>
                              ) : day.status === "checkout_pending" || (checkInTime && !checkOutTime && !day.is_week_off && !day.is_holiday) ? (
                                <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 border-amber-300 font-medium">
                                  In Progress
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground space-y-2">
                  <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm font-medium">No day-wise attendance records found for this period.</p>
                  {(fromDate || toDate) && (
                    <Button variant="outline" size="sm" onClick={handleClearFilter} className="mt-2 text-xs">
                      Clear Date Filter
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Recent Absences */}
        <TabsContent value="absences" className="mt-0">
          <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> Recent Absences
              </h3>
              <Badge variant="secondary" className="text-xs font-semibold">
                {recent_absences?.length || 0} recorded
              </Badge>
            </div>
            <div className="p-6">
              {recent_absences?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recent_absences.map((abs: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="bg-rose-50/40 rounded-xl p-4 border border-rose-200/70 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <Badge className="bg-rose-100 text-rose-700 font-bold border-none text-xs">
                          {abs.status || "Absent"}
                        </Badge>
                        <UserX className="w-4 h-4 text-rose-400" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-foreground font-mono">
                          {abs.formatted_date || formatDate(abs.date)}
                        </span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDayName(abs.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-sm text-muted-foreground border border-dashed border-border/70 rounded-xl">
                  <UserCheck className="w-8 h-8 mx-auto text-emerald-500/50 mb-2" />
                  <p className="font-medium text-foreground">No recent absences recorded</p>
                  <p className="text-xs text-muted-foreground mt-1">Great job maintaining consistent attendance!</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
