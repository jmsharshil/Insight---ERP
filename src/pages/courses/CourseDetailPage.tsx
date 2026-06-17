import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, Save, X, BookOpen, Clock, Wallet, ShieldAlert, Plus, Loader2 } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { RootState } from "@/store";
import { courseAction, subjectAction } from "@/redux/actions";
import { API } from "@/service/api";
import { cn } from "@/lib/utils";
import {
  setSelectedCourse,
  setSelectedCourseLoading,
  removeCourseFromList,
  updateCourseInList,
  addSubjectToCourse,
  updateSubjectInCourse,
  removeSubjectFromCourse,
  SubjectRecord,
} from "@/redux/slices/coursesSlice";

function CourseDetailSkeleton() {
  return (
    <div className="mx-auto space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton width={200} height={32} className="mb-2" />
          <Skeleton width={300} height={16} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={100} height={36} className="rounded-md" />
          <Skeleton width={100} height={36} className="rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton width={150} height={24} />
              <Skeleton width={60} height={20} borderRadius={12} />
            </CardHeader>
            <CardContent>
              <Skeleton count={3} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton width={180} height={24} />
              <Skeleton width={100} height={32} className="rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
                    <Skeleton width="60%" height={20} className="mb-2" />
                    <Skeleton width="40%" height={14} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton width={120} height={24} />
            </CardHeader>
            <CardContent className="space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton width={80} height={14} />
                  <Skeleton width={120} height={18} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  const { selectedCourse, selectedCourseLoading } = useSelector(
    (state: RootState) => state.courses,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [courseUpdateLoading, setCourseUpdateLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [courseEditForm, setCourseEditForm] = useState({
    name: "",
    code: "",
    description: "",
    course_type: "cseet",
    duration_months: 12,
    fee_amount: "",
    is_active: true,
  });

  // Subject Management States
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    total_hours: 60 as string | number,
    is_active: true,
  });
  const [subjectDeleteConfirmOpen, setSubjectDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectRecord | null>(null);
  const [subjectActionLoading, setSubjectActionLoading] = useState(false);

  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_executive"].includes(user.role);

  const canDelete =
    user && ["super_admin", "branch_manager"].includes(user.role);

  // Fetch course details on mount
  useEffect(() => {
    if (!id) return;
    dispatch(setSelectedCourse(null));
    dispatch({
      type: courseAction.GET_COURSE_DETAILS,
      method: "GET",
      endPoint: API.COURSES.DETAIL(id),
      auth: true,
      setLoading: (val: boolean) => dispatch(setSelectedCourseLoading(val)),
      getResponse: (res: any) => {
        const courseData = res?.data ?? res;
        if (courseData?.id) {
          dispatch(setSelectedCourse(courseData));
        } else {
          toast.error("Failed to load course details.");
        }
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to fetch course details";
        toast.error(msg);
      },
    });
  }, [id, dispatch, toast]);

  // Sync form state when selected course loads or edits start
  const startEditing = () => {
    if (!selectedCourse) return;
    setCourseEditForm({
      name: selectedCourse.name || "",
      code: selectedCourse.code || "",
      description: selectedCourse.description || "",
      course_type: selectedCourse.course_type || "cseet",
      duration_months: Number(selectedCourse.duration_months) || 12,
      fee_amount: selectedCourse.fee_amount || "",
      is_active: selectedCourse.is_active !== false,
    });
    setIsEditing(true);
  };

  const handleUpdateCourse = () => {
    if (!id || !selectedCourse) return;
    if (!courseEditForm.name.trim()) {
      toast.error("Course name is required.");
      return;
    }
    dispatch({
      type: courseAction.UPDATE_COURSE,
      method: "PATCH",
      endPoint: API.COURSES.UPDATE(id),
      body: courseEditForm,
      auth: true,
      setLoading: (val: boolean) => setCourseUpdateLoading(val),
      getResponse: (res: any) => {
        const updatedCourse = res?.data ?? res;
        if (updatedCourse?.id) {
          dispatch(updateCourseInList(updatedCourse));
          toast.success("Course updated successfully.");
          setIsEditing(false);
        } else {
          toast.error("Unexpected response from server.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to update course";
        toast.error(msg);
      },
    });
  };

  const handleDeleteCourse = () => {
    if (!id || !selectedCourse) return;
    dispatch({
      type: courseAction.DELETE_COURSE,
      method: "DELETE",
      endPoint: API.COURSES.DELETE(id),
      auth: true,
      getResponse: () => {
        dispatch(removeCourseFromList(id));
        toast.success("Course deleted successfully.");
        setDeleteConfirmOpen(false);
        navigate(-1);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete course";
        toast.error(msg);
      },
    });
  };

  // Subject Handlers
  const openAddSubjectModal = () => {
    setSubjectForm({
      name: "",
      code: "",
      total_hours: 60,
      is_active: true,
    });
    setIsEditingSubject(false);
    setEditingSubject(null);
    setSubjectDialogOpen(true);
  };

  const openEditSubjectModal = (subject: SubjectRecord) => {
    setSubjectForm({
      name: subject.name || "",
      code: subject.code || "",
      total_hours: subject.total_hours || "",
      is_active: subject.is_active !== false,
    });
    setIsEditingSubject(true);
    setEditingSubject(subject);
    setSubjectDialogOpen(true);
  };

  const handleSaveSubject = () => {
    if (!id) return;
    if (!subjectForm.name.trim()) {
      toast.error("Subject name is required.");
      return;
    }
    const hours = Number(subjectForm.total_hours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Total hours must be a positive number.");
      return;
    }

    const payload = {
      course: id,
      name: subjectForm.name,
      code: subjectForm.code,
      total_hours: hours,
      is_active: subjectForm.is_active,
    };

    if (isEditingSubject && editingSubject) {
      dispatch({
        type: subjectAction.UPDATE_SUBJECT,
        method: "PATCH",
        endPoint: API.SUBJECTS.UPDATE(editingSubject.id),
        body: payload,
        auth: true,
        setLoading: (val: boolean) => setSubjectActionLoading(val),
        getResponse: (res: any) => {
          const updated = res?.data ?? res;
          if (updated?.id) {
            dispatch(updateSubjectInCourse(updated));
            toast.success("Subject updated successfully.");
            setSubjectDialogOpen(false);
          } else {
            toast.error("Unexpected response from server.");
          }
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to update subject";
          toast.error(msg);
        },
      });
    } else {
      dispatch({
        type: subjectAction.CREATE_SUBJECT,
        method: "POST",
        endPoint: API.SUBJECTS.CREATE,
        body: payload,
        auth: true,
        setLoading: (val: boolean) => setSubjectActionLoading(val),
        getResponse: (res: any) => {
          const created = res?.data ?? res;
          if (created?.id) {
            dispatch(addSubjectToCourse(created));
            toast.success("Subject added successfully.");
            setSubjectDialogOpen(false);
          } else {
            toast.error("Unexpected response from server.");
          }
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to add subject";
          toast.error(msg);
        },
      });
    }
  };

  const openDeleteSubjectConfirm = (subject: SubjectRecord) => {
    setSubjectToDelete(subject);
    setSubjectDeleteConfirmOpen(true);
  };

  const handleDeleteSubject = () => {
    if (!id || !subjectToDelete) return;
    dispatch({
      type: subjectAction.DELETE_SUBJECT,
      method: "DELETE",
      endPoint: API.SUBJECTS.DELETE(subjectToDelete.id),
      auth: true,
      setLoading: (val: boolean) => setSubjectActionLoading(val),
      getResponse: () => {
        dispatch(removeSubjectFromCourse({ courseId: id, subjectId: subjectToDelete.id }));
        toast.success("Subject deleted successfully.");
        setSubjectDeleteConfirmOpen(false);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete subject";
        toast.error(msg);
      },
    });
  };

  if (selectedCourseLoading && !isEditing) {
    return <CourseDetailSkeleton />;
  }

  if (!selectedCourse && !selectedCourseLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h3 className="text-lg font-semibold">Course Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested course could not be loaded or does not exist.</p>
        <Button onClick={() => navigate("/timetable")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isEditing ? `Edit Course` : selectedCourse.name}
        subtitle={isEditing ? "Modify course properties below." : `Course details and syllabus schedule.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {canEdit && !isEditing && (
              <>
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                {canDelete && (
                  <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {isEditing ? (
        /* ─── EDIT MODE ─── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Edit Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="course-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Name</Label>
                  <Input
                    id="course-name"
                    value={courseEditForm.name}
                    onChange={(e) => setCourseEditForm({ ...courseEditForm, name: e.target.value })}
                    placeholder="e.g. Business Management"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="course-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Textarea
                    id="course-desc"
                    value={courseEditForm.description}
                    onChange={(e) => setCourseEditForm({ ...courseEditForm, description: e.target.value })}
                    placeholder="Brief description of the course..."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Edit Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-1">
                  <Label htmlFor="course-type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Type</Label>
                  <Select
                    value={courseEditForm.course_type}
                    onValueChange={(val) => setCourseEditForm({ ...courseEditForm, course_type: val })}
                  >
                    <SelectTrigger id="course-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cseet">CSEET</SelectItem>
                      <SelectItem value="cs_executive">CS Executive</SelectItem>
                      <SelectItem value="cs_professional">CS Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="course-duration" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration (Months)</Label>
                  <Input
                    id="course-duration"
                    type="number"
                    value={courseEditForm.duration_months}
                    onChange={(e) => setCourseEditForm({ ...courseEditForm, duration_months: Number(e.target.value) })}
                    placeholder="e.g. 12"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="course-fees" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fee Amount</Label>
                  <Input
                    id="course-fees"
                    type="number"
                    value={courseEditForm.fee_amount}
                    onChange={(e) => setCourseEditForm({ ...courseEditForm, fee_amount: e.target.value })}
                    placeholder="e.g. 52000"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
                  <Label htmlFor="course-active" className="text-xs font-semibold text-text-primary cursor-pointer">
                    Active Status
                  </Label>
                  <Switch
                    id="course-active"
                    checked={courseEditForm.is_active}
                    onCheckedChange={(checked) => setCourseEditForm({ ...courseEditForm, is_active: checked })}
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)} disabled={courseUpdateLoading}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleUpdateCourse} disabled={courseUpdateLoading}>
                    <Save className="w-4 h-4 mr-2" /> {courseUpdateLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : (
        /* ─── DISPLAY MODE ─── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main details panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Overview</CardTitle>
                  {selectedCourse.is_active !== undefined && (
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        selectedCourse.is_active
                          ? "bg-green-500/10 text-green-600"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {selectedCourse.is_active ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base text-text-primary leading-relaxed">
                  {selectedCourse.description || "No description provided for this course."}
                </p>
              </CardContent>
            </Card>

            {/* Subjects Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Syllabus Subjects ({selectedCourse.subjects?.length || 0})
                </CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={openAddSubjectModal} className="h-8">
                    <Plus className="w-4 h-4 mr-1" /> Add Subject
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {selectedCourse.subjects && selectedCourse.subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCourse.subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="rounded-xl border border-border bg-muted/20 p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-text-primary">{subject.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[10px]">{subject.code}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {subject.total_hours}h</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                              subject.is_active
                                ? "bg-green-500/10 text-green-600"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {subject.is_active ? "Active" : "Inactive"}
                          </span>
                          {canEdit && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                                onClick={() => openEditSubjectModal(subject)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {canDelete && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                  onClick={() => openDeleteSubjectConfirm(subject)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                    <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                    No subjects registered for this course yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar parameters panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  {selectedCourse.code && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Code</p>
                      <p className="text-sm font-medium">{selectedCourse.code}</p>
                    </div>
                  )}

                  {selectedCourse.course_type && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</p>
                      <p className="text-sm font-medium capitalize">
                        {selectedCourse.course_type.replace(/_/g, " ")}
                      </p>
                    </div>
                  )}

                  {(selectedCourse.duration_months != null || selectedCourse.duration) && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Duration
                      </p>
                      <p className="text-sm font-medium">
                        {selectedCourse.duration_months != null
                          ? `${selectedCourse.duration_months} Months`
                          : selectedCourse.duration}
                      </p>
                    </div>
                  )}

                  {selectedCourse.fee_amount && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Fee Amount
                      </p>
                      <p className="text-sm font-medium">
                        ₹{Number(selectedCourse.fee_amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}

                  {selectedCourse.created_at && (
                    <div className="space-y-1 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created At</p>
                      <p className="text-xs font-medium text-muted-foreground">{selectedCourse.created_at}</p>
                    </div>
                  )}

                  {selectedCourse.updated_at && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Updated At</p>
                      <p className="text-xs font-medium text-muted-foreground">{selectedCourse.updated_at}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${selectedCourse?.name}"?`}
        description="This action cannot be undone. All associated subjects will also be removed."
        confirmLabel="Delete"
        onConfirm={handleDeleteCourse}
      />

      {/* Subject Add/Edit Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="subject-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject Name</Label>
              <Input
                id="subject-name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Corporate Law"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subject-hours" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Hours</Label>
              <Input
                id="subject-hours"
                type="number"
                value={subjectForm.total_hours}
                onChange={(e) => setSubjectForm({ ...subjectForm, total_hours: e.target.value })}
                placeholder="e.g. 60"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
              <Label htmlFor="subject-active" className="text-xs font-semibold text-text-primary cursor-pointer">
                Active Status
              </Label>
              <Switch
                id="subject-active"
                checked={subjectForm.is_active}
                onCheckedChange={(checked) => setSubjectForm({ ...subjectForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSubjectDialogOpen(false)} disabled={subjectActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubject} disabled={subjectActionLoading} className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]">
              {subjectActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation Dialog */}
      <ConfirmDialog
        open={subjectDeleteConfirmOpen}
        onOpenChange={setSubjectDeleteConfirmOpen}
        title={`Delete "${subjectToDelete?.name}"?`}
        description="This action cannot be undone. All associated timetable and scheduling records for this subject may be affected."
        confirmLabel="Delete"
        onConfirm={handleDeleteSubject}
      />
    </div>
  );
}
