import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { attendanceActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function StudentPersonalHistoryTab({ dropdowns }: { dropdowns?: any }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

  const [f, setF] = useState({
    date: "",
    status: "",
    student_id: user?.linked_students?.[0] || user?.id || "",
  });

  const fetchHistory = () => {
    const studentId = f.student_id;
    if (!studentId) return;

    setLoading(true);
    const params = new URLSearchParams();
    if (f.date) params.append("date", f.date);
    if (f.status && f.status !== "all") params.append("status", f.status);

    const qs = params.toString();
    const endPoint = `${API.ATTENDANCE.STUDENT_DETAIL(studentId)}${qs ? `?${qs}` : ""}`;

    dispatch({
      type: attendanceActions.GET_STUDENT_DETAIL,
      method: "GET",
      endPoint,
      auth: true,
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          setStudentData(res.data);
        } else {
          toast.error("Failed to load history.");
        }
        setLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to fetch history");
        setLoading(false);
      },
    } as any);
  };

  useEffect(() => {
    fetchHistory();
  }, [f.student_id]);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "present") return "bg-green-50 text-green-700 border-green-200";
    if (s === "absent") return "bg-red-50 text-red-700 border-red-200";
    if (s === "late") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const clear = () => setF((prev) => ({ ...prev, date: "", status: "" }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {user?.linked_students && user.linked_students.length > 1 && (
            <Select
              value={f.student_id}
              onValueChange={(v) => setF((p) => ({ ...p, student_id: v }))}
            >
              <SelectTrigger className="h-9 text-sm w-48 bg-muted/10">
                <SelectValue placeholder="Select Student" />
              </SelectTrigger>
              <SelectContent>
                {user.linked_students.map((id: string) => {
                  const studentInfo = dropdowns?.students?.find((s: any) => s.id === id);
                  const name = studentInfo ? studentInfo.name : `Student (${id.substring(0, 6)})`;
                  return (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <Input
            type="date"
            className="h-9 text-sm w-40"
            value={f.date}
            onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))}
          />
          <Select
            value={f.status}
            onValueChange={(v) => setF((p) => ({ ...p, status: v === "all" ? "" : v }))}
          >
            <SelectTrigger className="h-9 text-sm w-36 bg-muted/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="half_day">Half Day</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchHistory}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
          >
            Apply
          </Button>
          <Button variant="outline" className="h-9 text-sm" onClick={clear}>
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton columns={4} rows={8} className="mt-0" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/10 flex justify-between items-center">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" /> Attendance History
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              Showing {studentData?.day_wise_attendance?.length || 0} records
            </span>
          </div>
          <div className="p-0">
            {studentData?.day_wise_attendance && studentData.day_wise_attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr className="text-left font-medium text-muted-foreground">
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Check-in Time</th>
                      <th className="px-6 py-3 font-semibold">Check-out Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentData.day_wise_attendance.map((day: any, idx: number) => {
                      const checkIn = studentData.check_in_history?.find((e: any) => e.date === day.date);
                      const checkOut = studentData.check_out_history?.find((e: any) => e.date === day.date);
                      return (
                        <motion.tr 
                          key={idx} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: idx * 0.02 }}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-6 py-3 font-medium font-mono">{formatDate(day.date)}</td>
                          <td className="px-6 py-3">
                            <Badge variant="outline" className={`text-xs font-semibold capitalize ${getStatusBadge(day.status)}`}>
                              {day.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground font-mono">
                            {checkIn ? (checkIn.check_in_time || checkIn.time || "—") : "—"}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground font-mono">
                            {checkOut ? (checkOut.check_out_time || checkOut.time || "—") : "—"}
                          </td>
                        </motion.tr>
                      ); 
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No attendance records found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
