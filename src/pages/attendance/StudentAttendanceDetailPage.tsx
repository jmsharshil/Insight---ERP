import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, BookOpen, Calendar as CalendarIcon, ShieldAlert, Clock, TrendingUp, Filter, RefreshCw } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setSelectedStudent, setSelectedStudentLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton, AttendanceDetailSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function StudentAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  
  const { selectedStudent, selectedStudentLoading } = useSelector((s: RootState) => s.attendance);

  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [filters, setFilters] = useState({
    date: "",
    start_date: "",
    end_date: "",
    status: "",
  });

  const fetchStudentDetail = (studentId: string, customFilters?: typeof filters) => {
    dispatch(setSelectedStudent(null));
    
    const params = new URLSearchParams();
    if (customFilters) {
      if (dateMode === "single") {
        if (customFilters.date) params.append("date", customFilters.date);
      } else {
        if (customFilters.start_date) params.append("start_date", customFilters.start_date);
        if (customFilters.end_date) params.append("end_date", customFilters.end_date);
      }
      if (customFilters.status) params.append("status", customFilters.status);
    }
    
    const qs = params.toString();
    const endPoint = `${API.ATTENDANCE.STUDENT_DETAIL(studentId)}${qs ? `?${qs}` : ""}`;

    dispatch({
      type: attendanceActions.GET_STUDENT_DETAIL,
      method: "GET",
      endPoint,
      auth: true,
      setLoading: (v: boolean) => dispatch(setSelectedStudentLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setSelectedStudent(res.data));
        } else {
          toast.error("Failed to load student detail.");
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to fetch student detail"),
    });
  };

  useEffect(() => {
    if (id) {
      fetchStudentDetail(id);
    }
    return () => {
      dispatch(setSelectedStudent(null));
    };
  }, [id]);

  const handleClearFilters = () => {
    const cleared = { date: "", start_date: "", end_date: "", status: "" };
    setFilters(cleared);
    if (id) {
      fetchStudentDetail(id, cleared);
    }
  };

  const pct = (v: number) => {
    if (v >= 75) return "bg-green-100 text-green-700 border-green-200";
    if (v >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "present") return "bg-green-50 text-green-700 border-green-200";
    if (s === "absent") return "bg-red-50 text-red-700 border-red-200";
    if (s === "late") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return "—";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  if (selectedStudentLoading) {
    return (
      <div className="mx-auto space-y-2">
        <Button variant="ghost" onClick={() => navigate('/attendance', { state: { tab: 'students' } })} className="h-9 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <AttendanceDetailSkeleton />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="mx-auto text-center py-20">
        <h3 className="text-lg font-semibold text-muted-foreground mb-4">No student data found</h3>
        <Button variant="outline" onClick={() => navigate('/attendance', { state: { tab: 'students' } })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="h-9 text-sm border-border hover:bg-muted"
          onClick={() => navigate('/attendance', { state: { tab: 'students' } })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students
        </Button>
      </div>

      {/* Top Banner: Profile & Overview Summary */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm flex flex-col xl:flex-row gap-8 justify-between items-start xl:items-center">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Profile Info */}
        <div className="flex items-start sm:items-center gap-6 relative z-10 w-full xl:w-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary font-bold text-2xl sm:text-3xl shadow-inner border border-primary/20 shrink-0">
            {selectedStudent.student_profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-4 flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate">{selectedStudent.student_profile.name}</h2>
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Admission No</span>
                <span className="font-mono font-medium text-foreground">{selectedStudent.student_profile.admission_number || "N/A"}</span>
              </div>
              {selectedStudent.student_profile.roll_number && (
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Roll No</span>
                  <span className="font-medium text-foreground">{selectedStudent.student_profile.roll_number}</span>
                </div>
              )}
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Branch/Batch</span>
                <span className="font-medium text-foreground truncate max-w-[200px]" title={`${selectedStudent.student_profile.branch_name}${selectedStudent.student_profile.batch_name ? ` / ${selectedStudent.student_profile.batch_name}` : ''}`}>
                  {selectedStudent.student_profile.branch_name}
                  {selectedStudent.student_profile.batch_name && ` / ${selectedStudent.student_profile.batch_name}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider for mobile/tablet */}
        <div className="w-full h-px bg-border xl:hidden relative z-10" />

        {/* Stats Section */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center w-full xl:w-auto relative z-10 bg-muted/30 p-5 sm:p-6 rounded-2xl border border-border/50">
          
          <div className="flex flex-col items-start sm:items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Overall</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl font-black text-primary tracking-tighter">
                {selectedStudent.attendance_percentage.toFixed(1)}<span className="text-2xl sm:text-3xl text-primary font-bold ml-1">%</span>
              </span>
              <Badge variant="outline" className={`border-2 text-xs font-bold px-2.5 py-1 uppercase tracking-wider ${pct(selectedStudent.attendance_percentage)}`}>
                {selectedStudent.attendance_percentage >= 75 ? 'Excellent' : selectedStudent.attendance_percentage >= 50 ? 'Average' : 'Low'}
              </Badge>
            </div>
          </div>
          
          {/* Vertical divider */}
          <div className="hidden sm:block w-px h-16 bg-border" />
          <div className="block sm:hidden w-full h-px bg-border" />

          <div className="flex gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {[
              { label: "Present", value: selectedStudent.summary.present_count || 0, color: "text-emerald-700", bg: "bg-emerald-100/50", border: "border-emerald-200" },
              { label: "Absent",  value: selectedStudent.summary.absent_count || 0,  color: "text-rose-700", bg: "bg-rose-100/50", border: "border-rose-200" },
              { label: "Late",    value: selectedStudent.summary.late_count || 0,    color: "text-amber-700", bg: "bg-amber-100/50", border: "border-amber-200" },
            ].map(item => (
              <div key={item.label} className={`${item.bg} ${item.border} rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center border-2 shadow-sm min-w-[80px] sm:min-w-[90px] transition-transform hover:scale-105`}>
                <div className={`text-2xl sm:text-3xl font-black ${item.color}`}>{item.value}</div>
                <div className={`text-[10px] sm:text-xs uppercase font-bold ${item.color} mt-1 tracking-widest`}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Filter Attendance Records</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateMode === "single" ? "secondary" : "ghost"}
              size="sm"
              className={`text-xs font-semibold h-7 px-3 ${dateMode === "single" ? "bg-muted/65 shadow-sm" : ""}`}
              onClick={() => {
                setDateMode("single");
                setFilters(prev => ({ ...prev, start_date: "", end_date: "" }));
              }}
            >
              Exact Date
            </Button>
            <Button
              variant={dateMode === "range" ? "secondary" : "ghost"}
              size="sm"
              className={`text-xs font-semibold h-7 px-3 ${dateMode === "range" ? "bg-muted/65 shadow-sm" : ""}`}
              onClick={() => {
                setDateMode("range");
                setFilters(prev => ({ ...prev, date: "" }));
              }}
            >
              Date Range
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          {dateMode === "single" ? (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Date</span>
              <Input
                type="date"
                className="h-9 text-xs w-44"
                value={filters.date}
                onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</span>
                <Input
                  type="date"
                  className="h-9 text-xs w-44"
                  value={filters.start_date}
                  onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">End Date</span>
                <Input
                  type="date"
                  className="h-9 text-xs w-44"
                  value={filters.end_date}
                  onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
            <Select
              value={filters.status}
              onValueChange={v => setFilters(prev => ({ ...prev, status: v === "all" ? "" : v }))}
            >
              <SelectTrigger className="h-9 text-xs w-36 bg-muted/10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4"
              onClick={() => fetchStudentDetail(id!, filters)}
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              className="h-9 text-xs border-border"
              onClick={handleClearFilters}
            >
              <RefreshCw className="w-3 h-3 mr-1.5" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Full width tabs */}
      <Tabs defaultValue="day_wise" className="w-full space-y-6">
        <TabsList className="w-full flex justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
          <TabsTrigger value="day_wise" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">
            Day-wise Records
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">
            Entry & Exit History
          </TabsTrigger>
          <TabsTrigger value="violations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">
            Violations
          </TabsTrigger>
          <TabsTrigger value="recent_absences" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">
            Recent Absences
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="day_wise" className="mt-0">
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Day-wise Attendance Records
              </h3>
              <span className="text-sm text-muted-foreground font-medium">
                Showing {selectedStudent.day_wise_attendance?.length || 0} records
              </span>
            </div>
            <div className="p-4">
              {selectedStudent.day_wise_attendance && selectedStudent.day_wise_attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left font-semibold text-muted-foreground pb-2">
                        <th className="pb-3 px-2">Date</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2">Subject / Slot</th>
                        <th className="pb-3 px-2">Check-in Time</th>
                        <th className="pb-3 px-2">Check-out Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.day_wise_attendance.map((day, idx) => {
                        const checkIn = selectedStudent.check_in_history?.find((e) => e.id === day.id);
                        const checkOut = selectedStudent.check_out_history?.find((e) => e.id === day.id);
                        return (
                          <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                            <td className="py-3 px-2 font-medium font-mono">{formatDate(day.date)}</td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className={`text-xs font-semibold capitalize ${getStatusBadge(day.status)}`}>
                                {day.status_display || day.status.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              {day.timetable_slot ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{day.timetable_slot.subject_name}</span>
                                  <span className="text-xs text-muted-foreground font-mono">{day.timetable_slot.slot_code} ({day.timetable_slot.start_time} - {day.timetable_slot.end_time})</span>
                                </div>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground font-mono font-medium">
                              {day.checked_in_at ? formatTime(day.checked_in_at) : (checkIn ? formatTime(checkIn.check_in_time || checkIn.time) : "—")}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground font-mono font-medium">
                              {day.checked_out_at ? formatTime(day.checked_out_at) : (checkOut ? formatTime(checkOut.check_out_time || checkOut.time) : "—")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No day-wise attendance records found for the selected filter criteria.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-green-600" /> Check-in History
              </h3>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {selectedStudent.check_in_history?.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudent.check_in_history.map((entry, idx) => (
                    <div key={`in-${idx}`} className="flex justify-between items-center text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{formatDate(entry.date)}</div>
                        {entry.timetable_slot && (
                          <div className="text-xs text-muted-foreground">{entry.timetable_slot.subject_name} ({entry.timetable_slot.start_time} - {entry.timetable_slot.end_time})</div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-mono font-bold">
                        {formatTime(entry.check_in_time || entry.time)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground">No check-in history found.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" /> Check-out History
              </h3>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {selectedStudent.check_out_history?.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudent.check_out_history.map((exit, idx) => (
                    <div key={`out-${idx}`} className="flex justify-between items-center text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{formatDate(exit.date)}</div>
                        {exit.timetable_slot && (
                          <div className="text-xs text-muted-foreground">{exit.timetable_slot.subject_name} ({exit.timetable_slot.start_time} - {exit.timetable_slot.end_time})</div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono font-bold">
                        {formatTime(exit.check_out_time || exit.time)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground">No check-out history found.</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="violations" className="mt-0">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Active Violations
              </h3>
            </div>
            <div className="p-4">
              {selectedStudent.violations?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedStudent.violations.map((v, idx) => (
                    <div key={idx} className={`rounded-xl p-4 border flex flex-col gap-2 ${v.is_resolved ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                      <div className="flex justify-between items-start">
                        <Badge className={`${v.is_resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} capitalize font-semibold`}>
                          {v.violation_type?.replace(/_/g, " ") || v.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">{formatDate(v.date)}</span>
                      </div>
                      <p className="text-sm text-foreground font-medium flex-1 mt-1">{v.description || "Unauthorized attendance event."}</p>
                      
                      <div className="mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center">
                         <span>Created: {formatDate(v.created_at)}</span>
                         {v.is_resolved && v.resolution_details && (
                           <span className="text-green-600 font-medium">Resolved by {v.resolution_details.resolved_by}</span>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl">
                  No violations found for this student.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recent_absences" className="mt-0">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Recent Absences
              </h3>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {(selectedStudent?.recent_absences?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {selectedStudent?.recent_absences?.map((absence: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="font-medium text-foreground">{absence.formatted_date || formatDate(absence.date)}</div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 capitalize font-semibold">
                        {absence.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl">
                  No recent absences found.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-6">
          {/* Attendance Monthly Trend */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Attendance Monthly Trend
            </h3>
            {selectedStudent.monthly_trend?.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={selectedStudent.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                    <Line type="monotone" dataKey="percentage" stroke="#F7A900" strokeWidth={3} dot={{ fill: "#F7A900", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                No monthly trend data available.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject-wise Analytics */}
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Subject-wise Attendance
              </h3>
              {selectedStudent.subject_wise_attendance?.length > 0 ? (
                <div className="space-y-5">
                  {selectedStudent.subject_wise_attendance.map((sub) => (
                    <div key={sub.subject_id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-foreground truncate max-w-[200px]">{sub.subject_name}</span>
                        <span className="font-mono font-bold text-muted-foreground">{sub.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-green-500' : sub.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No subject-wise records found.
                </div>
              )}
            </div>

            {/* Session-wise Attendance */}
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Session-wise Attendance
              </h3>
              {selectedStudent.session_wise_attendance?.length > 0 ? (
                <div className="space-y-5">
                  {selectedStudent.session_wise_attendance.map((sess, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-foreground capitalize">{sess.session_name || sess.session}</span>
                        <span className="font-mono font-bold text-muted-foreground">{sess.percentage?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sess.percentage >= 75 ? 'bg-primary' : 'bg-primary/50'}`}
                          style={{ width: `${sess.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No session-wise records found.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
