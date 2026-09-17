import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { levelActions } from "@/redux/actions";
import { API } from "@/service/api";
import { AppDispatch } from "@/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { type FeesStructure } from "@/redux/slices/feesSlice";

interface FeeStructureDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  structure: FeesStructure | null;
  courses: any[];
  loading: boolean;
}

export function FeeStructureDialog({
  open,
  onClose,
  onSubmit,
  structure,
  courses,
  loading,
}: FeeStructureDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [levelsByCourse, setLevelsByCourse] = useState<Record<string, any[]>>({});
  const [fetchingLevels, setFetchingLevels] = useState<Record<string, boolean>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  const levels = course ? (levelsByCourse[course] || []) : [];
  const levelsLoading = course ? (fetchingLevels[course] && !levelsByCourse[course]) : false;
  const [totalAmount, setTotalAmount] = useState("");
  const [icsiRegistrationFees, setIcsiRegistrationFees] = useState("");
  const [icsiExamFees, setIcsiExamFees] = useState("");
  const [icsiRegistrationFeesViaCseet, setIcsiRegistrationFeesViaCseet] = useState("");
  const [icsiRegistrationFeesDirect, setIcsiRegistrationFeesDirect] = useState("");
  const [instituteFeesBothModules, setInstituteFeesBothModules] = useState("");
  const [instituteFeesModule1, setInstituteFeesModule1] = useState("");
  const [instituteFeesModule2, setInstituteFeesModule2] = useState("");
  const [attempt, setAttempt] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const selectedLevelName = levels.find(l => l.id === level)?.name || structure?.level_name || "";
  const isCseet = selectedLevelName === "CSEET";
  const isCsExecutive = selectedLevelName === "CS Executive";
  const isCsProfessional = selectedLevelName === "CS Professional";
  const isSpecialLevel = isCseet || isCsExecutive || isCsProfessional;

  let attemptOptions = [
    { value: "jan", label: "January" },
    { value: "feb", label: "February" },
    { value: "mar", label: "March" },
    { value: "apr", label: "April" },
    { value: "may", label: "May" },
    { value: "june", label: "June" },
    { value: "jul", label: "July" },
    { value: "aug", label: "August" },
    { value: "sep", label: "September" },
    { value: "oct", label: "October" },
    { value: "nov", label: "November" },
    { value: "dec", label: "December" }
  ];
  if (isCseet) {
    attemptOptions = attemptOptions.filter(o => ["feb", "june", "oct"].includes(o.value));
  } else if (isCsExecutive || isCsProfessional) {
    attemptOptions = attemptOptions.filter(o => ["june", "dec"].includes(o.value));
  }

  // Pre-fetch levels for all courses to avoid loading delays when selecting a course
  useEffect(() => {
    courses?.forEach(c => {
      const id = String(c.id);
      if (!fetchedRef.current.has(id)) {
        fetchedRef.current.add(id);
        setFetchingLevels(prev => ({ ...prev, [id]: true }));
        dispatch({
          type: levelActions.GET_LEVELS,
          method: "GET",
          endPoint: API.COURSES.LEVELS.LIST(id),
          auth: true,
          getResponse: (res: any) => {
            setLevelsByCourse(prev => ({ ...prev, [id]: res?.data || res || [] }));
            setFetchingLevels(prev => ({ ...prev, [id]: false }));
          },
          getError: () => {
            setLevelsByCourse(prev => ({ ...prev, [id]: [] }));
            setFetchingLevels(prev => ({ ...prev, [id]: false }));
          }
        });
      }
    });
  }, [courses, dispatch]);



  useEffect(() => {
    if (structure) {
      setName(structure.name || "");
      setCourse(structure.course || "");
      setLevel(structure.level || "");
      setTotalAmount(String(structure.total_amount) || "");
      setIcsiRegistrationFees(String(structure.icsi_registration_fees || ""));
      setIcsiExamFees(String(structure.icsi_exam_fees || ""));
      setIcsiRegistrationFeesViaCseet(String(structure.icsi_registration_fees_via_cseet || ""));
      setIcsiRegistrationFeesDirect(String(structure.icsi_registration_fees_direct || ""));
      setInstituteFeesBothModules(String(structure.institute_fees_both_modules || ""));
      setInstituteFeesModule1(String(structure.institute_fees_module_1 || ""));
      setInstituteFeesModule2(String(structure.institute_fees_module_2 || ""));
      setAttempt(structure.attempt || "");
      setYear(structure.year ? String(structure.year) : new Date().getFullYear().toString());
      setDescription(structure.description || "");
      setIsActive(structure.is_active !== false);
    } else {
      setName("");
      setCourse("");
      setLevel("");
      setTotalAmount("");
      setIcsiRegistrationFees("");
      setIcsiExamFees("");
      setIcsiRegistrationFeesViaCseet("");
      setIcsiRegistrationFeesDirect("");
      setInstituteFeesBothModules("");
      setInstituteFeesModule1("");
      setInstituteFeesModule2("");
      setAttempt("");
      setYear(new Date().getFullYear().toString());
      setDescription("");
      setIsActive(true);
    }        
  }, [structure, open]);

  const isEdit = !!structure;

  const handleSave = () => {
    if (!name.trim() || !course) {
      return;
    }
    // For CSEET, total_amount (Institute Fee) is required
    if (isCseet && !totalAmount) {
      return;
    }

    const payload: any = {
      name,
      course,
      level: level || null,
      total_amount: (isCsExecutive || isCsProfessional) ? 0 : parseFloat(totalAmount || "0"),
      icsi_registration_fees: (isCseet || isCsProfessional) ? parseFloat(icsiRegistrationFees || "0") : 0,
      icsi_exam_fees: isSpecialLevel ? parseFloat(icsiExamFees || "0") : 0,
      icsi_registration_fees_via_cseet: isCsExecutive ? parseFloat(icsiRegistrationFeesViaCseet || "0") : 0,
      icsi_registration_fees_direct: isCsExecutive ? parseFloat(icsiRegistrationFeesDirect || "0") : 0,
      institute_fees_both_modules: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesBothModules || "0") : 0,
      institute_fees_module_1: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesModule1 || "0") : 0,
      institute_fees_module_2: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesModule2 || "0") : 0,
      attempt,
      year,
      description,
      is_active: isActive,
    };

    onSubmit(payload);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {isEdit ? "Edit Fee Structure" : "Create Fee Structure"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modify the details for this fee structure."
              : "Set up a new fee structure for a course and level combination."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="fs-name">Structure Name *</Label>
            <Input
              id="fs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Class 10 - Standard Science Batch 2026"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Course *</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel} disabled={!course || levelsLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={levelsLoading ? "Loading..." : "Select Level"} />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Attempt</Label>
              <Select value={attempt} onValueChange={setAttempt}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Attempt" />
                </SelectTrigger>
                <SelectContent>
                  {attemptOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="fs-desc">Description</Label>
            <Textarea
              id="fs-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard annual fee description..."
              rows={2}
              className="mt-1"
            />
          </div>

          {isCseet && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fs-icsi-reg">ICSI Reg. Fees</Label>
                <Input
                  id="fs-icsi-reg"
                  type="number" min="0"
                  value={icsiRegistrationFees}
                  onChange={(e) => setIcsiRegistrationFees(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fs-icsi-exam">ICSI Exam Fees</Label>
                <Input
                  id="fs-icsi-exam"
                  type="number" min="0"
                  value={icsiExamFees}
                  onChange={(e) => setIcsiExamFees(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {isCsExecutive && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fs-icsi-reg-cseet">ICSI Reg. Fees (Via CSEET)</Label>
                  <Input
                    id="fs-icsi-reg-cseet"
                    type="number" min="0"
                    value={icsiRegistrationFeesViaCseet}
                    onChange={(e) => setIcsiRegistrationFeesViaCseet(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fs-icsi-reg-direct">ICSI Reg. Fees (Direct)</Label>
                  <Input
                    id="fs-icsi-reg-direct"
                    type="number" min="0"
                    value={icsiRegistrationFeesDirect}
                    onChange={(e) => setIcsiRegistrationFeesDirect(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="fs-icsi-exam">ICSI Exam Fees (Per Module)</Label>
                <Input
                  id="fs-icsi-exam"
                  type="number" min="0"
                  value={icsiExamFees}
                  onChange={(e) => setIcsiExamFees(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {isCsProfessional && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="fs-icsi-reg">ICSI Registration Fees</Label>
                <Input
                  id="fs-icsi-reg"
                  type="number" min="0"
                  value={icsiRegistrationFees}
                  onChange={(e) => setIcsiRegistrationFees(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fs-icsi-exam">ICSI Exam Fees (Per Module)</Label>
                <Input
                  id="fs-icsi-exam"
                  type="number" min="0"
                  value={icsiExamFees}
                  onChange={(e) => setIcsiExamFees(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {(isCsExecutive || isCsProfessional) && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="fs-inst-both">Institute Fees (Both Modules)</Label>
                <Input
                  id="fs-inst-both"
                  type="number" min="0"
                  value={instituteFeesBothModules}
                  onChange={(e) => setInstituteFeesBothModules(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fs-inst-mod1">Institute Fees (Module 1)</Label>
                  <Input
                    id="fs-inst-mod1"
                    type="number" min="0"
                    value={instituteFeesModule1}
                    onChange={(e) => setInstituteFeesModule1(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fs-inst-mod2">Institute Fees (Module 2)</Label>
                  <Input
                    id="fs-inst-mod2"
                    type="number" min="0"
                    value={instituteFeesModule2}
                    onChange={(e) => setInstituteFeesModule2(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {!(isCsExecutive || isCsProfessional) && (
            <div>
              <Label htmlFor="fs-amount">Institute Fee *</Label>
              <Input
                id="fs-amount"
                type="number" min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="fs-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="fs-active" className="cursor-pointer select-none">
              Is Active
            </Label>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !name.trim() || !course || (!(isCsExecutive || isCsProfessional) && !totalAmount)}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
