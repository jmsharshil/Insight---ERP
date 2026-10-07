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
  const [instituteFeesAllModules, setInstituteFeesAllModules] = useState("");
  const [instituteFeesModule1, setInstituteFeesModule1] = useState("");
  const [instituteFeesModule2, setInstituteFeesModule2] = useState("");
  const [instituteFeesModule3, setInstituteFeesModule3] = useState("");
  const [instituteFeesModule4, setInstituteFeesModule4] = useState("");
  const [instituteFeesModule5, setInstituteFeesModule5] = useState("");
  const [visibleModulesCount, setVisibleModulesCount] = useState(2);
  const [groupModule, setGroupModule] = useState("");
  const [attempt, setAttempt] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const selectedLevelName = levels.find(l => l.id === level)?.name || structure?.level_name || "";
  const ln = selectedLevelName.toLowerCase();
  const isCseet = ln === "cseet";
  const isCsExecutive = ln === "cs executive" || ln === "cs_executive";
  const isCsProfessional = ln === "cs professional" || ln === "cs_professional";
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
      setInstituteFeesAllModules(String(structure.institute_fees_all_modules ?? ""));
      setInstituteFeesModule1(String(structure.institute_fees_module_1 || ""));
      setInstituteFeesModule2(String(structure.institute_fees_module_2 || ""));
      setInstituteFeesModule3(String(structure.institute_fees_module_3 || ""));
      setInstituteFeesModule4(String(structure.institute_fees_module_4 || ""));
      setInstituteFeesModule5(String(structure.institute_fees_module_5 || ""));
      
      if (structure.institute_fees_module_5) setVisibleModulesCount(5);
      else if (structure.institute_fees_module_4) setVisibleModulesCount(4);
      else if (structure.institute_fees_module_3) setVisibleModulesCount(3);
      else setVisibleModulesCount(2);

      setGroupModule(structure.group_module || "");
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
      setInstituteFeesAllModules("");
      setInstituteFeesModule1("");
      setInstituteFeesModule2("");
      setInstituteFeesModule3("");
      setInstituteFeesModule4("");
      setInstituteFeesModule5("");
      setVisibleModulesCount(2);
      setGroupModule("");
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
    // For CSEET, we can fallback to sum of other fees if total amount is blank
    let finalTotalAmount = 0;
    let finalAllModules = 0;

    if (isCsExecutive || isCsProfessional) {
      const m1 = parseFloat(instituteFeesModule1 || "0");
      const m2 = parseFloat(instituteFeesModule2 || "0");
      const m3 = parseFloat(instituteFeesModule3 || "0");
      const m4 = parseFloat(instituteFeesModule4 || "0");
      const m5 = parseFloat(instituteFeesModule5 || "0");
      
      // If a specific bulk amount is provided, use it (Scenario B), else sum modules (Scenario A)
      if (instituteFeesAllModules !== "") {
        finalAllModules = parseFloat(instituteFeesAllModules);
        finalTotalAmount = finalAllModules;
      } else {
        const sum = m1 + m2 + m3 + m4 + m5;
        finalAllModules = sum;
        finalTotalAmount = sum;
      }
    } else {
      // CSEET
      if (totalAmount) {
        finalTotalAmount = parseFloat(totalAmount);
      } else {
        finalTotalAmount = parseFloat(icsiRegistrationFees || "0") + parseFloat(icsiExamFees || "0");
      }
    }

    const payload: any = {
      name,
      course,
      level: level || null,
      total_amount: finalTotalAmount,
      icsi_registration_fees: (isCseet || isCsProfessional) ? parseFloat(icsiRegistrationFees || "0") : 0,
      icsi_exam_fees: isSpecialLevel ? parseFloat(icsiExamFees || "0") : 0,
      icsi_registration_fees_via_cseet: isCsExecutive ? parseFloat(icsiRegistrationFeesViaCseet || "0") : 0,
      icsi_registration_fees_direct: isCsExecutive ? parseFloat(icsiRegistrationFeesDirect || "0") : 0,
      institute_fees_both_modules: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesBothModules || "0") : 0,
      institute_fees_all_modules: (isCsExecutive || isCsProfessional) ? finalAllModules : 0,
      institute_fees_module_1: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesModule1 || "0") : 0,
      institute_fees_module_2: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesModule2 || "0") : 0,
      institute_fees_module_3: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesModule3 || "0") : 0,
      institute_fees_module_4: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesModule4 || "0") : 0,
      institute_fees_module_5: (isCsExecutive || isCsProfessional) ? parseFloat(instituteFeesModule5 || "0") : 0,
      group_module: (isCsExecutive || isCsProfessional) ? (groupModule || null) : null,
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
              <Select value={course} onValueChange={(val) => {
                setCourse(val);
                setLevel("");
                setAttempt("");
                setGroupModule("");
              }}>
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
                <Label htmlFor="fs-inst-all">Institute Fees (All Modules Bulk Price)</Label>
                <Input
                  id="fs-inst-all"
                  type="number" min="0"
                  value={instituteFeesAllModules}
                  onChange={(e) => setInstituteFeesAllModules(e.target.value)}
                  placeholder="Leave blank to auto-calculate from modules below"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">If provided, this overrides the sum of individual modules for the Total Amount.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fs-inst-mod1">Module 1</Label>
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
                  <Label htmlFor="fs-inst-mod2">Module 2</Label>
                  <Input
                    id="fs-inst-mod2"
                    type="number" min="0"
                    value={instituteFeesModule2}
                    onChange={(e) => setInstituteFeesModule2(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                {visibleModulesCount >= 3 && (
                  <div>
                    <Label htmlFor="fs-inst-mod3">Module 3</Label>
                    <Input
                      id="fs-inst-mod3"
                      type="number" min="0"
                      value={instituteFeesModule3}
                      onChange={(e) => setInstituteFeesModule3(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                )}
                {visibleModulesCount >= 4 && (
                  <div>
                    <Label htmlFor="fs-inst-mod4">Module 4</Label>
                    <Input
                      id="fs-inst-mod4"
                      type="number" min="0"
                      value={instituteFeesModule4}
                      onChange={(e) => setInstituteFeesModule4(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                )}
                {visibleModulesCount >= 5 && (
                  <div>
                    <Label htmlFor="fs-inst-mod5">Module 5</Label>
                    <Input
                      id="fs-inst-mod5"
                      type="number" min="0"
                      value={instituteFeesModule5}
                      onChange={(e) => setInstituteFeesModule5(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              {/* {visibleModulesCount < 5 && (
                <div className="flex justify-end -mt-1">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-primary"
                    onClick={() => setVisibleModulesCount(prev => prev + 1)}
                  >
                    + Add module
                  </Button>
                </div>
              )} */}
            </div>
          )}

          {(isCsExecutive || isCsProfessional) && (
            <div className="space-y-1.5">
              <Label>Group / Module</Label>
              <Select value={groupModule} onValueChange={setGroupModule}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="module_1">Module 1</SelectItem>
                  <SelectItem value="module_2">Module 2</SelectItem>
                </SelectContent>
              </Select>
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
