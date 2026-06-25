import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/common/ConfirmDialog";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { courseAction, batchAction, ClassroomAction, studentActions } from "@/redux/actions";
import {
  setCourses,
  setCoursesLoading,
  setCoursesError,
  addCourseToList,
} from "@/redux/slices/coursesSlice";
import {
  setClassrooms,
  addClassroom,
  updateClassroom,
  deleteClassroom,
} from "@/redux/slices/classroomSlice";
import { API } from "@/service/api";

import CoursesTab from "./components/CoursesTab";
import CourseSheet from "./components/CourseSheet";
import BatchesTab from "./components/BatchesTab";
import ClassroomTab from "./components/ClassroomTab";
import ClassroomSheet from "./components/ClassroomSheet";
import LevelsTab from "./components/LevelsTab";
import BatchDetailsSheet, { SheetMode } from "./components/BatchDetailsModal";

export default function CoursesBatchesPage() {
  const navigate = useNavigate();
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();

  const {
    courses,
    loading: coursesLoading,
    error: coursesError,
  } = useSelector((state: RootState) => state.courses);

  const isStudent = user?.role === "student" || user?.role === "parent" || user?.role === "parents";

  // Student detail state — used to filter courses & batches for student role
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  useEffect(() => {
    setPageTitle("Courses & Batches");
  }, [setPageTitle]);

  // Fetch student detail when logged in as student
  useEffect(() => {
    const targetStudentId = user?.linked_student || user?.id;
    if (isStudent && targetStudentId) {
      setStudentDetailLoading(true);
      dispatch({
        type: studentActions.GET_STUDENT_DETAIL,
        method: "GET",
        endPoint: API.STUDENTS.GET(targetStudentId),
        auth: true,
        setLoading: (val: boolean) => setStudentDetailLoading(val),
        getResponse: (res: any) => {
          const data = res?.data ?? res;
          setStudentDetail(data);
          setStudentDetailLoading(false);
        },
        getError: () => {
          setStudentDetailLoading(false);
        },
      });
    }
  }, [isStudent, user?.linked_student, dispatch]);

  // Compute student's assigned course/batch IDs for filtering
  const studentCourseId = studentDetail?.course || null;
  const studentBatchIds = useMemo(() => {
    if (!studentDetail) return new Set<string>();
    const ids = new Set<string>();
    if (studentDetail.batch) ids.add(String(studentDetail.batch));
    if (studentDetail.batch_history) {
      studentDetail.batch_history.forEach((bh: any) => {
        if (bh.batch || bh.batch_id) ids.add(String(bh.batch || bh.batch_id));
      });
    }
    return ids;
  }, [studentDetail]);

  const [params, setParams] = useSearchParams();
  const activeSubTab = params.get("tab") || "courses";

  const setActiveSubTab = (tab: string) => {
    setParams((prev) => {
      prev.set("tab", tab);
      return prev;
    }, { replace: true });
  };
  const [courseSheetOpen, setCourseSheetOpen] = useState(false);
  const [courseUpdateLoading, setCourseUpdateLoading] = useState(false);

  // Batch Management States
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  // Classroom States
  const { classrooms, isLoading: classroomsLoading } = useSelector((state: RootState) => state.classRoom);
  const [classroomSheetOpen, setClassroomSheetOpen] = useState(false);
  const [classroomUpdateLoading, setClassroomUpdateLoading] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any>(null);
  const [classroomDeleteConfirmOpen, setClassroomDeleteConfirmOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<any>(null);

  useEffect(() => {
    if (activeSubTab === "classrooms") {
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
  }, [dispatch, activeSubTab]);

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

  // Unified Sheet State
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<any>(null);

  const [batchForm, setBatchForm] = useState<any>({
    course: "",
    name: "",
    batch_code: "",
    group_module: "module_1",
    batch_attempt: "june",
    branch: "",
    start_date: "2026-07-01",
    end_date: "2027-01-31",
    max_students: 50,
    timing: "09:00-12:00",
    is_active: true,
    enrolled_students: [],
    assigned_faculty: [],
  });
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<any>(null);

  const fetchBatchesList = () => {
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: API.BATCHES.LIST,
      auth: true,
      setLoading: (val: boolean) => setBatchesLoading(val),
      getResponse: (res: any) => {
        if (res?.data) {
          setBatches(Array.isArray(res.data) ? res.data : []);
        } else if (Array.isArray(res)) {
          setBatches(res);
        } else {
          setBatchesError("Unexpected response format");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch batches";
        setBatchesError(msg);
      },
    });
  };

  const openAddBatchModal = () => {
    setBatchForm({
      course: courses[0]?.id || "",
      name: "",
      batch_code: "",
      group_module: "module_1",
      batch_attempt: "june",
      branch: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      max_students: 50,
      timing: "09:00-12:00",
      is_active: true,
      enrolled_students: [],
      assigned_faculty: [],
    });
    setEditingBatch(null);
    setSheetMode("create");
  };

  const openEditBatchModal = (b: any) => {
    navigate(`/courses-batches/batch/${b.id}?mode=edit`);
  };

  const handleAssignStudent = (studentId: string, studentName?: string) => {
    if (!editingBatch) return;
    dispatch({
      type: batchAction.ASSIGN_STUDENT,
      method: "POST",
      endPoint: API.BATCHES.ASSIGN_STUDENT(editingBatch.id),
      body: { student_ids: [studentId] },
      auth: true,
      getResponse: () => {
        toast.success("Student assigned successfully.");
        setBatchForm({
          ...batchForm,
          enrolled_students: [
            ...(batchForm.enrolled_students || []),
            { student_id: studentId, student_name: studentName },
          ],
        });
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to assign student"),
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!editingBatch) return;
    dispatch({
      type: batchAction.REMOVE_STUDENT,
      method: "POST",
      endPoint: API.BATCHES.REMOVE_STUDENT(editingBatch.id, studentId),
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

  const handleAssignFaculty = (facultyId: string, facultyName?: string) => {
    if (!editingBatch) return;
    dispatch({
      type: "ASSIGN_FACULTY",
      method: "POST",
      endPoint: API.BATCHES.ASSIGN_FACULTY(editingBatch.id),
      body: { faculty_id: facultyId },
      auth: true,
      getResponse: () => {
        toast.success("Faculty assigned successfully.");
        setBatchForm({
          ...batchForm,
          assigned_faculty: [
            ...(batchForm.assigned_faculty || []),
            { faculty_id: facultyId, faculty_name: facultyName },
          ],
        });
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to assign faculty"),
    });
  };

  const handleRemoveFaculty = (facultyId: string) => {
    if (!editingBatch) return;
    dispatch({
      type: "REMOVE_FACULTY",
      method: "POST",
      endPoint: API.BATCHES.REMOVE_FACULTY(editingBatch.id, facultyId),
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

  const handleSaveBatch = () => {
    if (!batchForm.name.trim()) {
      toast.error("Batch name is required.");
      return;
    }
    if (!batchForm.course.trim()) {
      toast.error("Course is required.");
      return;
    }

    if (sheetMode === "edit" && editingBatch) {
      dispatch({
        type: batchAction.UPDATE_BATCH,
        method: "PATCH",
        endPoint: API.BATCHES.UPDATE(editingBatch.id),
        body: batchForm,
        auth: true,
        getResponse: (res: any) => {
          const updated = res?.data ?? res;
          setBatches((prev) =>
            prev.map((b) => (b.id === editingBatch.id ? { ...b, ...updated } : b)),
          );
          toast.success("Batch updated successfully.");
          setSheetMode(null);
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to update batch";
          toast.error(msg);
        },
      });
    } else {
      dispatch({
        type: batchAction.CREATE_BATCH,
        method: "POST",
        endPoint: API.BATCHES.CREATE,
        body: batchForm,
        auth: true,
        getResponse: (res: any) => {
          const created = res?.data ?? res;
          setBatches((prev) => [...prev, created]);
          toast.success("Batch created successfully.");
          setSheetMode(null);
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to create batch";
          toast.error(msg);
        },
      });
    }
  };

  const openDeleteBatchConfirm = (b: any) => {
    setBatchToDelete(b);
    setBatchDeleteConfirmOpen(true);
  };

  const handleDeleteBatch = () => {
    if (!batchToDelete) return;
    dispatch({
      type: batchAction.DELETE_BATCH,
      method: "DELETE",
      endPoint: API.BATCHES.DELETE(batchToDelete.id),
      auth: true,
      getResponse: () => {
        setBatches((prev) => prev.filter((b) => b.id !== batchToDelete.id));
        toast.success("Batch deleted successfully.");
        setBatchDeleteConfirmOpen(false);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete batch";
        toast.error(msg);
      },
    });
  };

  const handleViewBatchDetails = (batchId: string) => {
    navigate(`/courses-batches/batch/${batchId}`);
  };

  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_executive"].includes(user.role);
  
  const canDelete =
    user && ["super_admin", "branch_manager"].includes(user.role);

  // Student-filtered data
  const displayCourses = useMemo(() => {
    if (!isStudent) return courses;
    if (!studentDetail) return [];
    return courses.filter((c) => {
      const matchId = studentDetail.course && String(c.id) === String(studentDetail.course);
      const matchName = studentDetail.course_name && c.name === studentDetail.course_name;
      const matchCode = studentDetail.course && c.code === studentDetail.course;
      const matchString = studentDetail.course && c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === String(studentDetail.course).toLowerCase().replace(/[^a-z0-9]/g, "");
      return matchId || matchName || matchCode || matchString;
    });
  }, [courses, isStudent, studentDetail]);

  const displayBatches = useMemo(() => {
    let filtered = batches;
    if (user && user.role !== "super_admin" && user.branch) {
      filtered = filtered.filter((b: any) => {
        const branchId = typeof b.branch === "object" && b.branch !== null ? b.branch.id : b.branch;
        return branchId === user.branch;
      });
    }

    if (!isStudent) return filtered;
    if (!studentDetail) return [];

    const normalizeStr = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    
    return filtered.filter((b: any) => {
      const matchId = studentBatchIds.has(String(b.id));
      const matchName = studentDetail.batch_name && normalizeStr(b.name) === normalizeStr(studentDetail.batch_name);
      const matchCurrentName = studentDetail.current_batch_name && normalizeStr(b.name) === normalizeStr(studentDetail.current_batch_name);
      const matchCode = studentDetail.batch_name && normalizeStr(b.batch_code) === normalizeStr(studentDetail.batch_name);
      return matchId || matchName || matchCurrentName || matchCode;
    });
  }, [batches, isStudent, studentBatchIds, studentDetail, user]);

  /* ── Fetch course details on card click ── */
  function handleCourseCardClick(courseId: string | number) {
    navigate(`/courses-batches/${courseId}`);
  }

  /* ── Add course click ── */
  function handleAddCourseClick() {
    setCourseSheetOpen(true);
  }

  /* ── Create Course API Call ── */
  function handleCreateCourse(courseForm: any) {
    if (!courseForm.name.trim()) {
      toast.error("Course name is required.");
      return;
    }
    dispatch({
      type: courseAction.CREATE_COURSE,
      method: "POST",
      endPoint: API.COURSES.CREATE,
      body: courseForm,
      auth: true,
      setLoading: (val: boolean) => setCourseUpdateLoading(val),
      getResponse: (res: any) => {
        const createdCourse = res?.data ?? res;
        if (createdCourse?.id) {
          dispatch(addCourseToList(createdCourse));
          toast.success("Course created successfully.");
          setCourseSheetOpen(false);
        } else {
          toast.error("Unexpected response from server.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to create course";
        toast.error(msg);
      },
    });
  }

  useEffect(() => {
    // Always preload courses if they are empty
    if (courses.length === 0 && !coursesLoading) {
      dispatch({
        type: courseAction.GET_COURSES,
        method: "GET",
        endPoint: API.COURSES.LIST,
        auth: true,
        setLoading: (val: boolean) => dispatch(setCoursesLoading(val)),
        getResponse: (res: any) => {
          if (res?.data) {
            dispatch(setCourses(Array.isArray(res.data) ? res.data : []));
          } else if (Array.isArray(res)) {
            dispatch(setCourses(res));
          }
        },
      });
    }

    if (activeSubTab === "courses") {
      dispatch({
        type: courseAction.GET_COURSES,
        method: "GET",
        endPoint: API.COURSES.LIST,
        auth: true,
        setLoading: (val: boolean) => dispatch(setCoursesLoading(val)),
        getResponse: (res: any) => {
          if (res?.data) {
            dispatch(setCourses(Array.isArray(res.data) ? res.data : []));
          } else if (Array.isArray(res)) {
            dispatch(setCourses(res));
          } else {
            dispatch(setCoursesError("Unexpected response format"));
            toast.error("Failed to load courses data.");
          }
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to fetch courses";
          dispatch(setCoursesError(msg));
          toast.error(msg);
        },
      });
    } else if (activeSubTab === "batches") {
      fetchBatchesList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab, dispatch]);

  return (
    <div className="space-y-4 mx-auto w-full pb-10">
      <PageHeader
        title={isStudent ? "My Courses & Batches" : (activeSubTab === "courses" ? "Courses" : "Student Batches")}
        subtitle={
          isStudent
            ? "Your enrolled course and assigned batch."
            : activeSubTab === "courses"
              ? "Manage courses, syllabus, and academic structure."
              : "Manage student batches, classrooms, and mentors."
        }
        actions={
          activeSubTab === "batches" && canEdit ? (
            <Button
              variant="outline"
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
              onClick={openAddBatchModal}
            >
              <Plus className="w-4 h-4" /> Add Batch
            </Button>
          ) : activeSubTab === "classrooms" && canEdit ? (
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
          ) : activeSubTab === "courses" && canEdit ? (
            <Button
              variant="outline"
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
              onClick={handleAddCourseClick}
            >
              <Plus className="w-4 h-4" /> Add Course
            </Button>
          ) : null
        }
      />

      <div className="w-full">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <TabsList className="mb-4 bg-muted/50">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            {!isStudent && <TabsTrigger value="levels">Levels</TabsTrigger>}
            <TabsTrigger value="batches">Batches</TabsTrigger>
            {!isStudent && <TabsTrigger value="classrooms">Classrooms</TabsTrigger>}
          </TabsList>

          <TabsContent value="courses" className="mt-0">
            <CoursesTab
              courses={displayCourses}
              loading={coursesLoading || (isStudent && studentDetailLoading)}
              error={coursesError}
              onCourseClick={handleCourseCardClick}
              onRetry={() => {
                dispatch({
                  type: courseAction.GET_COURSES,
                  method: "GET",
                  endPoint: API.COURSES.LIST,
                  auth: true,
                  setLoading: (val: boolean) => dispatch(setCoursesLoading(val)),
                  getResponse: (res: any) => {
                    if (res?.data) {
                      dispatch(setCourses(Array.isArray(res.data) ? res.data : []));
                    } else if (Array.isArray(res)) {
                      dispatch(setCourses(res));
                    } else {
                      dispatch(setCoursesError("Unexpected response format"));
                      toast.error("Failed to load courses data.");
                    }
                  },
                  getError: (err: any) => {
                    const msg =
                      err?.response?.data?.message || err?.message || "Failed to fetch courses";
                    dispatch(setCoursesError(msg));
                    toast.error(msg);
                  },
                });
              }}
            />
          </TabsContent>

          <TabsContent value="levels" className="mt-0">
            <LevelsTab />
          </TabsContent>

          <TabsContent value="classrooms" className="mt-0">
            <ClassroomTab
              classrooms={classrooms}
              loading={classroomsLoading}
              canEdit={!!canEdit}
              canDelete={!!canDelete}
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

          <TabsContent value="batches" className="mt-0">
            <BatchesTab
              batches={displayBatches}
              loading={batchesLoading || (isStudent && studentDetailLoading)}
              error={batchesError}
              courses={courses}
              canEdit={!!canEdit}
              canDelete={!!canDelete}
              openEditBatchModal={openEditBatchModal}
              openDeleteBatchConfirm={openDeleteBatchConfirm}
              onViewTimetable={(batchName) => {
                // Now navigates to the dedicated classroom timetable route
                navigate("/timetable");
              }}
              onViewBatchDetails={handleViewBatchDetails}
              onRetry={fetchBatchesList}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CourseSheet
        open={courseSheetOpen}
        onOpenChange={setCourseSheetOpen}
        loading={courseUpdateLoading}
        onSave={handleCreateCourse}
      />

      <BatchDetailsSheet
        open={sheetMode !== null}
        onOpenChange={(isOpen) => !isOpen && setSheetMode(null)}
        mode={sheetMode}
        batch={selectedBatchDetails}
        batchForm={batchForm}
        setBatchForm={setBatchForm}
        onSave={handleSaveBatch}
        courses={courses}
        canEdit={!!canEdit}
        onEditClick={() => {
          openEditBatchModal(selectedBatchDetails);
        }}
        onAssignStudent={handleAssignStudent}
        onRemoveStudent={handleRemoveStudent}
        onAssignFaculty={handleAssignFaculty}
        onRemoveFaculty={handleRemoveFaculty}
      />

      <ConfirmDialog
        open={batchDeleteConfirmOpen}
        onOpenChange={setBatchDeleteConfirmOpen}
        title={`Delete "${batchToDelete?.name}"?`}
        description="This action cannot be undone. All timetable scheduling slots for this batch will be lost."
        confirmLabel="Delete"
        onConfirm={handleDeleteBatch}
      />
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
        canDelete={canDelete}
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
