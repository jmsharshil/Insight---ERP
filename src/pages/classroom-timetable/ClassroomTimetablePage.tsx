import { useEffect, useMemo, useState } from "react";
import { Plus, AlertTriangle, Send } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  DUMMY_TIMETABLE,
  type Day,
  type TimetableSlot,
} from "@/constants/dummy/timetable";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { batchAction } from "@/redux/actions";
import { API } from "@/service/api";

import TimetableTab from "./components/TimetableTab";
import ClassroomTab from "./components/ClassroomTab";

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

export default function ClassroomTimetablePage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    setPageTitle("Classroom & Timetable");
  }, [setPageTitle]);

  const [activeTab, setActiveTab] = useState("classroom");
  const [slots, setSlots] = useState(() => detectConflicts(DUMMY_TIMETABLE));
  const [batch, setBatch] = useState(user?.role === "faculty" ? "Batch A" : "Batch A");
  const [adding, setAdding] = useState<{ day?: Day; period?: number } | null>(null);
  const [conflictsPanel, setConflictsPanel] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  // Batches list for Timetable tab drop-down
  const [batches, setBatches] = useState<any[]>([]);

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

  function saveSlot(s: TimetableSlot) {
    setSlots((prev) => {
      const next = prev.some((x) => x.id === s.id)
        ? prev.map((x) => (x.id === s.id ? s : x))
        : [...prev, s];
      return detectConflicts(next);
    });
    const newConflicts = detectConflicts(slots.map((x) => (x.id === s.id ? s : x))).filter(
      (x) => x.id === s.id && x.isConflict,
    );
    if (newConflicts.length > 0) {
      toast.warning("Conflict detected: faculty or classroom already assigned at this time.");
    } else {
      toast.success("Timetable slot saved.");
    }
    setAdding(null);
  }

  // delete slot
  function deleteSlot(s: TimetableSlot) {
    setSlots((prev) => detectConflicts(prev.filter((x) => x.id !== s.id)));
    toast.success("Slot deleted.");
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
            <Button variant="outline" className="bg-primary hover:bg-primary-dark text-primary-foreground">
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
          </TabsList>

          <TabsContent value="classroom" className="mt-0">
            <ClassroomTab />
          </TabsContent>

          <TabsContent value="timetable" className="mt-0">
            <TimetableTab
              batch={batch}
              setBatch={setBatch}
              slots={slots}
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
