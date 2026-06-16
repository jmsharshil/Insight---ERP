import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { studentActions, batchAction } from "@/redux/actions";
import { setStudents, setStudentsLoading, setStudentsError } from "@/redux/slices/studentSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, GraduationCap, UserCheck, Award, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealStudent } from "@/redux/slices/studentSlice";
import { TableSkeleton } from "@/components/common/Skeletons";

export default function StudentsTab() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const { user } = useAuth();
  
  const [selectedStudent, setSelectedStudent] = useState<RealStudent | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const { students, loading: studentsLoading } = useSelector((state: RootState) => state.students);
  const isSuperAdmin = user?.role === "super_admin";

  const filteredStudents = useMemo(() => {
    if (!user || user.role === "super_admin" || !user.branch) return students;
    return students.filter((s: any) => {
      const branchId = typeof s.branch === "object" && s.branch !== null ? s.branch.id : s.branch;
      return branchId === user.branch;
    });
  }, [students, user]);

  const fetchStudents = () => {
    dispatch({
      type: studentActions.GET_STUDENTS,
      method: "GET",
      endPoint: API.STUDENTS.LIST,
      auth: true,
      setLoading: (val: boolean) => dispatch(setStudentsLoading(val)),
      getResponse: (res: any) => {
        if (res?.success && res?.data) {
          dispatch(setStudents({ data: res.data, count: res.count }));
        } else {
          dispatch(setStudentsError("Unexpected response format"));
          toast.error("Failed to load students data.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch students";
        dispatch(setStudentsError(msg));
        toast.error(msg);
      },
    });
  };

  useEffect(() => {
    fetchStudents();
  }, [dispatch, toast]);

  useEffect(() => {
    if (!assignModalOpen) return;
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: "/api/v1/batches/",
      auth: true,
      setLoading: setBatchesLoading,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data || res || [];
        setBatches(Array.isArray(data) ? data : []);
      },
      getError: () => {
        toast.error("Failed to load batches list");
      }
    });
  }, [assignModalOpen, dispatch]);

  const handleOpenAssignModal = (student: RealStudent) => {
    setSelectedStudent(student);
    setAssignModalOpen(true);
    setSelectedBatchId("");
    
    // Fetch full student details to get the exact batch ID and latest info
    dispatch({
      type: studentActions.GET_STUDENT_DETAIL,
      method: "GET",
      endPoint: API.STUDENTS.GET(student.id),
      auth: true,
      getResponse: (res: any) => {
        const fullStudent = res?.data || res;
        console.log("Full Student Detail response:", fullStudent);
        if (fullStudent) {
          setSelectedStudent(fullStudent);
        }
      },
      getError: () => {
        // Fallback to the list student object if detail fetch fails
      }
    });
  };

  const handleRemoveStudentFromBatch = (student: any) => {
    const currentBatchId = student.batch;
    if (!currentBatchId) {
      toast.error("No batch assigned to this student.");
      return;
    }
    
    setAssignLoading(true);
    dispatch({
      type: batchAction.REMOVE_STUDENT,
      method: "POST",
      endPoint: API.BATCHES.REMOVE_STUDENT(currentBatchId, student.id),
      auth: true,
      getResponse: () => {
        toast.success("Student removed from batch successfully.");
        setSelectedStudent({
          ...student,
          batch: null,
          batch_name: "",
          current_batch_name: "",
          batch_attempt: ""
        });
        setAssignLoading(false);
        fetchStudents();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to remove student");
        setAssignLoading(false);
      }
    });
  };

  const handleAssignStudentToBatch = () => {
    if (!selectedStudent || !selectedBatchId) return;
    
    setAssignLoading(true);
    dispatch({
      type: batchAction.ASSIGN_STUDENT,
      method: "POST",
      endPoint: API.BATCHES.ASSIGN_STUDENT(selectedBatchId),
      body: { student_ids: [selectedStudent.id] },
      auth: true,
      getResponse: () => {
        toast.success("Student assigned to batch successfully.");
        const assignedBatch = batches.find((b) => b.id === selectedBatchId);
        
        setSelectedStudent({
          ...selectedStudent,
          batch: selectedBatchId,
          batch_name: assignedBatch?.name || "",
          current_batch_name: assignedBatch?.name || "",
          batch_attempt: assignedBatch?.batch_attempt || ""
        });
        
        setAssignLoading(false);
        setAssignModalOpen(false);
        fetchStudents();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to assign student");
        setAssignLoading(false);
      }
    });
  };


  const cols: DataTableColumn<RealStudent>[] = [
    {
      key: "name",
      header: "Student",
      render: (r) => (
        <button
          onClick={() => navigate(`/students/${r.id}`)}
          className="flex items-center gap-2 hover:text-primary-dark"
        >
          {r.photo_url ? (
            <img
              src={r.photo_url}
              alt={r.full_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark grid place-items-center text-xs font-medium">
              {r.full_name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
          <span className="font-medium">{r.full_name}</span>
        </button>
      ),
    },
    {
      key: "admissionNumber",
      header: "Admission No",
      className: "font-mono text-xs",
      render: (r) => r.admission_number,
    },
    {
      key: "course",
      header: "Course",
      render: (r) => <span className="capitalize">{r.course.replace(/_/g, " ")}</span>,
    },
    {
      key: "batch",
      header: "Batch",
      render: (r) => <span className="capitalize">{r.batch_attempt}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (r) => (
        <div className="text-xs">
          <div>{r.phone_student}</div>
          <div className="text-muted-foreground">{r.email}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        let bg = "bg-gray-100",
          text = "text-gray-700";
        if (r.status === "active") {
          bg = "bg-green-100";
          text = "text-green-700";
        }
        if (r.status === "inactive") {
          bg = "bg-red-100";
          text = "text-red-700";
        }
        if (r.status === "alumni") {
          bg = "bg-purple-100";
          text = "text-purple-700";
        }
        return (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              bg,
              text,
            )}
          >
            {r.status_display}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/students/${r.id}`);
              }}
            >
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAssignModal(r);
              }}
            >
              Assign and Remove Batch
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStudentFromBatch(r);
              }}
            >
              Remove from Batch
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (studentsLoading && students.length === 0) {
    return <TableSkeleton columns={7} rows={6} className="mt-0" />;
  }

  return (
    <div className="mt-0 space-y-6">
      <DataTable 
        columns={cols} 
        data={filteredStudents} 
        exportable={isSuperAdmin || user?.role === "branch_manager"} 
        onRowClick={(r) => navigate(`/students/${r.id}`)}
      />

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Batch</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Student Details
                </span>
                <p className="font-semibold text-text-primary text-base">
                  {selectedStudent.full_name}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Course: <strong className="capitalize">{selectedStudent.course?.replace(/_/g, " ")}</strong></span>
                  <span>•</span>
                  <span>Module: <strong className="capitalize">{selectedStudent.group_module?.replace(/_/g, " ")}</strong></span>
                </div>
              </div>

              {/* Current Batch Info */}
              <div className="rounded-lg bg-muted/20 border border-border/40 p-3 space-y-2">
                <span className="text-xs font-medium text-muted-foreground block">
                  Current Enrollment Status
                </span>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {selectedStudent.batch_name || (selectedStudent as any).current_batch_name || selectedStudent.batch_attempt || "No batch assigned"}
                    </p>
                  </div>
                  {/* If they are currently assigned, let them remove */}
                  {((selectedStudent as any).batch || (selectedStudent as any).batch_name) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveStudentFromBatch(selectedStudent)}
                      disabled={assignLoading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Assign New Batch Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Assign to Batch
                </label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="w-full bg-muted/10">
                    <SelectValue placeholder={batchesLoading ? "Loading batches..." : "Select a batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.length === 0 ? (
                      <SelectItem value="no_batches" disabled>
                        No active batches found
                      </SelectItem>
                    ) : (
                      batches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} ({b.course_name || "General"})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignStudentToBatch}
              disabled={!selectedBatchId || assignLoading}
              className="bg-primary hover:bg-primary-dark"
            >
              {assignLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
