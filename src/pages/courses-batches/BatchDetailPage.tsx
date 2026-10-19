import React, { useEffect, useState, useMemo } from "react";
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
  CreditCard,
  Hash,
  Layers,
  FileText
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
import { formatCurrency, getAvailableYears } from "@/lib/utils";

interface BatchForm {
  fee_structure: string;
  group_module?: string;
  batch_attempt?: string;
  attempt_year?: string;
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
    group_module: "both",
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
            group_module: data.group_module || "both",
            batch_attempt: data.batch_attempt || "june",
            attempt_year: data.attempt_year ? String(data.attempt_year) : getAvailableYears("other", "june")[0],
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

  const getGroupModuleLabel = (mod?: string) => {
    const m = (mod || "").toLowerCase();
    if (m === "module_1") return "Module 1";
    if (m === "module_2") return "Module 2";
    if (m === "module_3") return "Module 3";
    if (m === "module_4") return "Module 4";
    if (m === "module_5") return "Module 5";
    if (m === "both") return "Both Modules";
    return "All Modules";
  };

  const getFeeAmountForModule = (fs: any, mod?: string) => {
    if (!fs) return 0;
    const m = (mod || "").toLowerCase();
    if (m === "module_1") {
      return Number(fs.institute_fees_module_1 || 0) || Number(fs.total_amount || 0);
    }
    if (m === "module_2") {
      return Number(fs.institute_fees_module_2 || 0) || Number(fs.total_amount || 0);
    }
    if (m === "module_3") {
      return Number(fs.institute_fees_module_3 || 0) || Number(fs.total_amount || 0);
    }
    if (m === "module_4") {
      return Number(fs.institute_fees_module_4 || 0) || Number(fs.total_amount || 0);
    }
    if (m === "module_5") {
      return Number(fs.institute_fees_module_5 || 0) || Number(fs.total_amount || 0);
    }
    return Number(
      fs.institute_fees_all_modules ||
      fs.total_amount ||
      fs.institute_fees_both_modules ||
      0
    );
  };

  const selectedFeeStructure = feeStructures.find(
    (fs: any) => String(fs.id) === String(batchForm.fee_structure)
  );
  const currentFeeAmount = getFeeAmountForModule(selectedFeeStructure, batchForm.group_module);

  const courseName = (batch?.course_name || selectedFeeStructure?.course_name || "").toLowerCase();
  const isCseet = courseName.includes("cseet");

  const batchAttempt = batchForm.batch_attempt || "june";
  const computedYears = useMemo(() => {
    return getAvailableYears(isCseet ? "cseet" : "other", batchAttempt, batchForm.group_module);
  }, [isCseet, batchAttempt, batchForm.group_module]);

