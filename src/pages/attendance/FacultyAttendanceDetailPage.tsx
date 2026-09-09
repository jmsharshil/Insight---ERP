import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CalendarIcon, TrendingUp, ShieldAlert, MapPin } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setSelectedFaculty, setSelectedFacultyLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton, AttendanceDetailSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function FacultyAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  
  const { selectedFaculty, selectedFacultyLoading } = useSelector((s: RootState) => s.attendance);

  const fetchFacultyDetail = (facultyId: string) => {
    dispatch(setSelectedFaculty(null));
    dispatch({
      type: attendanceActions.GET_FACULTY_DETAIL,
      method: "GET",
      endPoint: API.ATTENDANCE.FACULTY_DETAIL(facultyId),
      auth: true,
      setLoading: (v: boolean) => dispatch(setSelectedFacultyLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setSelectedFaculty(res.data));
        } else {
          toast.error("Failed to load faculty detail.");
        }
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to fetch faculty detail"),
    });
  };

  useEffect(() => {
    if (id) {
      fetchFacultyDetail(id);
    }
    return () => {
      dispatch(setSelectedFaculty(null));
    };
  }, [id]);

  const pct = (v: number) => {
    if (v >= 75) return "bg-green-100 text-green-700 border-green-200";
    if (v >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "present") return "bg-green-50 text-green-700 border-green-200";
    if (s === "absent") return "bg-red-50 text-red-700 border-red-200";
    if (s === "leave") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
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
      return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (selectedFacultyLoading) {
    return (
      <div className="mx-auto space-y-2">
        <Button variant="ghost" onClick={() => navigate('/attendance', { state: { tab: 'faculty' } })} className="h-9 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
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
    day_wise_attendance, 
    recent_absences,
    check_in_history, 
    check_out_history,
    monthly_trend 
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

      {/* Top Banner: Profile & Overview Summary */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm flex flex-col xl:flex-row gap-8 justify-between items-start xl:items-center">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Profile Info */}
        <div className="flex items-start sm:items-center gap-6 relative z-10 w-full xl:w-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary font-bold text-2xl sm:text-3xl shadow-inner border border-primary/20 shrink-0">
            {faculty.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-4 flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate">{faculty.name}</h2>
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Employee ID</span>
                <span className="font-mono font-medium text-foreground">{faculty.employee_id || "N/A"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Role</span>
                <span className="font-medium text-foreground capitalize">{faculty.role?.replace(/_/g, ' ') || "N/A"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Branch</span>
                <span className="font-medium text-foreground truncate max-w-[150px]" title={faculty.branch_name || "N/A"}>{faculty.branch_name || "N/A"}</span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email</span>
                <span className="font-medium text-foreground" title={faculty.email}>{faculty.email}</span>
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
                {(attendance_percentage || 0).toFixed(1)}<span className="text-2xl sm:text-3xl text-primary font-bold ml-1">%</span>
              </span>
              <Badge variant="outline" className={`border-2 text-xs font-bold px-2.5 py-1 uppercase tracking-wider ${pct(attendance_percentage || 0)}`}>
                {attendance_percentage >= 75 ? 'Excellent' : attendance_percentage >= 50 ? 'Average' : 'Low'}
              </Badge>
            </div>
          </div>
          
          {/* Vertical divider */}
          <div className="hidden sm:block w-px h-16 bg-border" />
          <div className="block sm:hidden w-full h-px bg-border" />

          <div className="flex gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {[
              { label: "Present", value: summary?.present_count || 0, color: "text-emerald-700", bg: "bg-emerald-100/50", border: "border-emerald-200" },
              { label: "Absent",  value: summary?.absent_count || 0,  color: "text-rose-700", bg: "bg-rose-100/50", border: "border-rose-200" },
              { label: "Late",    value: summary?.late_count || 0,    color: "text-amber-700", bg: "bg-amber-100/50", border: "border-amber-200" },
            ].map(item => (
              <div key={item.label} className={`${item.bg} ${item.border} rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center border-2 shadow-sm min-w-[80px] sm:min-w-[90px] transition-transform hover:scale-105`}>
                <div className={`text-2xl sm:text-3xl font-black ${item.color}`}>{item.value}</div>
                <div className={`text-[10px] sm:text-xs uppercase font-bold ${item.color} mt-1 tracking-widest`}>{item.label}</div>
              </div>
            ))}
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
          <TabsTrigger value="absences" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3">
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
                Showing {day_wise_attendance?.length || 0} records
              </span>
            </div>
            <div className="p-4">
              {day_wise_attendance && day_wise_attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left font-semibold text-muted-foreground pb-2">
                        <th className="pb-3 px-2">Date</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2">Subject / Slot</th>
                        <th className="pb-3 px-2">Check-in Time</th>
                        <th className="pb-3 px-2">Check-out Time</th>
                        <th className="pb-3 px-2">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day_wise_attendance.map((day: any, idx: number) => {
                        const checkIn = check_in_history?.find((e: any) => e.id === day.id);
                        const checkOut = check_out_history?.find((e: any) => e.id === day.id);
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
                              {day.checked_in_at ? formatTime(day.checked_in_at) : (checkIn ? formatTime(checkIn.time || checkIn.check_in_time) : "—")}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground font-mono font-medium">
                              {day.checked_out_at ? formatTime(day.checked_out_at) : (checkOut ? formatTime(checkOut.time || checkOut.check_out_time) : "—")}
                            </td>
                            <td className="py-3 px-2">
                              {day.location_details ? (
                                <div className="flex flex-col gap-1.5 items-start">
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${day.location_details.latitude},${day.location_details.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-1 rounded-md transition-colors"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">View on Map</span>
                                  </a>
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 min-h-0 ${day.location_details.location_verified ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                                    {day.location_details.location_verified ? 'Verified Location' : 'Unverified Location'}
                                  </Badge>
                                </div>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No day-wise attendance records found.
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
              {check_in_history?.length > 0 ? (
                <div className="space-y-3">
                  {check_in_history.map((entry: any, idx: number) => (
                    <div key={`in-${idx}`} className="flex justify-between items-center text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{formatDate(entry.date)}</div>
                        {entry.timetable_slot && (
                          <div className="text-xs text-muted-foreground">{entry.timetable_slot.subject_name} ({entry.timetable_slot.start_time} - {entry.timetable_slot.end_time})</div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-mono font-bold">
                        {formatTime(entry.time || entry.check_in_time)}
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
              {check_out_history?.length > 0 ? (
                <div className="space-y-3">
                  {check_out_history.map((exit: any, idx: number) => (
                    <div key={`out-${idx}`} className="flex justify-between items-center text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{formatDate(exit.date)}</div>
                        {exit.timetable_slot && (
                          <div className="text-xs text-muted-foreground">{exit.timetable_slot.subject_name} ({exit.timetable_slot.start_time} - {exit.timetable_slot.end_time})</div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono font-bold">
                        {formatTime(exit.time || exit.check_out_time)}
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

        <TabsContent value="absences" className="mt-0">
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Recent Absences
              </h3>
            </div>
            <div className="p-4">
              {recent_absences?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recent_absences.map((abs: any, idx: number) => (
                    <div key={idx} className="bg-red-50/50 rounded-xl p-4 border border-red-100 flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-2">
                        <Badge className="bg-red-100 text-red-700 font-semibold border-none">Absent</Badge>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatDate(abs.formatted_date || abs.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/50 rounded-xl">
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
            {monthly_trend?.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
