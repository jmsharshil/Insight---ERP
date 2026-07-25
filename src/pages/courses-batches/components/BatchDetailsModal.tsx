import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Edit2,
  X,
  Layers,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { dropdownActions, studentActions, levelActions, branchAction } from "@/redux/actions";
import { API } from "@/service/api";
import { useDropdown } from "@/hooks/useDropdown";

interface Course {
  id: string;
  name: string;
  code?: string;
}

interface BatchForm {
  course: string;
  course_level?: string;
  name: string;
  batch_code: string;
  group_module: "full" | "both" | "module_1" | "module_2";
  batch_attempt: "june" | "oct" | "dec" | "feb";
  branch: string;
  start_date: string;
  end_date: string;
  max_students: number;
  timing: string;
  enrolled_students?: string[];
  assigned_faculty?: string[];
}

export type SheetMode = "view" | "edit" | "create" | null;

interface BatchDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SheetMode;
  batch?: any;
  batchForm: BatchForm;
  setBatchForm: (form: BatchForm) => void;
  onSave: () => void;
  courses: Course[];
  canEdit?: boolean;
  onEditClick?: () => void;
  allStudents?: any[]; // optional if we pass them
  allFaculty?: any[]; // optional if we pass them
  onAssignStudent?: (studentId: string) => void;
  onRemoveStudent?: (studentId: string) => void;
  onAssignFaculty?: (facultyId: string) => void;
  onRemoveFaculty?: (facultyId: string) => void;
}

