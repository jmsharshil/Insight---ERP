import { useEffect, useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users,
  MapPin,
  Edit2,
  CreditCard,
  Calendar,
  Loader2,
  Layers,
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
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { feesActions, levelActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useDropdown } from "@/hooks/useDropdown";
import { formatCurrency, getAvailableYears } from "@/lib/utils";

interface BatchForm {
  fee_structure: string;
  group_module?: string;
  batch_attempt?: string;
  attempt_year?: string;
  branch: string;
  syllabus: string;
  max_students: number;
  start_date: string;
  end_date: string;
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
  courses?: any[];
  canEdit?: boolean;
  onEditClick?: () => void;
  allStudents?: any[];
  allFaculty?: any[];
  onAssignStudent?: (studentId: string) => void;
  onRemoveStudent?: (studentId: string) => void;
  onAssignFaculty?: (facultyId: string) => void;
  onRemoveFaculty?: (facultyId: string) => void;
  loading?: boolean;
}

export default function BatchDetailsSheet({
  open,
  onOpenChange,
  mode,
  batch,
  batchForm,
  setBatchForm,
  onSave,
  courses = [],
  canEdit,
  onEditClick,
  loading = false,
}: BatchDetailsSheetProps) {
  // If mode is null, render nothing or just close sheet
  if (!mode) return null;

  const isFormMode = mode === "edit" || mode === "create";

  const dispatch = useDispatch<AppDispatch>();

  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [feeStructuresLoading, setFeeStructuresLoading] = useState(false);

  const {
    options: branches,
    loading: branchesLoading,
    fetchOptions: fetchBranches,
  } = useDropdown("branches", false);

  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [syllabusesLoading, setSyllabusesLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBranches();

      // Fetch fee structures
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
          } else {
            setFeeStructures([]);
          }
          setFeeStructuresLoading(false);
        },
        getError: () => {
          setFeeStructuresLoading(false);
        },
      });
    }
  }, [open, fetchBranches, dispatch]);

  // Fetch syllabuses when fee_structure changes
  useEffect(() => {
    if (!batchForm?.fee_structure || feeStructures.length === 0) {
      setSyllabuses([]);
      return;
    }

    const selectedFeeStructure = feeStructures.find(
      (fs) => String(fs.id) === String(batchForm.fee_structure)
    );

    if (selectedFeeStructure && selectedFeeStructure.course && selectedFeeStructure.level) {
      setSyllabusesLoading(true);
      dispatch({
        type: levelActions.GET_LEVEL_DETAILS,
        method: "GET",
        endPoint: API.COURSES.LEVELS.DETAIL(selectedFeeStructure.course, selectedFeeStructure.level),
        auth: true,
        getResponse: (res: any) => {
          const levelData = res?.data ?? res;
          if (levelData?.syllabuses && Array.isArray(levelData.syllabuses)) {
            setSyllabuses(
              levelData.syllabuses.map((s: any) => ({ value: String(s.id), label: s.name }))
            );
          } else {
            setSyllabuses([]);
          }
          setSyllabusesLoading(false);
        },
        getError: () => {
          setSyllabuses([]);
          setSyllabusesLoading(false);
        },
      });
    } else {
      setSyllabuses([]);
    }
  }, [batchForm?.fee_structure, feeStructures, dispatch]);

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
    (fs) => String(fs.id) === String(batchForm?.fee_structure)
  );
  const currentFeeAmount = getFeeAmountForModule(selectedFeeStructure, batchForm?.group_module);
  const selectedCourse = courses?.find((c: any) => String(c.id) === String(selectedFeeStructure?.course || batch?.course));
  const courseName = (selectedCourse?.name || selectedFeeStructure?.course_name || batch?.course_name || "").toLowerCase();
  const isCseet = courseName.includes("cseet");

  const batchAttempt = batchForm?.batch_attempt || "june";
  const availableYears = useMemo(() => {
    return getAvailableYears(isCseet ? "cseet" : "other", batchAttempt, batchForm?.group_module);
  }, [isCseet, batchAttempt, batchForm?.group_module]);

  useEffect(() => {
    if (!isFormMode) return;
    if (isCseet) {
      if (batchForm?.batch_attempt && !["june", "oct", "feb"].includes(batchForm.batch_attempt)) {
        setBatchForm({ ...batchForm, batch_attempt: "june" });
      }
    } else {
      if (batchForm?.batch_attempt && !["june", "dec"].includes(batchForm.batch_attempt)) {
        setBatchForm({ ...batchForm, batch_attempt: "june" });
      }
    }
  }, [isCseet, isFormMode]);

  useEffect(() => {
    if (!isFormMode) return;
    if (batchForm && (!batchForm.attempt_year || !availableYears.includes(String(batchForm.attempt_year)))) {
      setBatchForm({ ...batchForm, attempt_year: availableYears[0] });
    }
  }, [availableYears, isFormMode]);

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
          <div className="space-y-5 py-4">
            {/* Fee Structure Dropdown */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-fee-structure"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Fee Structure *
              </Label>
              <Select
                value={batchForm.fee_structure || ""}
                onValueChange={(val) => setBatchForm({ ...batchForm, fee_structure: val })}
                disabled={feeStructuresLoading}
              >
                <SelectTrigger id="batch-fee-structure" className="bg-muted/10">
                  <SelectValue
                    placeholder={
                      feeStructuresLoading ? "Loading fee structures..." : "Select fee structure..."
                    }
                  />
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

            {/* Group Module Dropdown */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-group-module"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Group / Module
              </Label>
              <Select
                value={batchForm.group_module || "both"}
                onValueChange={(val) => setBatchForm({ ...batchForm, group_module: val })}
              >
                <SelectTrigger id="batch-group-module" className="bg-muted/10">
                  <SelectValue placeholder="Select Module" />
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

            {/* Fee Amount Preview according to Module */}
            {selectedFeeStructure && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
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

            {/* Batch Attempt and Attempt Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="batch-attempt"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Batch Attempt
                </Label>
                <Select
                  value={batchForm.batch_attempt || "june"}
                  onValueChange={(val) => setBatchForm({ ...batchForm, batch_attempt: val })}
                >
                  <SelectTrigger id="batch-attempt" className="bg-muted/10">
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

              <div className="space-y-1">
                <Label
                  htmlFor="batch-attempt-year"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Attempt Year
                </Label>
                <Select
                  value={String(batchForm.attempt_year || availableYears[0])}
                  onValueChange={(val) => setBatchForm({ ...batchForm, attempt_year: val })}
                >
                  <SelectTrigger id="batch-attempt-year" className="bg-muted/10">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y: string) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Syllabus Dropdown */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-syllabus"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Syllabus *
              </Label>
              <Select
                value={batchForm.syllabus || ""}
                onValueChange={(val) => setBatchForm({ ...batchForm, syllabus: val })}
                disabled={syllabusesLoading}
              >
                <SelectTrigger id="batch-syllabus" className="bg-muted/10">
                  <SelectValue
                    placeholder={syllabusesLoading ? "Loading syllabuses..." : "Select Syllabus"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {syllabuses.map((s: any) => (
                    <SelectItem key={s.value} value={String(s.value)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Students */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-max-students"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Max Students *
              </Label>
              <Input
                id="batch-max-students"
                type="number"
                min="0"
                value={batchForm.max_students}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, max_students: Number(e.target.value) })
                }
              />
            </div>

            {/* Branch Name */}
            <div className="space-y-1">
              <Label
                htmlFor="batch-branch"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Branch Name *
              </Label>
              <Select
                value={batchForm.branch || ""}
                onValueChange={(val) => setBatchForm({ ...batchForm, branch: val })}
                disabled={branchesLoading}
              >
                <SelectTrigger id="batch-branch" className="bg-muted/10">
                  <SelectValue
                    placeholder={branchesLoading ? "Loading branches..." : "Select Branch"}
                  />
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="batch-start-date"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Start Date *
                </Label>
                <Input
                  id="batch-start-date"
                  type="date"
                  value={batchForm.start_date}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="batch-end-date"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  End Date *
                </Label>
                <Input
                  id="batch-end-date"
                  type="date"
                  value={batchForm.end_date}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, end_date: e.target.value })
                  }
                />
              </div>
            </div>

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
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          batch && (
            <div className="space-y-6 py-4">
              {/* View Details Mode */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    Fee Structure
                  </span>
                  <div className="text-sm font-medium">
                    {batch.fee_structure_name || batch.fee_structure || "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Branch
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {batch.branch_name || batch.branch || "N/A"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Max Students
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {batch.max_students}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Duration
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {batch.start_date || "N/A"} to {batch.end_date || "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {batch.batch_code && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Batch Code
                    </span>
                    <div className="text-sm font-medium">{batch.batch_code}</div>
                  </div>
                )}
                {batch.name && (
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Batch Name
                    </span>
                    <div className="text-sm font-medium break-all">{batch.name}</div>
                  </div>
                )}
                {batch.course_name && (
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Course Name
                    </span>
                    <div className="text-sm font-medium truncate" title={batch.course_name}>
                      {batch.course_name}
                    </div>
                  </div>
                )}
                {(batch.group_module_display || batch.group_module) && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Module
                    </span>
                    <div className="text-sm font-medium">
                      {batch.group_module_display || getGroupModuleLabel(batch.group_module)}
                    </div>
                  </div>
                )}
                {(batch.batch_attempt_display || batch.attempt_year) && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Attempt
                    </span>
                    <div className="text-sm font-medium">
                      {batch.batch_attempt_display} {batch.attempt_year}
                    </div>
                  </div>
                )}
                {batch.syllabus_name && (
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Syllabus
                    </span>
                    <div className="text-sm font-medium truncate" title={batch.syllabus_name}>
                      {batch.syllabus_name}
                    </div>
                  </div>
                )}
                <div className="space-y-1 min-w-0 col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Fee Structure
                  </span>
                  <div className="text-sm font-medium truncate" title={batch.fee_structure_name || batch.fee_structure}>
                    {batch.fee_structure_name || batch.fee_structure || "-"}
                  </div>
                </div>
                {batch && (batch.fee_structure || batch.fee_structure_name) && (
                  <div className="space-y-1 min-w-0 col-span-2 sm:col-span-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Fee Amount
                    </span>
                    <div className="text-sm font-bold text-primary font-mono">
                      {formatCurrency(
                        getFeeAmountForModule(
                          feeStructures.find((fs) => String(fs.id) === String(batch.fee_structure)) || {
                            total_amount: batch.total_amount,
                            institute_fees_module_1: batch.institute_fees_module_1,
                            institute_fees_module_2: batch.institute_fees_module_2,
                          },
                          batch.group_module
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(batch.enrolled_students?.length > 0 || batch.assigned_faculty?.length > 0) && (
                <div className="space-y-6 pt-2">
                  {batch.enrolled_students?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        Enrolled Students ({batch.enrolled_students.length})
                      </span>
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
                    </div>
                  )}

                  {batch.assigned_faculty?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        Assigned Faculty ({batch.assigned_faculty.length})
                      </span>
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
                    </div>
                  )}
                </div>
              )}

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
