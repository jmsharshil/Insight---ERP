import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { batchAction, dropdownActions, studentActions, feesActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useDropdown } from "@/hooks/useDropdown";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  MapPin,
  BookOpen,
  Edit2,
  X,
  ArrowLeft,
  Trash2,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  fee_structure: string;
  branch: string;
  start_date: string;
  end_date: string;
  max_students: number;
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
    user && ["super_admin", "branch_manager", "admin_senior_executive"].includes(user.role);

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Read mode from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode = searchParams.get("mode") === "edit" ? "edit" : "view";
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [feeStructuresLoading, setFeeStructuresLoading] = useState(false);
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
    fee_structure: "",
    branch: "",
    start_date: "",
    end_date: "",
    max_students: 50,
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
            fee_structure: String(data.fee_structure || ""),
            branch: String(data.branch || ""),
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            max_students: data.max_students || 50,
          });
          setLoading(false);
        },
        getError: (err: any) => {
          toast.error("Failed to load batch details");
          setLoading(false);
        },
      });
    }

    // Fetch Fee structures
    setFeeStructuresLoading(true);
    dispatch({
      type: feesActions.GET_FEE_STRUCTURES,
      method: "GET",
      endPoint: API.FEES.STRUCTURES,
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data?.results || res?.results || res?.data || res;
        if (Array.isArray(data)) {
          setFeeStructures(data);
        }
        setFeeStructuresLoading(false);
      },
      getError: () => {
        setFeeStructuresLoading(false);
      },
    });

  }, [dispatch, id]);

  const handleSave = () => {
    if (!batchForm.fee_structure) return toast.error("Fee structure is required.");
    if (!batchForm.branch) return toast.error("Branch is required.");

    const payload = {
      ...batchForm,
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

  const handleDeleteBatch = () => {
    dispatch({
      type: batchAction.DELETE_BATCH,
      method: "DELETE",
      endPoint: API.BATCHES.DELETE(id!),
      auth: true,
      getResponse: () => {
        toast.success("Batch deleted successfully.");
        navigate(-1);
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
            onClick={() => navigate(-1)}
            className="rounded-full border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader title={batch.name || "Batch Detail"} subtitle={batch.course_name || "Manage batch details"} />
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
                <Label>Fee Structure *</Label>
                <Select
                  value={batchForm.fee_structure}
                  onValueChange={(val) => setBatchForm({ ...batchForm, fee_structure: val })}
                  disabled={feeStructuresLoading}
                >
                  <SelectTrigger className="bg-muted/10">
                    <SelectValue placeholder={feeStructuresLoading ? "Loading..." : "Select fee structure"} />
                  </SelectTrigger>
                  <SelectContent>
                    {feeStructures.map((fs: any) => (
                      <SelectItem key={fs.id} value={String(fs.id)}>
                        {fs.name} {fs.total_amount ? `(₹${fs.total_amount})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Branch *</Label>
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
            </div>

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
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-8 w-full">
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {batch.name && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Batch Name
                      </span>
                      <p className="font-medium">{batch.name}</p>
                    </div>
                  )}
                  {batch.course_name && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Course
                      </span>
                      <p className="font-medium">{batch.course_name || "-"}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Fee Structure
                    </span>
                    <p className="font-medium">{batch.fee_structure_name || batch.fee_structure || "-"}</p>
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

                {(batch.enrolled_students?.length > 0 || batch.assigned_faculty?.length > 0) && (
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
                            No students enrolled.
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
                            const subjName = facultyObj.subject_name;
                            return (
                              <Badge key={`${facultyObj.faculty_id}-${facultyObj.subject_id || "general"}`} variant="secondary">
                                {facultyObj.faculty_name} {subjName ? `(${subjName})` : ""}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No faculty assigned.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
