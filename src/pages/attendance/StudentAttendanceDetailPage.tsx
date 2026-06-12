import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, BookOpen, Calendar, ShieldAlert, Clock, TrendingUp } from "lucide-react";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import {
  setSelectedStudent, setSelectedStudentLoading,
} from "@/redux/slices/attendanceSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function StudentAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  
  const { selectedStudent, selectedStudentLoading } = useSelector((s: RootState) => s.attendance);

  const fetchStudentDetail = (studentId: string) => {
    dispatch(setSelectedStudent(null));
    dispatch({
      type: attendanceActions.GET_STUDENT_DETAIL,
      method: "GET",
      endPoint: API.ATTENDANCE.STUDENT_DETAIL(studentId),
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

  const pct = (v: number) => {
    if (v >= 75) return "bg-green-100 text-green-700 border-green-200";
    if (v >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  if (selectedStudentLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="h-9 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <TableSkeleton columns={2} rows={5} className="mt-4" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="container mx-auto p-6 text-center py-20">
        <h3 className="text-lg font-semibold text-muted-foreground mb-4">No student data found</h3>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="h-9 text-sm border-border hover:bg-muted"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students
        </Button>
        <div className="text-sm text-muted-foreground">
          Student ID: <span className="font-mono text-xs font-medium text-foreground">{selectedStudent.student_profile.id}</span>
        </div>
      </div>

      {/* Layout: Main Panel & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Profile Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-border p-6 text-center relative overflow-hidden shadow-sm">
            
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mb-4 shadow-sm border border-primary/20">
              {selectedStudent.student_profile.name.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{selectedStudent.student_profile.name}</h2>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              {selectedStudent.student_profile.roll_number ? `Roll: ${selectedStudent.student_profile.roll_number}` : 'No Roll Number'}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-muted/30 rounded-lg p-3.5 mb-6">
              <div>
                <span className="text-muted-foreground block mb-0.5">Admission No</span>
                <span className="font-semibold text-foreground font-mono">{selectedStudent.student_profile.admission_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Branch / Batch</span>
                <span className="font-semibold text-foreground truncate block max-w-full font-medium">
                  {selectedStudent.student_profile.branch_name} {selectedStudent.student_profile.batch_name ? `/ ${selectedStudent.student_profile.batch_name}` : ''}
                </span>
              </div>
            </div>

            <div className="border border-border/60 rounded-xl p-4 bg-gradient-to-b from-muted/10 to-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Overall Attendance</span>
              <div className="text-4xl font-extrabold text-primary mb-1">
                {selectedStudent.attendance_percentage.toFixed(1)}%
              </div>
              <Badge className={`text-xs font-semibold px-2.5 py-0.5 ${pct(selectedStudent.attendance_percentage)}`}>
                {selectedStudent.attendance_percentage >= 75 ? 'Excellent' : selectedStudent.attendance_percentage >= 50 ? 'Average' : 'Low Attendance'}
              </Badge>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-foreground">Attendance Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Present", value: selectedStudent.summary.present_count, color: "text-green-600", bg: "bg-green-50" },
                { label: "Absent",  value: selectedStudent.summary.absent_count,  color: "text-red-600", bg: "bg-red-50" },
                { label: "Late",    value: selectedStudent.summary.late_count,    color: "text-yellow-600", bg: "bg-yellow-50" },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-lg p-3 text-center border border-border/40`}>
                  <div className={`text-2xl font-extrabold ${item.color}`}>{item.value}</div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Analytics, Charts and History Lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Attendance Monthly Trend
            </h3>
            {selectedStudent.monthly_trend?.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selectedStudent.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Subject-wise Analytics
              </h3>
              {selectedStudent.subject_wise_attendance?.length > 0 ? (
                <div className="space-y-4">
                  {selectedStudent.subject_wise_attendance.map((sub: any) => (
                    <div key={sub.subject_id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[160px]">{sub.subject_name}</span>
                        <span className="font-mono text-muted-foreground">{sub.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-green-500' : sub.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No subject-wise records found.
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Session-wise Attendance
              </h3>
              {selectedStudent.session_wise_attendance?.length > 0 ? (
                <div className="space-y-4">
                  {selectedStudent.session_wise_attendance.map((sess: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground capitalize">{sess.session_name || sess.session}</span>
                        <span className="font-mono text-muted-foreground">{sess.percentage?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${sess.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No session-wise records found.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Entry & Exit History
              </h3>
              {selectedStudent.check_in_history?.length > 0 || selectedStudent.check_out_history?.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedStudent.check_in_history?.map((entry: any, idx: number) => (
                    <div key={`in-${idx}`} className="flex justify-between items-center text-xs border-b border-border/40 pb-2">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{entry.date || "Today"}</div>
                        <div className="text-[10px] text-muted-foreground">Check-in</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 font-mono">
                        {entry.check_in_time || entry.time || "—"}
                      </Badge>
                    </div>
                  ))}
                  {selectedStudent.check_out_history?.map((exit: any, idx: number) => (
                    <div key={`out-${idx}`} className="flex justify-between items-center text-xs border-b border-border/40 pb-2">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{exit.date || "Today"}</div>
                        <div className="text-[10px] text-muted-foreground">Check-out</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-mono">
                        {exit.check_out_time || exit.time || "—"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No check-in or check-out history.
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Active Violations
              </h3>
              {selectedStudent.violations?.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedStudent.violations.map((v: any, idx: number) => (
                    <div key={idx} className="bg-red-50/50 rounded-lg p-3 border border-red-100 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <Badge className="bg-red-100 text-red-700 text-[10px] capitalize font-medium">{v.violation_type || v.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{v.date}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">{v.description || "Unauthorized attendance event."}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg">
                  No violations found for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
