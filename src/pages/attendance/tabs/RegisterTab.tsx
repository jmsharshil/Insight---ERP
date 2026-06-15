import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { API } from "@/service/api";
import { dropdownActions } from "@/redux/actions";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Clock, CalendarDays, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  present: { label: "Present", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  absent: { label: "Absent", className: "bg-red-50 text-red-700 border-red-200" },
  late: { label: "Late", className: "bg-amber-50 text-amber-700 border-amber-200" },
  half_day: { label: "Half Day", className: "bg-blue-50 text-blue-700 border-blue-200" },
  on_leave: { label: "On Leave", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

interface RegisterTabProps {
  dropdowns?: any;
}

export default function RegisterTab({ dropdowns }: RegisterTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();

  const branches = dropdowns?.branches || [];
  const batches = dropdowns?.batches || [];

  const [branchId, setBranchId] = useState("all");
  const [batchId, setBatchId] = useState("all");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const [records, setRecords] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isAllFilter = !branchId || branchId === "all" || !batchId || batchId === "all";

  useEffect(() => {
    setLoadingStudents(true);
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: API.ATTENDANCE.REGISTER_ALL({
        branch_id: branchId,
        batch_id: batchId,
      }),
      auth: true,
      getResponse: (res: any) => {
        const list = res?.data?.register || res?.register || res?.data?.data?.register;
        if (Array.isArray(list)) {
          const formattedList = list.map((item: any) => ({
            id: item.student_id,
            name: item.student_name || "Unknown",
            roll_number: item.roll_number,
            admission_number: item.admission_number,
            photo: item.photo,
            branch_name: item.branch_name || "—",
            batch_name: item.batch_name || "—",
            attendance: item.attendance || {}
          }));
          setStudents(formattedList);
          
          const initRecords: Record<string, string> = {};
          formattedList.forEach(s => {
            initRecords[s.id] = s.attendance[date]?.status || "present";
          });
          setRecords(initRecords);
        } else {
          setStudents([]);
          setRecords({});
        }
        setLoadingStudents(false);
      },
      getError: () => {
        toast.error("Failed to fetch register data.");
        setLoadingStudents(false);
        setStudents([]);
        setRecords({});
      }
    } as any);
  }, [branchId, batchId, dispatch, toast]);

  useEffect(() => {
    // If the date changes, update the records based on existing attendance for that date
    if (students.length > 0) {
      const initRecords: Record<string, string> = {};
      students.forEach(s => {
        initRecords[s.id] = s.attendance[date]?.status || "present";
      });
      setRecords(initRecords);
    }
  }, [date]);

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: string) => {
    const updated: Record<string, string> = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setRecords(updated);
  };

  const handleSubmit = () => {
    if (isAllFilter) {
      toast.error("Please select a specific branch and batch to mark attendance.");
      return;
    }

    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    const payloadRecords = Object.keys(records).map(student_id => ({
      student_id,
      status: records[student_id]
    }));

    if (payloadRecords.length === 0) {
      toast.error("No students to mark attendance for.");
      return;
    }

    setSubmitting(true);
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "POST",
      endPoint: "/api/v1/attendance/",
      body: {
        batch_id: batchId,
        branch_id: branchId,
        date: date,
        records: payloadRecords
      },
      auth: true,
      getResponse: (res: any) => {
        toast.success(res?.message || "Attendance marked successfully!");
        setSubmitting(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to mark attendance.");
        setSubmitting(false);
      }
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full bg-muted/10">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b: any) => (
                  <SelectItem key={b.id} value={b.id?.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="w-full bg-muted/10">
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches?.map((b: any) => (
                  <SelectItem key={b.id} value={b.id?.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loadingStudents ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading register...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm bg-white rounded-xl border border-border">
          No attendance records found for the selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <div>
              <h3 className="font-semibold text-foreground">Students List</h3>
              {isAllFilter && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Viewing register (select a specific branch and batch to mark attendance)
                </p>
              )}
            </div>
            {!isAllFilter && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => handleMarkAll("present")}
                >
                  Mark All Present
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleMarkAll("absent")}
                >
                  Mark All Absent
                </Button>
              </div>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Batch</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Admission No
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Attendance Status
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={s.photo ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(s.name || "S").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                    {s.branch_name}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                    {s.batch_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {s.admission_number || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {isAllFilter ? (
                      STATUS_BADGES[records[s.id]] ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGES[records[s.id]].className}`}
                        >
                          {STATUS_BADGES[records[s.id]].label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-200">
                          Not Marked
                        </span>
                      )
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={records[s.id] === "present" ? "default" : "outline"}
                          className={`h-8 px-3 text-xs ${records[s.id] === "present" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                          onClick={() => handleStatusChange(s.id, "present")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Present
                        </Button>
                        <Button
                          size="sm"
                          variant={records[s.id] === "absent" ? "default" : "outline"}
                          className={`h-8 px-3 text-xs ${records[s.id] === "absent" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                          onClick={() => handleStatusChange(s.id, "absent")}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={records[s.id] === "late" ? "default" : "outline"}
                          className={`h-8 px-3 text-xs ${records[s.id] === "late" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}`}
                          onClick={() => handleStatusChange(s.id, "late")}
                        >
                          <Clock className="w-3.5 h-3.5 mr-1" /> Late
                        </Button>
                        <Button
                          size="sm"
                          variant={records[s.id] === "half_day" ? "default" : "outline"}
                          className={`h-8 px-3 text-xs ${records[s.id] === "half_day" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                          onClick={() => handleStatusChange(s.id, "half_day")}
                        >
                          <HelpCircle className="w-3.5 h-3.5 mr-1" /> Half Day
                        </Button>
                        <Button
                          size="sm"
                          variant={records[s.id] === "on_leave" ? "default" : "outline"}
                          className={`h-8 px-3 text-xs ${records[s.id] === "on_leave" ? "bg-gray-600 hover:bg-gray-700 text-white" : ""}`}
                          onClick={() => handleStatusChange(s.id, "on_leave")}
                        >
                          <CalendarDays className="w-3.5 h-3.5 mr-1" /> On Leave
                        </Button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!isAllFilter && (
          <div className="p-4 border-t border-border flex justify-end bg-muted/10">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-white font-medium"
            >
              {submitting ? "Submitting..." : "Submit Attendance"}
            </Button>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
