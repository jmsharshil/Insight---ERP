import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { batchAction, dropdownActions, studentActions, courseAction } from "@/redux/actions";
import { API } from "@/service/api";
import { useDropdown } from "@/hooks/useDropdown";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Edit2,
  X,
  ArrowLeft,
  Trash2,
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
import PageHeader from "@/components/layout/PageHeader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface BatchForm {
  course: string;
  name: string;
  batch_code: string;
  group_module: "full" | "both" | "module_1" | "module_2";
  batch_attempt: "june" | "oct" | "dec" | "feb";
  branch: string;
  start_date: string;
  end_date: string;
  max_students: number;
  timing: string;
  is_active: boolean;
  enrolled_students?: string[];
  assigned_faculty?: string[];
}

function BatchDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Skeleton width={40} height={40} className="rounded-full" />
          <div>
            <Skeleton width={200} height={28} />
            <Skeleton width={150} height={16} />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton width={100} height={36} className="rounded-md" />
          <Skeleton width={100} height={36} className="rounded-md" />
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton width={80} height={14} />
              <Skeleton width={120} height={20} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <Skeleton width={40} height={40} className="rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton width={80} height={14} />
              <Skeleton width="80%" height={20} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
            <Skeleton width={40} height={40} className="rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton width={80} height={14} />
              <Skeleton width="60%" height={20} />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
            <Skeleton width={40} height={40} className="rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton width={80} height={14} />
              <Skeleton width="60%" height={20} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton width={150} height={16} />
            <div className="flex flex-wrap gap-2">
              <Skeleton width={80} height={24} className="rounded-full" />
              <Skeleton width={100} height={24} className="rounded-full" />
              <Skeleton width={90} height={24} className="rounded-full" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton width={150} height={16} />
            <div className="flex flex-wrap gap-2">
              <Skeleton width={120} height={24} className="rounded-full" />
              <Skeleton width={140} height={24} className="rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_exec"].includes(user.role);

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Read mode from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode = searchParams.get("mode") === "edit" ? "edit" : "view";
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [pendingStudents, setPendingStudents] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const {
    options: branches,
    loading: branchesLoading,
    fetchOptions: fetchBranches,
  } = useDropdown("branches", false);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const [batchForm, setBatchForm] = useState<BatchForm>({
    course: "",
    name: "",
    batch_code: "",
    group_module: "module_1",
    batch_attempt: "june",
    branch: "",
    start_date: "",
    end_date: "",
    max_students: 50,
    timing: "",
    is_active: true,
    enrolled_students: [],
    assigned_faculty: [],
  });

  useEffect(() => {
    // Fetch batch details
    if (id) {
      dispatch({
        type: batchAction.GET_BATCH_DETAILS,
        method: "GET",
        endPoint: API.BATCHES.DETAIL(id),
        auth: true,
        getResponse: (res: any) => {
          const data = res?.data ?? res;
          setBatch(data);
          setBatchForm({
            course: data.course || "",
            name: data.name || "",
            batch_code: data.batch_code || "",
            group_module: data.group_module || "module_1",
            batch_attempt: data.batch_attempt || "june",
            branch: data.branch || "",
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            max_students: data.max_students || 50,
            timing: data.timing || "",
            is_active: data.is_active !== false,
            enrolled_students: data.enrolled_students ? [...data.enrolled_students] : [],
            assigned_faculty: data.assigned_faculty ? [...data.assigned_faculty] : [],
          });
          setLoading(false);
        },
        getError: (err: any) => {
          toast.error("Failed to load batch details");
          setLoading(false);
        },
      });
    }

    // Fetch related dropdown data
    dispatch({
      type: courseAction.GET_COURSES,
      method: "GET",
      endPoint: "/api/v1/courses/?page_size=1000",
      auth: true,
      getResponse: (res: any) => setCourses(res?.data?.results || res?.results || res?.data || []),
    });

    dispatch({
      type: studentActions.GET_STUDENTS,
      method: "GET",
      endPoint: "/api/v1/students/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data || [];
        setStudents(data);
      },
    });

    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/faculty/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        setFacultyList(data?.results || data || []);
      },
    });

    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "GET",
      endPoint: "/api/v1/subjects/",
      auth: true,
      getResponse: (res: any) => setSubjects(res?.data?.results || res?.results || res?.data || []),
    });
  }, [dispatch, id]);

  const handleSave = () => {
    if (!batchForm.course) return toast.error("Course is required.");

    const payload = {
      ...batchForm,
      student_ids: batchForm.enrolled_students?.map((s: any) => s.student_id).filter(Boolean),
      faculties: batchForm.assigned_faculty
        ?.map((f: any) => ({
          faculty_id: f.faculty_id,
          subject_id: f.subject_id || "",
        }))
        .filter((f: any) => f.faculty_id),
    };

    dispatch({
      type: batchAction.UPDATE_BATCH,
      method: "PATCH",
      endPoint: API.BATCHES.UPDATE(id!),
      body: payload,
      auth: true,
      getResponse: (res: any) => {
        toast.success("Batch updated successfully");
        setBatch(res?.data ?? res);
        setMode("view");
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update batch"),
    });
  };

  const handleAssignMultipleStudents = () => {
    if (pendingStudents.length === 0) return;
    dispatch({
      type: batchAction.ASSIGN_STUDENT,
      method: "POST",
      endPoint: API.BATCHES.ASSIGN_STUDENT(id!),
      body: { student_ids: pendingStudents },
      auth: true,
      getResponse: () => {
        toast.success("Students assigned successfully.");

        const newEnrolled = [...(batchForm.enrolled_students || [])];
        pendingStudents.forEach((studentId) => {
          const studentName = students.find((s: any) => s.id === studentId)?.full_name;
          if (!newEnrolled.find((s: any) => s.student_id === studentId)) {
            newEnrolled.push({ student_id: studentId, student_name: studentName } as any);
          }
        });

        setBatchForm({
          ...batchForm,
          enrolled_students: newEnrolled,
        });
        setPendingStudents([]);
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to assign students"),
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    dispatch({
      type: batchAction.REMOVE_STUDENT,
      method: "POST",
      endPoint: API.BATCHES.REMOVE_STUDENT(id!, studentId),
      auth: true,
      getResponse: () => {
        toast.success("Student removed successfully.");
        setBatchForm({
          ...batchForm,
          enrolled_students: batchForm.enrolled_students?.filter(
            (s: any) => s.student_id !== studentId,
          ),
        });
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to remove student"),
    });
  };

  const handleAssignFaculty = (facultyId: string, facultyName?: string, subjectId?: string) => {
    const apiSubjectId = subjectId === "none" || !subjectId ? null : subjectId;
    dispatch({
      type: "ASSIGN_FACULTY",
      method: "POST",
      endPoint: API.BATCHES.ASSIGN_FACULTY(id!),
      body: { faculty_id: facultyId, subject_id: apiSubjectId },
      auth: true,
      getResponse: () => {
        toast.success("Faculty assigned successfully.");
        setBatchForm({
          ...batchForm,
          assigned_faculty: [
            ...(batchForm.assigned_faculty || []),
            { faculty_id: facultyId, faculty_name: facultyName, subject_id: apiSubjectId } as any,
          ],
        });
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to assign faculty"),
    });
  };

  const handleRemoveFaculty = (facultyId: string) => {
    dispatch({
      type: "REMOVE_FACULTY",
      method: "POST",
      endPoint: API.BATCHES.REMOVE_FACULTY(id!, facultyId),
      auth: true,
      getResponse: () => {
        toast.success("Faculty removed successfully.");
        setBatchForm({
          ...batchForm,
          assigned_faculty: batchForm.assigned_faculty?.filter(
            (f: any) => f.faculty_id !== facultyId,
          ),
        });
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to remove faculty"),
    });
  };

  const handleDeleteBatch = () => {
    dispatch({
      type: batchAction.DELETE_BATCH,
      method: "DELETE",
      endPoint: API.BATCHES.DELETE(id!),
      auth: true,
      getResponse: () => {
        toast.success("Batch deleted successfully.");
        navigate("/courses-batches");
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete batch";
        toast.error(msg);
      },
    });
  };

  if (loading) {
    return <BatchDetailSkeleton />;
  }

  if (!batch) {
    return <div className="p-8 text-center text-destructive">Batch not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/courses-batches")}
            className="rounded-full border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader title={batch.name} subtitle={batch.course_name || "Manage batch details"} />
          <Badge variant={batch.is_active ? "default" : "destructive"} className="ml-2">
            {batch.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {mode === "view" && canEdit && (
          <div className="flex gap-2">
            <Button onClick={() => setMode("edit")} className="bg-primary hover:bg-primary-dark">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Batch
            </Button>
            <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        {mode === "edit" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch Name *</Label>
                <Input
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g., Morning Batch A"
                />
              </div>

              <div className="space-y-2">
                <Label>Course *</Label>
                <Select
                  value={batchForm.course}
                  onValueChange={(val) => setBatchForm({ ...batchForm, course: val })}
                >
                  <SelectTrigger className="bg-muted/10">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Batch Code</Label>
                <Input
                  value={batchForm.batch_code}
                  onChange={(e) => setBatchForm({ ...batchForm, batch_code: e.target.value })}
                  placeholder="e.g., MBA-2024-M"
                />
              </div>

              <div className="space-y-2">
                <Label>Group Module</Label>
                <Select
                  value={batchForm.group_module}
                  onValueChange={(val: any) => setBatchForm({ ...batchForm, group_module: val })}
                >
                  <SelectTrigger className="bg-muted/10">
                    <SelectValue placeholder="Select Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Course</SelectItem>
                    <SelectItem value="both">Both Modules</SelectItem>
                    <SelectItem value="module_1">Module 1</SelectItem>
                    <SelectItem value="module_2">Module 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Batch Attempt</Label>
                <Select
                  value={batchForm.batch_attempt}
                  onValueChange={(val: any) => setBatchForm({ ...batchForm, batch_attempt: val })}
                >
                  <SelectTrigger className="bg-muted/10">
                    <SelectValue placeholder="Select Attempt Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="june">June</SelectItem>
                    <SelectItem value="oct">October</SelectItem>
                    <SelectItem value="dec">December</SelectItem>
                    <SelectItem value="feb">February</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={batchForm.branch || ""}
                  onValueChange={(val) => setBatchForm({ ...batchForm, branch: val })}
                  disabled={branchesLoading}
                >
                  <SelectTrigger className="w-full bg-muted/10">
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

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={batchForm.start_date}
                  onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                  className="bg-muted/10"
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={batchForm.end_date}
                  onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                  className="bg-muted/10"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Students</Label>
                <Input
                  type="number"
                  min="1"
                  value={batchForm.max_students}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, max_students: parseInt(e.target.value) || 50 })
                  }
                  className="bg-muted/10"
                />
              </div>

              {/* <div className="space-y-2">
                <Label>Timing</Label>
                <Input
                  value={batchForm.timing}
                  onChange={(e) => setBatchForm({ ...batchForm, timing: e.target.value })}
                  placeholder="e.g., 09:00 AM - 11:00 AM"
                />
              </div> */}

              <div className="space-y-2 flex flex-col justify-center pt-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={batchForm.is_active}
                    onCheckedChange={(val) => setBatchForm({ ...batchForm, is_active: val })}
                  />
                  <Label className="cursor-pointer font-medium">Active Batch</Label>
                </div>
              </div>
            </div>

            {/* <div className="border-t border-border pt-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      if (!existing && !pendingStudents.includes(val)) {
                        setPendingStudents([...pendingStudents, val]);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-muted/10">
                      <SelectValue placeholder="Add student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name} ({s.admission_number || "No Adm #"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {pendingStudents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {pendingStudents.map((pid) => {
                          const s = students.find((x: any) => x.id === pid);
                          return (
                            <Badge key={pid} variant="default" className="flex items-center gap-1">
                              {s?.full_name || pid}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-primary-foreground/80"
                                onClick={() =>
                                  setPendingStudents(pendingStudents.filter((id) => id !== pid))
                                }
                              />
                            </Badge>
                          );
                        })}
                      </div>
                      <Button size="sm" onClick={handleAssignMultipleStudents} className="w-full">
                        Confirm Assign ({pendingStudents.length}) Students
                      </Button>
                    </div>
                  )}

                  {batchForm.enrolled_students && batchForm.enrolled_students.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 max-h-40 overflow-y-auto pt-2 border-t border-border">
                      {batchForm.enrolled_students.map((studentObj: any) => {
                        const sid = studentObj.student_id;
                        const studentLabel =
                          studentObj.student_name ||
                          students.find((s: any) => s.id === sid)?.full_name ||
                          sid;
                        return (
                          <Badge
                            key={sid}
                            variant="outline"
                            className="flex items-center gap-1 bg-background"
                          >
                            {studentLabel}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => handleRemoveStudent(sid)}
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
                  <div className="flex gap-2">
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="bg-muted/10 w-1/2">
                        <SelectValue placeholder="Select Subject (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Subject (General)</SelectItem>
                        {subjects.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value=""
                      onValueChange={(val) => {
                        const normalizedSelectedSubj = selectedSubject === "none" || !selectedSubject ? null : selectedSubject;
                        const existing = batchForm.assigned_faculty?.find(
                          (f: any) => f.faculty_id === val && f.subject_id === normalizedSelectedSubj,
                        );
                        if (!existing) {
                          const facultyName = facultyList.find((o: any) => o.id === val)?.full_name;
                          handleAssignFaculty(val, facultyName, selectedSubject);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-muted/10 w-1/2">
                        <SelectValue placeholder="Add faculty..." />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyList.map((opt: any) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.full_name} {opt.employee_id ? `(${opt.employee_id})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {batchForm.assigned_faculty && batchForm.assigned_faculty.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto">
                      {batchForm.assigned_faculty.map((facultyObj: any) => {
                        const fid = facultyObj.faculty_id;
                        const subjId = facultyObj.subject_id;
                        const hasSubj = subjId && subjId !== "none";
                        const subjName = hasSubj ? (subjects.find((s: any) => s.id === subjId)?.name || subjId) : "";
                        const facultyLabel =
                          facultyObj.faculty_name ||
                          facultyList.find((o: any) => o.id === fid)?.full_name ||
                          fid;
                        return (
                          <Badge
                            key={`${fid}-${subjId || "general"}`}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {facultyLabel} {subjName ? `(${subjName})` : ""}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => handleRemoveFaculty(fid)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div> */}

            <div className="flex gap-3 pt-4 border-t border-border mt-6 justify-end">
              <Button type="button" variant="outline" onClick={() => setMode("view")}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-primary hover:bg-primary-dark"
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Course
                </span>
                <p className="font-medium">{batch.course_name || "-"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Batch Code</span>
                <p className="font-medium">{batch.batch_code || "-"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Module</span>
                <p className="font-medium capitalize">
                  {batch.group_module_display || batch.group_module}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Attempt</span>
                <p className="font-medium capitalize">
                  {batch.batch_attempt_display || batch.batch_attempt}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {batch.start_date || "N/A"} to {batch.end_date || "N/A"}
                  </p>
                </div>
              </div>

              {/* <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timing</p>
                  <p className="font-medium">{batch.timing || "Not set"}</p>
                </div>
              </div> */}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <p className="font-medium">{batch.branch_name || batch.branch || "Not assigned"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">
                    {batch.enrolled_students?.length || 0} / {batch.max_students || 0} Students
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Enrolled Students
                </h4>
                <div className="flex flex-wrap gap-2">
                  {batch.enrolled_students && batch.enrolled_students.length > 0 ? (
                    batch.enrolled_students.map((studentObj: any) => (
                      <Badge
                        key={studentObj.student_id}
                        variant="outline"
                        className="bg-background"
                      >
                        {studentObj.student_name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      No students enrolled yet.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Assigned Faculty
                </h4>
                <div className="flex flex-wrap gap-2">
                  {batch.assigned_faculty && batch.assigned_faculty.length > 0 ? (
                    batch.assigned_faculty.map((facultyObj: any) => {
                      const subjId = facultyObj.subject_id;
                      const subjName = subjId ? (subjects.find((s: any) => s.id === subjId)?.name || subjId) : "";
                      return (
                        <Badge key={`${facultyObj.faculty_id}-${subjId || "general"}`} variant="secondary">
                          {facultyObj.faculty_name} {subjName ? `(${subjName})` : ""}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      No faculty assigned yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteBatch}
        title="Delete Batch"
        description={`Are you sure you want to delete ${batch.name}? This action cannot be undone.`}
        confirmText="Delete Batch"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