export default function BatchDetailsSheet({
  open,
  onOpenChange,
  mode,
  batch,
  batchForm,
  setBatchForm,
  onSave,
  courses,
  canEdit,
  onEditClick,
  allStudents = [],
  onAssignStudent,
  onRemoveStudent,
  onAssignFaculty,
  onRemoveFaculty,
}: BatchDetailsSheetProps) {
  // If mode is null, render nothing or just close sheet
  if (!mode) return null;

  const isFormMode = mode === "edit" || mode === "create";

  const dispatch = useDispatch<AppDispatch>();

  const [students, setStudents] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [courseLevels, setCourseLevels] = useState<any[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);

  useEffect(() => {
    // Fetch Subjects
    dispatch({
      type: studentActions.GET_STUDENTS,
      method: "GET",
      endPoint: "/api/v1/students/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data?.data || res?.data || res;
        if (Array.isArray(data)) setStudents(data);
      },
    });

    // Fetch Faculty
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || [];
        setFacultyList(data);
      },
    });
  }, [dispatch]);

  const {
    options: branches,
    loading: branchesLoading,
    fetchOptions: fetchBranches,
  } = useDropdown("branches", false);

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open, fetchBranches]);

  useEffect(() => {
    if (open && batchForm.course) {
      setLevelsLoading(true);
      dispatch({
        type: levelActions.GET_LEVELS,
        method: "GET",
        endPoint: API.COURSES.LEVELS.LIST(batchForm.course),
        auth: true,
        getResponse: (res: any) => {
          const fetchedLevels = res?.data ?? res;
          if (Array.isArray(fetchedLevels)) {
            const sortedLevels = [...fetchedLevels].sort(
              (a: any, b: any) => (a.order || 0) - (b.order || 0),
            );
            setCourseLevels(sortedLevels);
          } else {
            setCourseLevels([]);
          }
          setLevelsLoading(false);
        },
        getError: (err: any) => {
          console.error("Failed to fetch levels", err);
          setCourseLevels([]);
          setLevelsLoading(false);
        },
      });
    } else {
      setCourseLevels([]);
    }
  }, [open, batchForm.course, dispatch]);

  const selectedLevelName =
    courseLevels
      .find((l) => String(l.id) === String(batchForm.course_level))
      ?.name?.toLowerCase() || "";

  const isCSEET = selectedLevelName.includes("cseet");
  const isExecutive = selectedLevelName.includes("executive");
  const isProfessional = selectedLevelName.includes("professional");

  useEffect(() => {
    if (!batchForm.course_level) return;

    if (isCSEET) {
      if (batchForm.group_module !== "full") {
        setBatchForm({ ...batchForm, group_module: "full" });
      }
      if (!["june", "oct", "feb"].includes(batchForm.batch_attempt)) {
        setBatchForm({ ...batchForm, batch_attempt: "june" });
      }
    } else if (isExecutive || isProfessional) {
      if (batchForm.group_module === "full") {
        setBatchForm({ ...batchForm, group_module: "both" });
      }
      if (!["june", "dec"].includes(batchForm.batch_attempt)) {
        setBatchForm({ ...batchForm, batch_attempt: "june" });
      }
    }
  }, [batchForm.course_level, isCSEET, isExecutive, isProfessional, courseLevels]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold tracking-tight text-text-primary flex items-center justify-between pr-6">
            {isFormMode ? (
              <span>{mode === "edit" ? "Edit Batch Details" : "Create Student Batch"}</span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span>{batch?.name}</span>
                  <Badge variant={batch?.is_active ? "default" : "destructive"} className="ml-2">
                    {batch?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={onEditClick}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        {isFormMode ? (
          <div className="space-y-4 py-4">
            {/* Form Fields */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-course"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Course Program
              </Label>
              <Select
                value={batchForm.course}
                onValueChange={(val) => setBatchForm({ ...batchForm, course: val })}
              >
                <SelectTrigger id="batch-course" className="bg-muted/10">
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="batch-level"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Course Level
              </Label>
              <Select
                value={batchForm.course_level || ""}
                onValueChange={(val) => setBatchForm({ ...batchForm, course_level: val })}
                disabled={!batchForm.course || levelsLoading || courseLevels.length === 0}
              >
                <SelectTrigger id="batch-level" className="bg-muted/10">
                  <SelectValue
                    placeholder={
                      !batchForm.course
                        ? "Select a course first"
                        : levelsLoading
                          ? "Loading levels..."
                          : courseLevels.length === 0
                            ? "No levels available"
                            : "Select a level..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courseLevels.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name} {l.order ? `(Order: ${l.order})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="batch-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Batch Name
              </Label>
              <Input
                id="batch-name"
                value={batchForm.name}
                onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                placeholder="e.g. CSEET_OCT_26_101"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="batch-module"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Group Module
                </Label>
                <Select
                  value={batchForm.group_module}
                  onValueChange={(val: any) => setBatchForm({ ...batchForm, group_module: val })}
                >
                  <SelectTrigger id="batch-module" className="bg-muted/10">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {isCSEET ? (
                      <SelectItem value="full">Full</SelectItem>
                    ) : isExecutive || isProfessional ? (
                      <>
                        <SelectItem value="module_1">Module 1</SelectItem>
                        <SelectItem value="module_2">Module 2</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="module_1">Module 1</SelectItem>
                        <SelectItem value="module_2">Module 2</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="batch-attempt"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Attempt Month
                </Label>
                <Select
                  value={batchForm.batch_attempt}
                  onValueChange={(val: any) => setBatchForm({ ...batchForm, batch_attempt: val })}
                >
                  <SelectTrigger id="batch-attempt" className="bg-muted/10">
                    <SelectValue placeholder="Select attempt" />
                  </SelectTrigger>
                  <SelectContent>
                    {isCSEET ? (
                      <>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="oct">October</SelectItem>
                        <SelectItem value="feb">February</SelectItem>
                      </>
                    ) : isExecutive || isProfessional ? (
                      <>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="dec">December</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="oct">October</SelectItem>
                        <SelectItem value="dec">December</SelectItem>
                        <SelectItem value="feb">February</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="batch-start"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Start Date
                </Label>
                <Input
                  id="batch-start"
                  type="date"
                  value={batchForm.start_date}
                  onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="batch-end"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  End Date
                </Label>
                <Input
                  id="batch-end"
                  type="date"
                  value={batchForm.end_date}
                  onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="batch-max-students"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Max Students
                </Label>
                <Input
                  id="batch-max-students"
                  type="number" min="0"
                  value={batchForm.max_students}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, max_students: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="batch-branch"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Branch Name
                </Label>
                <Select
                  value={batchForm.branch || ""}
                  onValueChange={(val) => setBatchForm({ ...batchForm, branch: val })}
                  disabled={branchesLoading}
                >
                  <SelectTrigger id="batch-branch" className="bg-muted/10">
                    <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select Branch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.value} value={String(b.value)}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* <div className="space-y-1">
              <Label
                htmlFor="batch-timing"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Timings
              </Label>
              <Input
                id="batch-timing"
                value={batchForm.timing}
                onChange={(e) => setBatchForm({ ...batchForm, timing: e.target.value })}
                placeholder="e.g. 09:00-12:00"
              />
            </div> */}

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
              <Label
                htmlFor="batch-active"
                className="text-xs font-semibold text-text-primary cursor-pointer"
              >
                Active Status
              </Label>
              <Switch
                id="batch-active"
                checked={batchForm.is_active}
                onCheckedChange={(checked) => setBatchForm({ ...batchForm, is_active: checked })}
              />
            </div>

            {mode === "edit" && (
              <div className="space-y-4 pt-4 border-t border-border mt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Manage Enrolled Students
                  </Label>
                  <Select
                    value=""
                    onValueChange={(val) => {
                      const existing = batchForm.enrolled_students?.find(
                        (s: any) => s.student_id === val,
                      );
                      if (!existing) {
                        const studentName = students.find((s: any) => s.id === val)?.full_name;
                        if (onAssignStudent) {
                          onAssignStudent(val, studentName);
                        } else {
                          setBatchForm({
                            ...batchForm,
                            enrolled_students: [
                              ...(batchForm.enrolled_students || []),
                              { student_id: val, student_name: studentName },
                            ],
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="bg-muted/10">
                      <SelectValue placeholder="Add student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((opt: any) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {batchForm.enrolled_students && batchForm.enrolled_students.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                      {batchForm.enrolled_students.map((studentObj: any) => {
                        const sid = studentObj.student_id;
                        const studentLabel =
                          studentObj.student_name ||
                          students.find((o: any) => o.id === sid)?.full_name ||
                          sid;
                        return (
                          <Badge key={sid} variant="secondary" className="flex items-center gap-1">
                            {studentLabel}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => {
                                if (onRemoveStudent) {
                                  onRemoveStudent(sid);
                                } else {
                                  setBatchForm({
                                    ...batchForm,
                                    enrolled_students: batchForm.enrolled_students?.filter(
                                      (s: any) => s.student_id !== sid,
                                    ),
                                  });
                                }
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Manage Assigned Faculty
                  </Label>
                  <Select
                    value=""
                    onValueChange={(val) => {
                      const existing = batchForm.assigned_faculty?.find(
                        (f: any) => f.faculty_id === val,
                      );
                      if (!existing) {
                        const facultyName = facultyList.find((o: any) => o.id === val)?.full_name;
                        if (onAssignFaculty) {
                          onAssignFaculty(val, facultyName);
                        } else {
                          setBatchForm({
                            ...batchForm,
                            assigned_faculty: [
                              ...(batchForm.assigned_faculty || []),
                              { faculty_id: val, faculty_name: facultyName },
                            ],
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="bg-muted/10">
                      <SelectValue placeholder="Add faculty..." />
                    </SelectTrigger>
                    <SelectContent>
                      {facultyList.map((opt: any) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {batchForm.assigned_faculty && batchForm.assigned_faculty.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                      {batchForm.assigned_faculty.map((facultyObj: any) => {
                        const fid = facultyObj.faculty_id;
                        const facultyLabel =
                          facultyObj.faculty_name ||
                          facultyList.find((o: any) => o.id === fid)?.full_name ||
                          fid;
                        return (
                          <Badge key={fid} variant="secondary" className="flex items-center gap-1">
                            {facultyLabel}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => {
                                if (onRemoveFaculty) {
                                  onRemoveFaculty(fid);
                                } else {
                                  setBatchForm({
                                    ...batchForm,
                                    assigned_faculty: batchForm.assigned_faculty?.filter(
                                      (f: any) => f.faculty_id !== fid,
                                    ),
                                  });
                                }
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onSave}
                className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground flex items-center justify-center gap-2"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          batch && (
            <div className="space-y-6 py-4">
              {/* View Details Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Batch Code
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {batch.batch_code}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Branch
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-primary" />
                    {batch.branch_name || batch.branch || "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Group Module
                  </span>
                  <div className="text-sm font-medium capitalize">
                    {batch.group_module_display || batch.group_module?.replace("_", " ")}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Batch Attempt
                  </span>
                  <div className="text-sm font-medium capitalize">
                    {batch.batch_attempt_display || batch.batch_attempt}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Duration
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    {batch.start_date} to {batch.end_date}
                  </div>
                </div>
                {/* <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Timing
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    {batch.timing}
                  </div>
                </div> */}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Max Students
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-primary" />
                    {batch.max_students}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Course Name
                  </span>
                  <div className="text-sm font-medium truncate" title={batch.course}>
                    {batch.course_name}
                  </div>
                </div>
              </div>

              {(batch.course_level_name ||
                batch.level_name ||
                batch.course_level ||
                batch.level) && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Course Level
                    </span>
                    <div className="text-sm font-medium text-text-primary">
                      {batch.course_level_name ||
                        batch.level_name ||
                        batch.course_level ||
                        batch.level}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    Enrolled Students ({batch.enrolled_students?.length || 0})
                  </span>
                  {batch.enrolled_students?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {batch.enrolled_students.map((student: any, idx: number) => (
                        <div
                          key={student.id || idx}
                          className="flex flex-col p-2.5 border border-border rounded-lg bg-card"
                        >
                          <span className="font-medium text-sm text-text-primary">
                            {student.student_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {student.student_email}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-muted-foreground">
                      No students enrolled.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    Assigned Faculty ({batch.assigned_faculty?.length || 0})
                  </span>
                  {batch.assigned_faculty?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {batch.assigned_faculty.map((faculty: any, idx: number) => (
                        <div
                          key={faculty.id || idx}
                          className="flex flex-col p-2.5 border border-border rounded-lg bg-card"
                        >
                          <span className="font-medium text-sm text-text-primary">
                            {faculty.faculty_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {faculty.subject_name || faculty.phone || "No additional details"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-muted-foreground">
                      No faculty assigned.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Created At
                  </span>
                  <div className="text-xs font-medium text-muted-foreground">
                    {batch.created_at || "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Updated At
                  </span>
                  <div className="text-xs font-medium text-muted-foreground">
                    {batch.updated_at || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}
