import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Search, Clock } from "lucide-react";
import { timetableActions } from "@/redux/actions";
import { API } from "@/service/api";
import { setFacultyTimetable, setFacultyTimetableLoading, setStudentTimetable, setStudentTimetableLoading } from "@/redux/slices/timetableNewSlice";
import type { RootState, AppDispatch } from "@/store";
import { useToast } from "@/hooks/useToast";
import { TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SESSION_BADGE: Record<string, string> = {
  regular:    "bg-blue-100 text-blue-700",
  class_test: "bg-yellow-100 text-yellow-700",
  prelim:     "bg-purple-100 text-purple-700",
  practice:   "bg-green-100 text-green-700",
  custom:     "bg-gray-100 text-gray-700",
};

function WeekGrid({ data }: { data: Record<string, any[]> }) {
  const days = DAYS_ORDER.filter(d => data[d]?.length > 0);
  if (days.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No slots found for this person.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {days.map(day => (
        <motion.div key={day} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{day}</span>
            <span className="ml-2 text-xs text-muted-foreground">{data[day]?.length} slot(s)</span>
          </div>
          <div className="divide-y divide-border/50">
            {(data[day] || []).map((slot: any) => (
              <div key={slot.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {slot.subject_name || "No subject"}
                  </span>
                  <Badge className={`text-xs shrink-0 ${SESSION_BADGE[slot.session_type] ?? "bg-gray-100 text-gray-700"}`}>
                    {slot.session_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}
                  {slot.slot_code && <span className="ml-1 font-mono bg-muted px-1 rounded text-[10px]">{slot.slot_code}</span>}
                </div>
                {slot.faculty_name && <div className="text-xs text-muted-foreground">{slot.faculty_name}</div>}
                {slot.classroom_name && <div className="text-xs text-muted-foreground">{slot.classroom_name}</div>}
                {slot.batch_name && <div className="text-xs text-muted-foreground">{slot.batch_name}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function PersonalTimetableTab() {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { facultyTimetable, facultyTimetableLoading, studentTimetable, studentTimetableLoading } = useSelector((s: RootState) => s.timetableNew);

  const [facultyId, setFacultyId] = useState("");
  const [studentId, setStudentId] = useState("");

  const fetchFaculty = () => {
    if (!facultyId.trim()) { toast.error("Please enter a Faculty UUID."); return; }
    dispatch({
      type: timetableActions.GET_FACULTY_VIEW,
      method: "GET",
      endPoint: API.TIMETABLE.FACULTY_VIEW(facultyId.trim()),
      auth: true,
      setLoading: (v: boolean) => dispatch(setFacultyTimetableLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setFacultyTimetable(res.data));
        else toast.error("Failed to load faculty timetable.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  const fetchStudent = () => {
    if (!studentId.trim()) { toast.error("Please enter a Student UUID."); return; }
    dispatch({
      type: timetableActions.GET_STUDENT_VIEW,
      method: "GET",
      endPoint: API.TIMETABLE.STUDENT_VIEW(studentId.trim()),
      auth: true,
      setLoading: (v: boolean) => dispatch(setStudentTimetableLoading(v)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) dispatch(setStudentTimetable(res.data));
        else toast.error("Failed to load student timetable.");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="faculty">
        <TabsList className="mb-4">
          <TabsTrigger value="faculty">Faculty View</TabsTrigger>
          <TabsTrigger value="student">Student View</TabsTrigger>
        </TabsList>

        {/* Faculty */}
        <TabsContent value="faculty" className="mt-0 space-y-4">
          <div className="bg-white rounded-xl border border-border p-4 flex gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 max-w-sm">
              <Label className="text-xs text-muted-foreground">Faculty UUID</Label>
              <Input
                placeholder="Enter faculty UUID..."
                className="h-9 text-sm font-mono"
                value={facultyId}
                onChange={e => setFacultyId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchFaculty()}
              />
            </div>
            <Button onClick={fetchFaculty} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
              <Search className="w-4 h-4" /> Load Timetable
            </Button>
          </div>
          {facultyTimetableLoading
            ? <TableSkeleton columns={3} rows={4} className="mt-0" />
            : Object.keys(facultyTimetable).length > 0 && <WeekGrid data={facultyTimetable} />}
        </TabsContent>

        {/* Student */}
        <TabsContent value="student" className="mt-0 space-y-4">
          <div className="bg-white rounded-xl border border-border p-4 flex gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 max-w-sm">
              <Label className="text-xs text-muted-foreground">Student UUID</Label>
              <Input
                placeholder="Enter student UUID..."
                className="h-9 text-sm font-mono"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchStudent()}
              />
            </div>
            <Button onClick={fetchStudent} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-1.5">
              <Search className="w-4 h-4" /> Load Timetable
            </Button>
          </div>
          {studentTimetableLoading
            ? <TableSkeleton columns={3} rows={4} className="mt-0" />
            : Object.keys(studentTimetable).length > 0 && <WeekGrid data={studentTimetable} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