  const availableYears = useMemo(() => {
    if (batch?.attempt_year && !computedYears.includes(String(batch.attempt_year))) {
      return [String(batch.attempt_year), ...computedYears];
    }
    return computedYears;
  }, [computedYears, batch?.attempt_year]);

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
                    {feeStructures.map((fs: any) => {
                      const amt = getFeeAmountForModule(fs, batchForm.group_module);
                      return (
                        <SelectItem key={fs.id} value={String(fs.id)}>
                          {fs.name} {amt ? `(${formatCurrency(amt)})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Group / Module</Label>
                <Select
                  value={batchForm.group_module || "both"}
                  onValueChange={(val) => setBatchForm({ ...batchForm, group_module: val })}
                >
                  <SelectTrigger className="bg-muted/10">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="both">Both Modules</SelectItem>
                    <SelectItem value="module_1">Module 1</SelectItem>
                    <SelectItem value="module_2">Module 2</SelectItem>
                    <SelectItem value="module_3">Module 3</SelectItem>
                    <SelectItem value="module_4">Module 4</SelectItem>
                    <SelectItem value="module_5">Module 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedFeeStructure && (
                <div className="md:col-span-2 rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground font-medium">
                      Fee Amount ({getGroupModuleLabel(batchForm.group_module)})
                    </span>
                    <div className="text-lg font-bold text-primary font-mono">
                      {formatCurrency(currentFeeAmount)}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
                    {[1, 2, 3, 4, 5].map((mNum) => {
                      const val = Number((selectedFeeStructure as any)[`institute_fees_module_${mNum}`] || 0);
                      if (val <= 0) return null;
                      return (
                        <div key={mNum}>
                          Mod {mNum}: <span className="font-semibold text-foreground">{formatCurrency(val)}</span>
                        </div>
                      );
                    })}
                    <div>All: <span className="font-semibold text-foreground">{formatCurrency(Number(selectedFeeStructure.total_amount))}</span></div>
                  </div>
                </div>
              )}

              {/* Attempt and Year */}
              <div className="space-y-2">
                <Label>Batch Attempt</Label>
                <Select
                  value={batchForm.batch_attempt || "june"}
                  onValueChange={(val: any) => setBatchForm({ ...batchForm, batch_attempt: val })}
                >
                  <SelectTrigger className="bg-muted/10">
                    <SelectValue placeholder="Select attempt" />
                  </SelectTrigger>
                  <SelectContent>
                    {isCseet ? (
                      <>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="oct">October</SelectItem>
                        <SelectItem value="feb">February</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="dec">December</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Attempt Year</Label>
                <Select
                  value={String(batchForm.attempt_year || availableYears[0])}
                  onValueChange={(val: any) => setBatchForm({ ...batchForm, attempt_year: val })}
                >
                  <SelectTrigger className="bg-muted/10">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y: string) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
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
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Batch Name</span>
                      </span>
                      <p className="font-medium break-all">{batch.name}</p>
                    </div>
                  )}
                  {batch.batch_code && (
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Hash className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Batch Code</span>
                      </span>
                      <p className="font-medium break-all">{batch.batch_code}</p>
                    </div>
                  )}
                  {batch.course_name && (
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Course</span>
                      </span>
                      <p className="font-medium break-words">{batch.course_name || "-"}</p>
                    </div>
                  )}
                  {(batch.group_module_display || batch.group_module) && (
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Module</span>
                      </span>
                      <p className="font-medium break-words">
                        {batch.group_module_display || getGroupModuleLabel(batch.group_module)}
                      </p>
                    </div>
                  )}
                  {(batch.batch_attempt_display || batch.attempt_year) && (
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Attempt</span>
                      </span>
                      <p className="font-medium break-words">
                        {batch.batch_attempt_display} {batch.attempt_year}
                      </p>
                    </div>
                  )}
                  {batch.syllabus_name && (
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Syllabus</span>
                      </span>
                      <p className="font-medium break-words">{batch.syllabus_name}</p>
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">Fee Structure</span>
                    </span>
                    <p className="font-medium break-words">{batch.fee_structure_name || batch.fee_structure || "-"}</p>
                  </div>
                  {batch && (batch.fee_structure || batch.fee_structure_name) && (
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">Fee Amount</span>
                      </span>
                      <p className="font-bold text-primary font-mono">
                        {formatCurrency(
                          getFeeAmountForModule(
                            feeStructures.find((fs: any) => String(fs.id) === String(batch.fee_structure)) || {
                              total_amount: batch.total_amount,
                              institute_fees_module_1: batch.institute_fees_module_1,
                              institute_fees_module_2: batch.institute_fees_module_2,
                            },
                            batch.group_module
                          )
                        )}
                      </p>
                    </div>
                  )}
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
        open={deleteConfirmOpen}
        onOpenChange={(o) => setDeleteConfirmOpen(o)}
        onConfirm={handleDeleteBatch}
        title="Delete Batch"
        description={`Are you sure you want to delete ${batch.name}? This action cannot be undone.`}
        confirmLabel="Delete Batch"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
