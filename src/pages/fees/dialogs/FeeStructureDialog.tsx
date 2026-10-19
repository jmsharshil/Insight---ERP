import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { levelActions, syllabusActions, moduleActions } from "@/redux/actions";
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
import { Plus, Minus } from "lucide-react";
import { type FeesStructure } from "@/redux/slices/feesSlice";
import { getAvailableYears } from "@/lib/utils";

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
  const [syllabus, setSyllabus] = useState("");
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [syllabusesLoading, setSyllabusesLoading] = useState(false);
  const [syllabusModules, setSyllabusModules] = useState<any[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [manualModuleCount, setManualModuleCount] = useState(2);

  const [levelsByCourse, setLevelsByCourse] = useState<Record<string, any[]>>({});
  const [fetchingLevels, setFetchingLevels] = useState<Record<string, boolean>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  const levels = course ? (levelsByCourse[course] || []) : [];
  const levelsLoading = course ? (fetchingLevels[course] && !levelsByCourse[course]) : false;
  const [totalAmount, setTotalAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [instituteFeesModule1, setInstituteFeesModule1] = useState("");
  const [instituteFeesModule2, setInstituteFeesModule2] = useState("");
  const [instituteFeesModule3, setInstituteFeesModule3] = useState("");
  const [instituteFeesModule4, setInstituteFeesModule4] = useState("");
  const [instituteFeesModule5, setInstituteFeesModule5] = useState("");
  const [icsiRegistrationFees, setIcsiRegistrationFees] = useState("");
  const [icsiExamFees, setIcsiExamFees] = useState("");
  const [icsiRegistrationFeesViaCseet, setIcsiRegistrationFeesViaCseet] = useState("");
  const [icsiRegistrationFeesDirect, setIcsiRegistrationFeesDirect] = useState("");
  const [attempt, setAttempt] = useState("june");
  const [year, setYear] = useState(() => getAvailableYears("other", "june")[0]);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const selectedCourseObj = courses?.find(c => String(c.id) === String(course));
  const selectedLevelName = levels.find(l => String(l.id) === String(level))?.name || structure?.level_name || "";
  const ln = selectedLevelName.toLowerCase();
  const cn = (selectedCourseObj?.name || structure?.course_name || "").toLowerCase();
  const ct = (selectedCourseObj?.course_type || "").toLowerCase();

  const isCseet = ln === "cseet" || ln.includes("cseet") || ct === "cseet" || cn === "cseet";
  const isCsExecutive = ln === "cs executive" || ln === "cs_executive" || ln.includes("executive") || ct === "cs_executive" || cn.includes("executive");
  const isCsProfessional = ln === "cs professional" || ln === "cs_professional" || ln.includes("professional") || ct === "cs_professional" || cn.includes("professional");
  const isSpecialLevel = isCseet || isCsExecutive || isCsProfessional;
  const hasModules = isCsExecutive || isCsProfessional || Boolean(Number(structure?.institute_fees_module_1 || 0) > 0 || Number(structure?.institute_fees_module_2 || 0) > 0) || (!isCseet && !!course);

  const attemptOptions = isCseet
    ? [
        { value: "june", label: "June" },
        { value: "oct", label: "October" },
        { value: "feb", label: "February" }
      ]
    : [
        { value: "june", label: "June" },
        { value: "dec", label: "December" }
      ];

  const computedAvailableYears = useMemo(() => {
    return getAvailableYears(isCseet ? "cseet" : "other", attempt || "june");
  }, [isCseet, attempt]);

  const availableYears = useMemo(() => {
    if (structure?.year && !computedAvailableYears.includes(String(structure.year))) {
      return [String(structure.year), ...computedAvailableYears];
    }
    return computedAvailableYears;
  }, [computedAvailableYears, structure?.year]);

  // Keep attempt valid based on course type
  useEffect(() => {
    if (isCseet) {
      if (!["june", "oct", "feb"].includes(attempt)) {
        setAttempt("june");
      }
    } else {
      if (!["june", "dec"].includes(attempt)) {
        setAttempt("june");
      }
    }
  }, [isCseet, attempt]);

  // Keep year valid based on availableYears
  useEffect(() => {
    if (!availableYears.includes(year)) {
      setYear(availableYears[0]);
    }
  }, [availableYears, year]);

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

  // Fetch syllabuses when course and level are selected
  useEffect(() => {
    if (course && level) {
      setSyllabusesLoading(true);
      dispatch({
        type: syllabusActions.GET_SYLLABUSES,
        method: "GET",
        endPoint: API.COURSES.LEVELS.SYLLABUSES.LIST(course, level),
        auth: true,
        getResponse: (res: any) => {
          let list: any[] = [];
          if (Array.isArray(res?.data)) list = res.data;
          else if (Array.isArray(res?.results)) list = res.results;
          else if (Array.isArray(res)) list = res;
          else if (res?.data?.syllabuses && Array.isArray(res.data.syllabuses)) list = res.data.syllabuses;
          setSyllabuses(list);
          setSyllabusesLoading(false);
        },
        getError: () => {
          // Fallback to level detail which often includes syllabuses array
          dispatch({
            type: levelActions.GET_LEVEL_DETAILS,
            method: "GET",
            endPoint: API.COURSES.LEVELS.DETAIL(course, level),
            auth: true,
            getResponse: (lRes: any) => {
              const lData = lRes?.data ?? lRes;
              if (lData?.syllabuses && Array.isArray(lData.syllabuses)) {
                setSyllabuses(lData.syllabuses);
              } else {
                setSyllabuses([]);
              }
              setSyllabusesLoading(false);
            },
            getError: () => {
              setSyllabuses([]);
              setSyllabusesLoading(false);
            }
          });
        }
      });
    } else {
      setSyllabuses([]);
      setSyllabus("");
      setSyllabusModules([]);
    }
  }, [course, level, dispatch]);

  // Inspect syllabus modules when syllabus is selected
  useEffect(() => {
    if (syllabus) {
      const selectedSyl = syllabuses.find((s) => String(s.id) === String(syllabus));
      if (selectedSyl?.modules && Array.isArray(selectedSyl.modules) && selectedSyl.modules.length > 0) {
        setSyllabusModules(selectedSyl.modules);
        return;
      }

      setModulesLoading(true);
      dispatch({
        type: syllabusActions.GET_SYLLABUS_DETAILS,
        method: "GET",
        endPoint: API.SYLLABUSES.DETAIL(syllabus),
        auth: true,
        getResponse: (res: any) => {
          const data = res?.data ?? res;
          if (data?.modules && Array.isArray(data.modules)) {
            setSyllabusModules(data.modules);
          } else if (Array.isArray(data)) {
            setSyllabusModules(data);
          } else if (data?.modules_count) {
            const count = Math.min(Number(data.modules_count) || 2, 5);
            setSyllabusModules(
              Array.from({ length: count }, (_, i) => ({
                id: String(i + 1),
                name: `Module ${i + 1}`,
                order: i + 1,
              }))
            );
          } else {
            // Try syllabus modules list endpoint
            dispatch({
              type: moduleActions.GET_MODULES,
              method: "GET",
              endPoint: API.SYLLABUSES.MODULES.LIST(syllabus),
              auth: true,
              getResponse: (mRes: any) => {
                const mList = Array.isArray(mRes?.data) ? mRes.data : Array.isArray(mRes) ? mRes : [];
                setSyllabusModules(mList);
                setModulesLoading(false);
              },
              getError: () => {
                setSyllabusModules([]);
                setModulesLoading(false);
              },
            });
            return;
          }
          setModulesLoading(false);
        },
        getError: () => {
          setSyllabusModules([]);
          setModulesLoading(false);
        },
      });
    } else {
      setSyllabusModules([]);
    }
  }, [syllabus, syllabuses, dispatch]);

  useEffect(() => {
    if (structure) {
      setName(structure.name || "");
      setCourse(structure.course || "");
      setLevel(structure.level || "");
      setSyllabus(structure.syllabus ? String(structure.syllabus) : "");
      setTotalAmount(
        structure.total_amount !== undefined && structure.total_amount !== null
          ? String(structure.total_amount)
          : String(structure.institute_fees_all_modules ?? structure.institute_fees_both_modules ?? "")
      );
      setInstituteFeesModule1(
        structure.institute_fees_module_1 !== undefined && structure.institute_fees_module_1 !== null && Number(structure.institute_fees_module_1) > 0
          ? String(structure.institute_fees_module_1)
          : ""
      );
      setInstituteFeesModule2(
        structure.institute_fees_module_2 !== undefined && structure.institute_fees_module_2 !== null && Number(structure.institute_fees_module_2) > 0
          ? String(structure.institute_fees_module_2)
          : ""
      );
      setInstituteFeesModule3(
        structure.institute_fees_module_3 !== undefined && structure.institute_fees_module_3 !== null && Number(structure.institute_fees_module_3) > 0
          ? String(structure.institute_fees_module_3)
          : ""
      );
      setInstituteFeesModule4(
        structure.institute_fees_module_4 !== undefined && structure.institute_fees_module_4 !== null && Number(structure.institute_fees_module_4) > 0
          ? String(structure.institute_fees_module_4)
          : ""
      );
      setInstituteFeesModule5(
        structure.institute_fees_module_5 !== undefined && structure.institute_fees_module_5 !== null && Number(structure.institute_fees_module_5) > 0
          ? String(structure.institute_fees_module_5)
          : ""
      );
      let c = 2;
      if (Number(structure.institute_fees_module_5 || 0) > 0) c = 5;
      else if (Number(structure.institute_fees_module_4 || 0) > 0) c = 4;
      else if (Number(structure.institute_fees_module_3 || 0) > 0) c = 3;
      setManualModuleCount(c);

      setIcsiRegistrationFees(String(structure.icsi_registration_fees || ""));
      setIcsiExamFees(String(structure.icsi_exam_fees || ""));
      setIcsiRegistrationFeesViaCseet(String(structure.icsi_registration_fees_via_cseet || ""));
      setIcsiRegistrationFeesDirect(String(structure.icsi_registration_fees_direct || ""));
      setTokenAmount(
        structure.token_amount !== undefined && structure.token_amount !== null && Number(structure.token_amount) > 0
          ? String(structure.token_amount)
          : ""
      );
      setAttempt(structure.attempt || "june");
      setYear(structure.year ? String(structure.year) : getAvailableYears("other", "june")[0]);
      setDescription(structure.description || "");
      setIsActive(structure.is_active !== false);
    } else {
      setName("");
      setCourse("");
      setLevel("");
      setSyllabus("");
      setSyllabusModules([]);
      setTotalAmount("");
      setInstituteFeesModule1("");
      setInstituteFeesModule2("");
      setInstituteFeesModule3("");
      setInstituteFeesModule4("");
      setInstituteFeesModule5("");
      setManualModuleCount(2);
      setTokenAmount("");
      setIcsiRegistrationFees("");
      setIcsiExamFees("");
      setIcsiRegistrationFeesViaCseet("");
      setIcsiRegistrationFeesDirect("");
      setAttempt("june");
      setYear(getAvailableYears("other", "june")[0]);
      setDescription("");
      setIsActive(true);
    }        
  }, [structure, open]);

  // Determine dynamic or manual module inputs to display
  const renderedModules = useMemo(() => {
    if (syllabusModules && syllabusModules.length > 0) {
      return syllabusModules.slice(0, 5).map((m, idx) => ({
        index: idx + 1,
        name: m.name || `Module ${idx + 1}`,
      }));
    }

    const count = Math.max(
      manualModuleCount,
      Number(instituteFeesModule5 || 0) > 0 ? 5 : 0,
      Number(instituteFeesModule4 || 0) > 0 ? 4 : 0,
      Number(instituteFeesModule3 || 0) > 0 ? 3 : 0,
      2
    );

    return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
      index: i + 1,
      name: `Module ${i + 1}`,
    }));
  }, [syllabusModules, manualModuleCount, instituteFeesModule3, instituteFeesModule4, instituteFeesModule5]);

  const getModuleVal = (idx: number) => {
    if (idx === 1) return instituteFeesModule1;
    if (idx === 2) return instituteFeesModule2;
    if (idx === 3) return instituteFeesModule3;
    if (idx === 4) return instituteFeesModule4;
    if (idx === 5) return instituteFeesModule5;
    return "";
  };

  const setModuleVal = (idx: number, val: string) => {
    if (idx === 1) setInstituteFeesModule1(val);
    else if (idx === 2) setInstituteFeesModule2(val);
    else if (idx === 3) setInstituteFeesModule3(val);
    else if (idx === 4) setInstituteFeesModule4(val);
    else if (idx === 5) setInstituteFeesModule5(val);
  };

  const handleModuleBlur = () => {
    const modSum =
      parseFloat(instituteFeesModule1 || "0") +
      parseFloat(instituteFeesModule2 || "0") +
      parseFloat(instituteFeesModule3 || "0") +
      parseFloat(instituteFeesModule4 || "0") +
      parseFloat(instituteFeesModule5 || "0");
    if (!totalAmount || parseFloat(totalAmount) === 0) {
      if (modSum > 0) {
        setTotalAmount(modSum.toString());
      }
    }
  };

  const isEdit = !!structure;

  const handleSave = () => {
    const mod1 = parseFloat(instituteFeesModule1 || "0");
    const mod2 = parseFloat(instituteFeesModule2 || "0");
    const mod3 = parseFloat(instituteFeesModule3 || "0");
    const mod4 = parseFloat(instituteFeesModule4 || "0");
    const mod5 = parseFloat(instituteFeesModule5 || "0");
    const modSum = mod1 + mod2 + mod3 + mod4 + mod5;
    const enteredTotal = parseFloat(totalAmount || "0");
    // Scenario A: If bulk/all modules is blank, use sum of modules
    // Scenario B: If bulk/all modules is provided, use entered bulk amount
    const finalTotalAmount = enteredTotal > 0 ? enteredTotal : modSum;

    if (!course || finalTotalAmount <= 0) {
      return;
    }

    const payload: any = {
      name,
      course,
      level: level || null,
      syllabus: syllabus || null,
      total_amount: finalTotalAmount,
      token_amount: parseFloat(tokenAmount || "0"),
      icsi_registration_fees: (isCseet || isCsProfessional) ? parseFloat(icsiRegistrationFees || "0") : 0,
      icsi_exam_fees: isSpecialLevel ? parseFloat(icsiExamFees || "0") : 0,
      icsi_registration_fees_via_cseet: isCsExecutive ? parseFloat(icsiRegistrationFeesViaCseet || "0") : 0,
      icsi_registration_fees_direct: isCsExecutive ? parseFloat(icsiRegistrationFeesDirect || "0") : 0,
      institute_fees_both_modules: finalTotalAmount,
      institute_fees_all_modules: finalTotalAmount,
      institute_fees_module_1: mod1,
      institute_fees_module_2: mod2,
      institute_fees_module_3: mod3,
      institute_fees_module_4: mod4,
      institute_fees_module_5: mod5,
      group_module: null,
      attempt,
      year,
      description,
      is_active: isActive,
    };

    onSubmit(payload);
  };

  const canSave =
    !loading &&
    !!course &&
    (parseFloat(totalAmount || "0") > 0 ||
      parseFloat(instituteFeesModule1 || "0") > 0 ||
      parseFloat(instituteFeesModule2 || "0") > 0 ||
      parseFloat(instituteFeesModule3 || "0") > 0 ||
      parseFloat(instituteFeesModule4 || "0") > 0 ||
      parseFloat(instituteFeesModule5 || "0") > 0);

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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Course *</Label>
              <Select value={course} onValueChange={(val) => {
                setCourse(val);
                setLevel("");
                setAttempt("");
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
              <Select
                value={level}
                onValueChange={(val) => {
                  setLevel(val);
                  setSyllabus("");
                  setSyllabusModules([]);
                }}
                disabled={!course || levelsLoading}
              >
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

          {!isCseet && (
            <div>
              <Label>Syllabus</Label>
              <Select
                value={syllabus}
                onValueChange={(val) => {
                  setSyllabus(val);
                }}
                disabled={!level || syllabusesLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue
                    placeholder={
                      !level
                        ? "Select Level First"
                        : syllabusesLoading
                        ? "Loading syllabuses..."
                        : "Select Syllabus (Optional)"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {syllabuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} {s.modules_count ? `(${s.modules_count} Modules)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
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
                  placeholder="0.00 (per module)"
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Exam fee charged per module.
                  {parseFloat(icsiExamFees || "0") > 0 && renderedModules.length > 0 && (
                    <span className="font-medium text-foreground ml-1">
                      (Total: ₹{(parseFloat(icsiExamFees) * renderedModules.length).toLocaleString("en-IN")} for all {renderedModules.length} modules)
                    </span>
                  )}
                </p>
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
                  placeholder="0.00 (per module)"
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Exam fee charged per module.
                  {parseFloat(icsiExamFees || "0") > 0 && renderedModules.length > 0 && (
                    <span className="font-medium text-foreground ml-1">
                      (Total: ₹{(parseFloat(icsiExamFees) * renderedModules.length).toLocaleString("en-IN")} for all {renderedModules.length} modules)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {hasModules && (
            <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Module Breakdown Fees
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {syllabusModules.length > 0
                      ? `Dynamic modules from syllabus (${syllabusModules.length} Modules)`
                      : "Enter individual module fees. All Modules fee will auto-calculate."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {renderedModules.map((m) => (
                  <div key={m.index}>
                    <Label htmlFor={`fs-inst-mod${m.index}`}>{m.name} Fee</Label>
                    <Input
                      id={`fs-inst-mod${m.index}`}
                      type="number"
                      min="0"
                      value={getModuleVal(m.index)}
                      onChange={(e) => setModuleVal(m.index, e.target.value)}
                      onBlur={handleModuleBlur}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="fs-amount">
              {hasModules ? "All Modules Fee *" : "Institute Fee *"}
            </Label>
            <Input
              id="fs-amount"
              type="number"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
            {hasModules && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Auto-calculated from individual modules or enter a discounted bulk package fee.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="fs-token-amount">Token Amount</Label>
            <Input
              id="fs-token-amount"
              type="number"
              min="0"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Token amount collected during online admission. Students choosing Token Payment receive a Razorpay link for this amount, with the remaining balance due within 15 days.
            </p>
          </div>

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
            disabled={!canSave}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
