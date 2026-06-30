import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Calendar, Clock, TrendingUp, Briefcase, Mail, Shield, User, FileText } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setSelectedFaculty, setSelectedFacultyLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function FacultyAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  
  const { selectedFaculty, selectedFacultyLoading } = useSelector((s: RootState) => s.attendance);
  const [activeTab, setActiveTab] = useState<"history" | "checkin" | "checkout">("history");

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
      // If it looks like a ISO timestamp
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
      <div className="mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="h-9 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <TableSkeleton columns={2} rows={5} className="mt-4" />
      </div>
    );
  }

  if (!selectedFaculty) {
    return (
      <div className="container mx-auto p-6 text-center py-20">
        <h3 className="text-lg font-semibold text-muted-foreground mb-4">No faculty data found</h3>
        <Button variant="outline" onClick={() => navigate(-1)}>
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
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Faculty
        </Button>
      </div>

      {/* Layout: Main Panel & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Profile Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-border p-6 text-center relative overflow-hidden shadow-sm">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mb-4 shadow-sm border border-primary/20">
              {faculty.name.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{faculty.name}</h2>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              {faculty.employee_id ? `Employee ID: ${faculty.employee_id}` : 'No Employee ID'}
            </p>
            
            <div className="text-left text-xs bg-muted/30 rounded-lg p-3.5 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground truncate">{faculty.email}</span>
              </div>
            </div>

            <div className="border border-border/60 rounded-xl p-4 bg-gradient-to-b from-muted/10 to-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Overall Attendance</span>
              <div className="text-4xl font-extrabold text-primary mb-1">
                {attendance_percentage?.toFixed(1) || 0}%
              </div>
              <Badge className={`text-xs font-semibold px-2.5 py-0.5 ${pct(attendance_percentage || 0)}`}>
                {attendance_percentage >= 75 ? 'Excellent' : attendance_percentage >= 50 ? 'Average' : 'Low Attendance'}
              </Badge>
            </div>
          </div>

          {/* Attendance Stats Cards */}
          <div className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-foreground">Attendance Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Present", value: summary.present_count || 0, color: "text-green-600", bg: "bg-green-50" },
                { label: "Absent",  value: summary.absent_count || 0,  color: "text-red-600", bg: "bg-red-50" },
                { label: "Late",    value: summary.late_count || 0,    color: "text-yellow-600", bg: "bg-yellow-50" },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-lg p-3 text-center border border-border/40`}>
                  <div className={`text-2xl font-extrabold ${item.color}`}>{item.value}</div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
            
            {recent_absences?.length > 0 && (
              <div className="mt-4 border-t border-border/40 pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Absences</h4>
                <div className="space-y-2">
                  {recent_absences.map((abs: any, idx: number) => (
                    <div key={idx} className="bg-red-50/50 rounded-lg p-2.5 flex items-center justify-between border border-red-100">
                      <span className="text-xs font-medium text-red-900">{abs.formatted_date || abs.date}</span>
                      <Badge className="text-[10px] bg-red-100 text-red-700 hover:bg-red-200 border-none">Absent</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Analytics, Charts and History Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Attendance Monthly Trend
            </h3>
            {monthly_trend?.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                    <Line type="monotone" dataKey="percentage" stroke="#F7A900" strokeWidth={2.5} dot={{ fill: "#F7A900", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                No monthly trend data available.
              </div>
            )}
          </div>

          {/* Logs Tabs */}
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="border-b border-border bg-muted/20 px-4 py-2 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "history" ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs font-semibold ${activeTab === "history" ? "bg-white shadow-sm border border-border/40" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  Daily History ({day_wise_attendance?.length || 0})
                </Button>
                <Button
                  variant={activeTab === "checkin" ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs font-semibold ${activeTab === "checkin" ? "bg-white shadow-sm border border-border/40" : ""}`}
                  onClick={() => setActiveTab("checkin")}
                >
                  Check-in Logs ({check_in_history?.length || 0})
                </Button>
                <Button
                  variant={activeTab === "checkout" ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs font-semibold ${activeTab === "checkout" ? "bg-white shadow-sm border border-border/40" : ""}`}
                  onClick={() => setActiveTab("checkout")}
                >
                  Check-out Logs ({check_out_history?.length || 0})
                </Button>
              </div>
            </div>

            <div className="p-4 min-h-64 max-h-[400px] overflow-y-auto">
              {activeTab === "history" && (
                <div className="space-y-2">
                  {day_wise_attendance && day_wise_attendance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-left font-medium text-muted-foreground pb-2">
                            <th className="pb-2 font-semibold">Date</th>
                            <th className="pb-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day_wise_attendance.map((h: any, idx: number) => (
                            <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                              <td className="py-2.5 font-medium font-mono">{formatDate(h.date)}</td>
                              <td className="py-2.5">
                                <Badge variant="outline" className={`text-[10px] font-semibold ${getStatusBadge(h.status)}`}>
                                  {h.status || "—"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      No daily attendance history found.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "checkin" && (
                <div className="space-y-2">
                  {check_in_history && check_in_history.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-left font-medium text-muted-foreground pb-2">
                            <th className="pb-2 font-semibold">Time</th>
                            <th className="pb-2 font-semibold">Date</th>
                            <th className="pb-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {check_in_history.map((log: any, idx: number) => (
                            <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                              <td className="py-2.5 font-semibold font-mono text-primary">{formatTime(log.time)}</td>
                              <td className="py-2.5 font-mono text-muted-foreground">{formatDate(log.date)}</td>
                              <td className="py-2.5">
                                <Badge className="text-[9px] bg-green-50 text-green-700 border-green-200 border capitalize">
                                  {log.status || "success"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      No check-in logs found.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "checkout" && (
                <div className="space-y-2">
                  {check_out_history && check_out_history.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-left font-medium text-muted-foreground pb-2">
                            <th className="pb-2 font-semibold">Time</th>
                            <th className="pb-2 font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {check_out_history.map((log: any, idx: number) => (
                            <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                              <td className="py-2.5 font-semibold font-mono text-blue-600">{formatTime(log.time)}</td>
                              <td className="py-2.5 font-mono text-muted-foreground">{formatDate(log.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      No check-out logs found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
