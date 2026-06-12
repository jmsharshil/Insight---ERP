import { useEffect, useMemo, useState } from "react";
import { Plus, AlertTriangle, Send } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { DUMMY_TIMETABLE, type Day, type TimetableSlot } from "@/constants/dummy/timetable";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  batchAction,
  ClassroomAction,
  TimetableAction,
  dropdownActions,
  studentActions,
  subjectAction,
} from "@/redux/actions";
import { API } from "@/service/api";

import TimetableTab from "./components/TimetableTab";
import ClassroomTab from "./components/ClassroomTab";
import ClassroomSheet from "./components/ClassroomSheet";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  setClassrooms,
  addClassroom,
  updateClassroom,
  deleteClassroom,
} from "@/redux/slices/classroomSlice";
import { setSlots } from "@/redux/slices/timetableSlice";

function detectConflicts(slots: TimetableSlot[]) {
  const map: TimetableSlot[] = slots.map((s) => ({ ...s, isConflict: false }));
  for (let i = 0; i < map.length; i++) {
    for (let j = i + 1; j < map.length; j++) {
      const a = map[i],
        b = map[j];
      if (a.day === b.day && a.period === b.period) {
        if (a.facultyId === b.facultyId || a.classroom === b.classroom) {
          a.isConflict = true;
          b.isConflict = true;
        }
      }
    }
  }
  return map;
}

function mapTimeToPeriod(startTime: string): 1 | 2 | 3 | 4 | 5 | 6 {
  if (!startTime) return 1;
  const t = startTime.substring(0, 5); // "09:00"
  if (t === "09:00" || t.startsWith("09")) return 1;
  if (t === "10:15" || t.startsWith("10")) return 2;
  if (t === "11:00" || t === "11:30" || t.startsWith("11")) return 3;
  if (t === "13:30" || t.startsWith("13")) return 4;
  if (t === "14:45" || t.startsWith("14")) return 5;
  if (t === "16:00" || t.startsWith("16")) return 6;
  return 1;
}

