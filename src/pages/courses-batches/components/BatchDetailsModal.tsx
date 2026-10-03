import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users,
  MapPin,
  Edit2,
  CreditCard,
  Calendar,
  Loader2,
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

interface BatchForm {
  fee_structure: string;
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
                  {feeStructures.map((fs: any) => (
                    <SelectItem key={fs.id} value={String(fs.id)}>
                      {fs.name} {fs.total_amount ? `(₹${fs.total_amount})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

              {batch.name && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Batch Name
                    </span>
                    <div className="text-sm font-medium">{batch.name}</div>
                  </div>
                  {batch.course_name && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Course Name
                      </span>
                      <div className="text-sm font-medium truncate" title={batch.course_name}>
                        {batch.course_name}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
