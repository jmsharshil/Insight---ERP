import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { courseAction, batchAction } from "@/redux/actions";
import {
  setCourses,
  setCoursesLoading,
  setCoursesError,
  addCourseToList,
} from "@/redux/slices/coursesSlice";
import { API } from "@/service/api";

import CoursesTab from "./components/CoursesTab";
import CourseSheet from "./components/CourseSheet";
import BatchesTab from "./components/BatchesTab";
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

  useEffect(() => {
    setPageTitle("Courses & Batches");
  }, [setPageTitle]);

  const [activeSubTab, setActiveSubTab] = useState("courses");
  const [courseSheetOpen, setCourseSheetOpen] = useState(false);
  const [courseUpdateLoading, setCourseUpdateLoading] = useState(false);

  // Batch Management States
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);

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
    location: "Campus 1",
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
      location: "Campus 1",
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
          enrolled_students: [...(batchForm.enrolled_students || []), { student_id: studentId, student_name: studentName }],
        });
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to assign student"),
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
          enrolled_students: batchForm.enrolled_students?.filter((s: any) => s.student_id !== studentId),
        });
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to remove student"),
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
          assigned_faculty: [...(batchForm.assigned_faculty || []), { faculty_id: facultyId, faculty_name: facultyName }],
        });
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to assign faculty"),
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
          assigned_faculty: batchForm.assigned_faculty?.filter((f: any) => f.faculty_id !== facultyId),
        });
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || "Failed to remove faculty"),
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
    user && ["super_admin", "branch_manager", "admin_senior_exec"].includes(user.role);

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
        title={activeSubTab === "courses" ? "Courses" : "Student Batches"}
        subtitle={
          activeSubTab === "courses"
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
            <TabsTrigger value="batches">Batches</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-0">
            <CoursesTab
              courses={courses}
              loading={coursesLoading}
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
                    const msg = err?.response?.data?.message || err?.message || "Failed to fetch courses";
                    dispatch(setCoursesError(msg));
                    toast.error(msg);
                  },
                });
              }}
            />
          </TabsContent>

          <TabsContent value="batches" className="mt-0">
            <BatchesTab
              batches={batches}
              loading={batchesLoading}
              error={batchesError}
              courses={courses}
              canEdit={!!canEdit}
              openEditBatchModal={openEditBatchModal}
              openDeleteBatchConfirm={openDeleteBatchConfirm}
              onViewTimetable={(batchName) => {
                // Now navigates to the dedicated classroom timetable route
                navigate("/classroom-timetable");
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
    </div>
  );
}