export default function ClassroomTimetablePage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { classrooms, isLoading: classroomsLoading } = useSelector(
    (state: RootState) => state.classRoom,
  );

  useEffect(() => {
    setPageTitle("Classroom & Timetable");
  }, [setPageTitle]);

  const [activeTab, setActiveTab] = useState("classroom");
  const { slots, loading: timetableLoading } = useSelector((state: RootState) => state.timetable);
  const [batch, setBatch] = useState(user?.role === "faculty" ? "Batch A" : "Batch A");
  const [adding, setAdding] = useState<{ day?: Day; period?: number } | null>(null);
  const [conflictsPanel, setConflictsPanel] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [classroomSheetOpen, setClassroomSheetOpen] = useState(false);
  const [classroomUpdateLoading, setClassroomUpdateLoading] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any>(null);
  const [classroomDeleteConfirmOpen, setClassroomDeleteConfirmOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<any>(null);

  // Dynamic dropdown data
  const [subjects, setSubjects] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Subjects
    dispatch({
      type: subjectAction.GET_SUBJECTS,
      method: "GET",
      endPoint: "/api/v1/subjects/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(data)) setSubjects(data);
      },
    });

    // Fetch Faculty
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setFacultyList(data.results || data);
      },
    });
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "timetable") {
      dispatch({
        type: TimetableAction.GET_TIMETABLE,
        method: "GET",
        endPoint: "/api/v1/timetable/",
        auth: true,
        setLoading: (val: boolean) => dispatch({ type: "timetable/setLoading", payload: val }),
        getResponse: (res: any) => {
          const apiData = res?.data?.data || res?.data || res;
          if (Array.isArray(apiData) && apiData.length > 0) {
            const mappedSlots: TimetableSlot[] = apiData.map((item: any) => ({
              id: item.id,
              batch: item.batch_name || item.batch,
              day: item.day_label || item.day_of_week_display || "Monday",
              period: mapTimeToPeriod(item.start_time),
              startTime: item.start_time?.substring(0, 5) || "09:00",
              endTime: item.end_time?.substring(0, 5) || "10:00",
              subject: item.subject,
              subject_name: item.subject_name || item.subject,
              facultyId: item.faculty,
              facultyName: item.faculty_name,
              classroom: item.classroom_name || item.classroom,
              isConflict: false,
              course_name: item.course_name,
              course_code: item.course_code,
              session: item.session,
              is_recurring: item.is_recurring,
              effective_from: item.effective_from,
              effective_to: item.effective_to,
            }));
            dispatch(setSlots(detectConflicts(mappedSlots)));
          } else {
            dispatch(setSlots([]));
          }
        },
      });
    }
  }, [dispatch, activeTab]);

  useEffect(() => {
    if (activeTab === "classroom") {
      dispatch({
        type: ClassroomAction.GET_CLASSROOMS,
        method: "GET",
        endPoint: "/api/v1/classrooms/",
        auth: true,
        setLoading: (val: boolean) => dispatch({ type: "classRoom/setIsLoading", payload: val }),
        getResponse: (res: any) => {
          if (res?.data) {
            dispatch(setClassrooms(Array.isArray(res.data) ? res.data : []));
          } else if (Array.isArray(res)) {
            dispatch(setClassrooms(res));
          }
        },
      });
    }
  }, [dispatch, activeTab]);

  useEffect(() => {
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: API.BATCHES.LIST,
      auth: true,
      getResponse: (res: any) => {
        if (res?.data) {
          setBatches(Array.isArray(res.data) ? res.data : []);
        } else if (Array.isArray(res)) {
          setBatches(res);
        }
      },
    });
  }, [dispatch]);

  const isFaculty = user?.role === "faculty";
  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_exec"].includes(user.role);

  const conflicts = useMemo(() => slots.filter((s) => s.isConflict), [slots]);
  const hasConflicts = conflicts.length > 0;

  function handleSaveClassroom(form: { name: string; capacity: number; is_active: boolean }) {
    if (editingClassroom) {
      dispatch({
        type: ClassroomAction.UPDATE_CLASSROOMS,
        method: "PATCH",
        endPoint: `/api/v1/classrooms/${editingClassroom.id}/`,
        body: form,
        auth: true,
        setLoading: (val: boolean) => setClassroomUpdateLoading(val),
        getResponse: (res: any) => {
          const updated = res?.data ?? res;
          dispatch(updateClassroom(updated));
          toast.success("Classroom updated successfully.");
          setClassroomSheetOpen(false);
          setEditingClassroom(null);
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to update classroom";
          toast.error(msg);
        },
      });
    } else {
      dispatch({
        type: ClassroomAction.CREATE_CLASSROOMS,
        method: "POST",
        endPoint: "/api/v1/classrooms/",
        body: form,
        auth: true,
        setLoading: (val: boolean) => setClassroomUpdateLoading(val),
        getResponse: (res: any) => {
          const created = res?.data ?? res;
          if (created?.id) {
            dispatch(addClassroom(created));
            toast.success("Classroom created successfully.");
            setClassroomSheetOpen(false);
          } else {
            toast.error("Unexpected response from server.");
          }
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to create classroom";
          toast.error(msg);
        },
      });
    }
  }

  function handleDeleteClassroom() {
    if (!classroomToDelete) return;
    dispatch({
      type: ClassroomAction.DELETE_CLASSROOMS,
      method: "DELETE",
      endPoint: `/api/v1/classrooms/${classroomToDelete.id}/`,
      auth: true,
      getResponse: () => {
        dispatch(deleteClassroom(classroomToDelete.id));
        toast.success("Classroom deleted successfully.");
        setClassroomDeleteConfirmOpen(false);
        setClassroomSheetOpen(false);
        setEditingClassroom(null);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete classroom";
        toast.error(msg);
      },
    });
  }

  function saveSlot(s: TimetableSlot) {
    const isNew = s.id.startsWith("TT-");

    const batchObj =
      batches.find((b) => b.name === s.batch) ||
      batches.find((b) => b.id === s.batch) ||
      batches[0];
    const classroomObj =
      classrooms.find((c) => c.name === s.classroom) ||
      classrooms.find((c) => c.id === s.classroom) ||
      classrooms[0];

    const dayOfWeekMap: Record<string, number> = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };

    const startTimePayload =
      s.startTime.split(":").length === 2 ? s.startTime + ":00" : s.startTime;
    const endTimePayload = s.endTime.split(":").length === 2 ? s.endTime + ":00" : s.endTime;

    const payload = {
      batch: batchObj?.id || s.batch,
      subject: s.subject,
      faculty: s.facultyId,
      classroom: classroomObj?.id || s.classroom,
      day_of_week: dayOfWeekMap[s.day] ?? 0,
      start_time: startTimePayload,
      end_time: endTimePayload,
      session: "morning", // default payload session
      is_recurring: true,
      effective_from: "2026-07-01",
      effective_to: "2026-12-31",
    };

    if (isNew) {
      dispatch({
        type: TimetableAction.CREATE_TIMETABLE,
        method: "POST",
        endPoint: "/api/v1/timetable/",
        body: payload,
        auth: true,
        getResponse: (res: any) => {
          const created = res?.data || res;
          toast.success("Timetable slot created successfully.");
          const newSlots = detectConflicts([...slots, { ...s, id: created?.id || s.id }]);
          dispatch(setSlots(newSlots));
        },
        getError: (err: any) => {
          console.error("Create timetable slot error:", err);
          toast.error("Failed to create timetable slot.");
        },
      });
    } else {
      dispatch({
        type: TimetableAction.UPDATE_TIMETABLE,
        method: "PATCH",
        endPoint: `/api/v1/timetable/${s.id}/`,
        body: payload,
        auth: true,
        getResponse: (res: any) => {
          toast.success("Timetable slot updated successfully.");
          const newSlots = detectConflicts(slots.map((x) => (x.id === s.id ? s : x)));
          dispatch(setSlots(newSlots));
        },
        getError: (err: any) => {
          console.error("Update timetable slot error:", err);
          toast.error("Failed to update timetable slot.");
        },
      });
    }
    setAdding(null);
  }

  function deleteSlot(s: TimetableSlot) {
    if (s.id.startsWith("TT-")) {
      const newSlots = detectConflicts(slots.filter((x) => x.id !== s.id));
      dispatch(setSlots(newSlots));
      toast.success("Slot deleted.");
      return;
    }

    dispatch({
      type: TimetableAction.DELETE_TIMETABLE,
      method: "DELETE",
      endPoint: `/api/v1/timetable/${s.id}/`,
      auth: true,
      getResponse: () => {
        toast.success("Timetable slot deleted successfully.");
        const newSlots = detectConflicts(slots.filter((x) => x.id !== s.id));
        dispatch(setSlots(newSlots));
      },
      getError: (err: any) => {
        console.error("Delete timetable slot error:", err);
        toast.error("Failed to delete timetable slot.");
      },
    });
  }

  return (
    <div className="space-y-4 mx-auto w-full pb-10">
      <PageHeader
        title={activeTab === "classroom" ? "Classrooms" : "Timetable"}
        subtitle={
          activeTab === "classroom"
            ? "Manage physical classrooms and their capacities."
            : "Manage slots, detect conflicts, and publish schedules."
        }
        actions={
          activeTab === "timetable" && canEdit ? (
            <>
              <Button
                variant="outline"
                onClick={() => setConflictsPanel(true)}
                className="relative"
              >
                <AlertTriangle className="w-4 h-4" /> Conflicts
                {hasConflicts && (
                  <span className="ml-1 px-1.5 rounded-full bg-destructive text-white text-[10px]">
                    {conflicts.length}
                  </span>
                )}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        disabled={hasConflicts}
                        onClick={() => setPublishOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-primary-foreground"
                      >
                        <Send className="w-4 h-4" /> Publish
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {hasConflicts && <TooltipContent>Resolve conflicts to publish</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" onClick={() => setAdding({})}>
                <Plus className="w-4 h-4" /> Add Slot
              </Button>
            </>
          ) : activeTab === "classroom" && canEdit ? (
            <Button
              variant="outline"
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
              onClick={() => {
                setEditingClassroom(null);
                setClassroomSheetOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Add Classroom
            </Button>
          ) : null
        }
      />

      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-muted/50">
            <TabsTrigger value="classroom">Classrooms</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            
          </TabsList>

          <TabsContent value="classroom" className="mt-0">
            <ClassroomTab
              classrooms={classrooms}
              loading={classroomsLoading}
              canEdit={!!canEdit}
              onAddClassroomClick={() => {
                setEditingClassroom(null);
                setClassroomSheetOpen(true);
              }}
              onEditClassroomClick={(c) => {
                setEditingClassroom(c);
                setClassroomSheetOpen(true);
              }}
              onDeleteClassroomClick={(c) => {
                setClassroomToDelete(c);
                setClassroomDeleteConfirmOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="timetable" className="mt-0">
            <TimetableTab
              batch={batch}
              setBatch={setBatch}
              slots={slots}
              loading={timetableLoading}
              batches={batches}
              isFaculty={isFaculty}
              facultyId={user?.id}
              canEdit={!!canEdit}
              saveSlot={saveSlot}
              deleteSlot={deleteSlot}
              publishOpen={publishOpen}
              setPublishOpen={setPublishOpen}
              conflictsPanel={conflictsPanel}
              setConflictsPanel={setConflictsPanel}
              adding={adding}
              setAdding={setAdding}
              subjects={subjects}
              facultyList={facultyList}
              classrooms={classrooms}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ClassroomSheet
        open={classroomSheetOpen}
        onOpenChange={(isOpen) => {
          setClassroomSheetOpen(isOpen);
          if (!isOpen) setEditingClassroom(null);
        }}
        loading={classroomUpdateLoading}
        classroom={editingClassroom}
        onSave={handleSaveClassroom}
        onDelete={() => {
          setClassroomToDelete(editingClassroom);
          setClassroomDeleteConfirmOpen(true);
        }}
      />

      <ConfirmDialog
        open={classroomDeleteConfirmOpen}
        onOpenChange={setClassroomDeleteConfirmOpen}
        title={`Delete "${classroomToDelete?.name}"?`}
        description="This action cannot be undone. All timetable scheduling slots for this classroom will be affected."
        confirmLabel="Delete"
        onConfirm={handleDeleteClassroom}
      />
    </div>
  );
}
