import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { facultyAction, batchAction, dropdownActions } from "@/redux/actions";
import { setFaculty, setFacultyLoading, setFacultyError } from "@/redux/slices/facultySlice";
import { RootState, AppDispatch } from "@/store";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  ClipboardList,
  Wallet,
  Plus,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { API } from "@/service/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import FacultyDetailSheet from "./components/FacultyDetailSheet";
import SessionDetailSheet from "./components/SessionDetailSheet";
import { useUI } from "@/hooks/useUI";
import { FacultySummarySkeleton } from "@/components/common/Skeletons";

const MONTHS = ["Mar 2024", "Apr 2024", "May 2024"];

export default function FacultyPage() {
  const { user } = useAuth();
  const { setPageTitle } = useUI();
  const navigate = useNavigate();
  const toast = useToast();
  const isFaculty = user?.role === "faculty";
  const canPayroll =
    user?.role === "accountant" || user?.role === "branch_manager" || user?.role === "super_admin";

  const [params, setParams] = useSearchParams();
  const activeTab = params.get("tab") || "summary";

  const setActiveTab = (tab: string) => {
    setParams(
      (prev) => {
        prev.set("tab", tab);
        return prev;
      },
      { replace: true },
    );
  };

  const dispatch = useDispatch<AppDispatch>();
  const { facultyList, loading: isLoading } = useSelector((state: RootState) => state.faculty);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const [isSessionSheetOpen, setIsSessionSheetOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [payrollMonth, setPayrollMonth] = useState<string>("All Months");
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  const [latePolicyDialogOpen, setLatePolicyDialogOpen] = useState(false);
  const [latePolicyFetching, setLatePolicyFetching] = useState(false);
  const [latePolicySaving, setLatePolicySaving] = useState(false);
  const [deletePolicyId, setDeletePolicyId] = useState<string | null>(null);
  const [allLatePolicies, setAllLatePolicies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [sessionReportForm, setSessionReportForm] = useState({
    faculty_id: "",
    batch_id: "",
    subject_id: "",
    session_date: new Date().toISOString().split("T")[0],
    chapter_covered: "",
    topics_covered: "",
    completion_percentage: 100,
    status: "completed",
    start_time: "10:00",
    end_time: "12:00",
    notes: "",
  });
  const [submittingSession, setSubmittingSession] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [latePolicyForm, setLatePolicyForm] = useState({
    branch_id: "",
    grace_period_minutes: 5,
    deduction_per_minute: "0.00",
    max_deduction_per_session: "0.00",
    absence_deduction_per_day: "0.00",
    late_entry_threshold: 3,
    auto_halfday_deduction: true,
  });

  const [summaryMonth, setSummaryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [summaryFacultyId, setSummaryFacultyId] = useState<string>("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [hasFetchedFaculties, setHasFetchedFaculties] = useState(false);
  const [summaryFetchAttempted, setSummaryFetchAttempted] = useState(false);

  useEffect(() => {
    if (activeTab === "summary") {
      if (!isFaculty && !summaryFacultyId) return;

      setSummaryLoading(true);
      let endPoint = `/api/v1/faculty/sessions/summary/?month=${summaryMonth}`;
      if (isFaculty) {
        endPoint += `&faculty_id=${user?.id}`;
      } else {
        endPoint += `&faculty_id=${summaryFacultyId}`;
      }

      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "GET",
        endPoint: endPoint,
        auth: true,
        getResponse: (res: any) => {
          setSummaryData(res?.data || res);
          setSummaryLoading(false);
          setSummaryFetchAttempted(true);
        },
        getError: () => {
          setSummaryLoading(false);
          setSummaryFetchAttempted(true);
          toast.error("Failed to load summary");
        },
      } as any);
    }
  }, [activeTab, summaryMonth, isFaculty, user?.id, summaryFacultyId, dispatch, toast]);

  const fetchLatePolicy = () => {
    setLatePolicyFetching(true);
    const endPoint =
      user && user.role === "branch_manager" && user.branch
        ? `/api/v1/payroll/late-policy/?branch_id=${user.branch}`
        : "/api/v1/payroll/late-policy/";

    dispatch({
      type: facultyAction.GET_PAYROLL_LATE_POLICY,
      method: "GET",
      endPoint: endPoint,
      auth: true,
      getResponse: (res: any) => {
        const policyData = res?.data || res;
        const policies = Array.isArray(policyData) ? policyData : policyData ? [policyData] : [];
        setAllLatePolicies(policies);
        if (policies.length > 0) {
          const policy = policies[0];
          setLatePolicyForm({
            branch_id: policy.branch_id || policy.branch?.id || policy.branch || "",
            grace_period_minutes: policy.grace_period_minutes ?? 5,
            deduction_per_minute: policy.deduction_per_minute ?? "0.00",
            max_deduction_per_session: policy.max_deduction_per_session ?? "0.00",
            absence_deduction_per_day: policy.absence_deduction_per_day ?? "0.00",
            late_entry_threshold: policy.late_entry_threshold ?? 3,
            auto_halfday_deduction: policy.auto_halfday_deduction ?? true,
          });
        }
        setLatePolicyFetching(false);
      },
      getError: () => {
        setLatePolicyFetching(false);
      },
    });
  };

  useEffect(() => {
    setPageTitle("Faculty");
  }, [setPageTitle]);

  useEffect(() => {
    if (activeTab === "sessions") {
      setSessionsLoading(true);
      const endPoint =
        user && user.role === "branch_manager" && user.branch
          ? `/api/v1/faculty/sessions/?branch_id=${user.branch}`
          : "/api/v1/faculty/sessions/";

      dispatch({
        type: facultyAction.GET_SESSIONS,
        method: "GET",
        endPoint: endPoint,
        auth: true,
        getResponse: (res: any) => {
          const list = res?.data || res?.results || res;
          if (Array.isArray(list)) {
            setSessions(list);
          }
          setSessionsLoading(false);
        },
        getError: () => {
          toast.error("Failed to load sessions");
          setSessionsLoading(false);
        },
      } as any);
    }
  }, [activeTab, dispatch, toast]);

  useEffect(() => {
    if (canPayroll) {
      fetchLatePolicy();
    }
  }, [canPayroll]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      setBranchesLoading(true);
      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "GET",
        endPoint: "/api/v1/branches/",
        auth: true,
        getResponse: (res: any) => {
          const data = res?.data?.results || res?.data || res?.results || res;
          if (Array.isArray(data)) setBranches(data);
          setBranchesLoading(false);
        },
        getError: () => {
          toast.error("Failed to load branches");
          setBranchesLoading(false);
        },
      });
    }
  }, [user?.role, dispatch, toast]);

  const handleDeleteLatePolicy = (id: string) => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "DELETE",
      endPoint: `/api/v1/payroll/late-policy/${id}/`,
      auth: true,
      getResponse: () => {
        toast.success("Policy deleted successfully.");
        fetchLatePolicy();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete policy");
      },
    });
  };

  const handleSaveLatePolicy = () => {
    if (user?.role === "super_admin" && !latePolicyForm.branch_id) {
      toast.error("Please select a branch to save the late policy.");
      return;
    }
    setLatePolicySaving(true);
    const payload = { ...latePolicyForm };
    if (!payload.branch_id) {
      delete (payload as any).branch_id;
    }

    dispatch({
      type: facultyAction.CREATE_PAYROLL_LATE_POLICY,
      method: "POST",
      endPoint: "/api/v1/payroll/late-policy/",
      body: payload,
      auth: true,
      getResponse: () => {
        toast.success("Late policy settings saved successfully.");
        setLatePolicyDialogOpen(false);
        setLatePolicySaving(false);
        fetchLatePolicy();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to save late policy settings");
        setLatePolicySaving(false);
      },
    });
  };

  const monthNames = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    [],
  );

  const payrollMonths = useMemo(() => {
    const months = payrolls.map((p) => `${monthNames[p.month - 1]} ${p.year}`);
    return ["All Months", ...Array.from(new Set(months))];
  }, [payrolls, monthNames]);

  useEffect(() => {
    if (payrollMonths.length > 0 && !payrollMonths.includes(payrollMonth)) {
      setPayrollMonth("All Months");
    }
  }, [payrollMonths, payrollMonth]);

  const fetchPayroll = () => {
    setPayrollLoading(true);
    const endPoint =
      user && user.role === "branch_manager" && user.branch
        ? `/api/v1/payroll/?branch_id=${user.branch}`
        : "/api/v1/payroll/";

    dispatch({
      type: facultyAction.GET_PAYROLL,
      method: "GET",
      endPoint: endPoint,
      auth: true,
      getResponse: (res: any) => {
        const list = res?.data || res?.results || res;
        if (Array.isArray(list)) {
          setPayrolls(list);
        }
        setPayrollLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to fetch payroll data");
        setPayrollLoading(false);
      },
    });
  };

  // useEffect(() => {
  //   if (canPayroll) {
  //     fetchPayroll();
  //   }
  // }, [canPayroll]);

  const [selectedFacultyForAssign, setSelectedFacultyForAssign] = useState<any | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const batchesLoading = dropdownsLoading;
  const subjectsLoading = dropdownsLoading;

  const fetchDropdowns = () => {
    setDropdownsLoading(true);
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: "/api/v1/batches/dropdowns/",
      auth: true,
      getResponse: (res: any) => {
        const data = res?.data || res;
        if (data) {
          if (Array.isArray(data.batches)) setBatches(data.batches);
          if (Array.isArray(data.subjects)) setSubjects(data.subjects);
        }
        setDropdownsLoading(false);
      },
      getError: () => {
        toast.error("Failed to load dropdown values");
        setDropdownsLoading(false);
      },
    });
  };

  useEffect(() => {
    if (assignModalOpen || sessionDialogOpen) {
      fetchDropdowns();
    }
  }, [assignModalOpen, sessionDialogOpen]);

  useEffect(() => {
    if (sessionReportForm.subject_id && subjects.length > 0) {
      const selectedSubj = subjects.find((s) => s.id === sessionReportForm.subject_id);
      if (selectedSubj && Array.isArray(selectedSubj.chapters)) {
        setChapters(selectedSubj.chapters);
      } else {
        setChapters([]);
      }
    } else {
      setChapters([]);
    }
  }, [sessionReportForm.subject_id, subjects]);

  const handleSubmitSessionReport = () => {
    if (!sessionReportForm.batch_id || !sessionReportForm.subject_id) {
      toast.error("Batch and Subject are required.");
      return;
    }
    if (!sessionReportForm.faculty_id && !isFaculty) {
      toast.error("Faculty is required.");
      return;
    }
    setSubmittingSession(true);
    const start_time =
      sessionReportForm.start_time.length === 5
        ? `${sessionReportForm.start_time}:00`
        : sessionReportForm.start_time;
    const end_time =
      sessionReportForm.end_time.length === 5
        ? `${sessionReportForm.end_time}:00`
        : sessionReportForm.end_time;

    dispatch({
      type: facultyAction.CREATE_SESSIONS,
      method: "POST",
      endPoint: "/api/v1/faculty/sessions/",
      body: {
        ...sessionReportForm,
        start_time,
        end_time,
      },
      auth: true,
      getResponse: () => {
        toast.success("Session report submitted successfully.");
        setSessionDialogOpen(false);
        setSubmittingSession(false);
        if (activeTab === "sessions") {
          const endPoint =
            user && user.role === "branch_manager" && user.branch
              ? `/api/v1/faculty/sessions/?branch_id=${user.branch}`
              : "/api/v1/faculty/sessions/";

          dispatch({
            type: dropdownActions.GET_DROPDOWN,
            method: "GET",
            endPoint: endPoint,
            auth: true,
            getResponse: (res: any) => {
              const list = res?.data || res?.results || res;
              if (Array.isArray(list)) setSessions(list);
            },
          } as any);
        }
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to submit session report");
        setSubmittingSession(false);
      },
    } as any);
  };

  const fetchFacultyDetails = (id: string) => {
    dispatch({
      type: facultyAction.GET_FACULTY_DETAILS,
      method: "GET",
      endPoint: `/api/v1/faculty/${id}/`,
      auth: true,
      getResponse: (res: any) => {
        const fullFaculty = res?.data || res;
        if (fullFaculty) {
          setSelectedFacultyForAssign(fullFaculty);
        }
      },
      getError: () => {
        console.error("Failed to load latest faculty details");
      },
    });
  };

  const handleOpenAssignModal = (faculty: any) => {
    setSelectedFacultyForAssign(faculty);
    setAssignModalOpen(true);
    setSelectedBatchId("");
    setSelectedSubjectId("");
    fetchFacultyDetails(faculty.id);
  };

  const handleAssignFacultyToBatch = () => {
    if (!selectedFacultyForAssign || !selectedBatchId) return;

    setAssignLoading(true);
    const apiSubjectId =
      selectedSubjectId === "none" || !selectedSubjectId ? null : selectedSubjectId;

    dispatch({
      type: batchAction.ASSIGN_FACULTY,
      method: "POST",
      endPoint: API.BATCHES.ASSIGN_FACULTY(selectedBatchId),
      body: {
        faculty_id: selectedFacultyForAssign.id,
        subject_id: apiSubjectId,
      },
      auth: true,
      getResponse: () => {
        toast.success("Faculty assigned to batch successfully.");
        setSelectedBatchId("");
        setSelectedSubjectId("");
        fetchDropdowns();
        fetchFacultyDetails(selectedFacultyForAssign.id);
        setAssignLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to assign faculty");
        setAssignLoading(false);
      },
    });
  };

  const handleRemoveFacultyFromBatch = (batchId: string) => {
    if (!selectedFacultyForAssign) return;

    setAssignLoading(true);
    dispatch({
      type: batchAction.REMOVE_FACULTY,
      method: "POST",
      endPoint: API.BATCHES.REMOVE_FACULTY(batchId, selectedFacultyForAssign.id),
      auth: true,
      getResponse: () => {
        toast.success("Faculty removed from batch successfully.");
        fetchDropdowns();
        fetchFacultyDetails(selectedFacultyForAssign.id);
        setAssignLoading(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to remove faculty");
        setAssignLoading(false);
      },
    });
  };

  const assignedBatches = useMemo(() => {
    if (!selectedFacultyForAssign) return [];

    let facultyBatchNames: string[] = [];
    const rawBatchName = selectedFacultyForAssign.batch_name;

    if (typeof rawBatchName === "string") {
      facultyBatchNames = rawBatchName
        .split(",")
        .map((name: string) => name.trim().toLowerCase())
        .filter(Boolean);
    } else if (Array.isArray(rawBatchName)) {
      facultyBatchNames = rawBatchName
        .map((name: any) => String(name).trim().toLowerCase())
        .filter(Boolean);
    }

    return batches.filter((b) => {
      const nameMatch = facultyBatchNames.includes(b.name?.trim().toLowerCase());
      const facultyMatch = b.assigned_faculty?.some(
        (f: any) => f.faculty_id === selectedFacultyForAssign.id,
      );
      return nameMatch || facultyMatch;
    });
  }, [batches, selectedFacultyForAssign]);

  const assignableBatches = useMemo(() => {
    return batches.filter((b) => !assignedBatches.some((ab) => ab.id === b.id));
  }, [batches, assignedBatches]);

  const handleRowClick = (faculty: any) => {
    setSelectedFacultyId(faculty.id);
    setIsSheetOpen(true);
  };

  useEffect(() => {
    const endPoint =
      user && user.role === "branch_manager" && user.branch
        ? `/api/v1/faculty/?branch_id=${user.branch}`
        : "/api/v1/faculty/";

    dispatch({
      type: facultyAction.GET_FACULTY,
      method: "GET",
      endPoint: endPoint,
      auth: true,
      setLoading: (val: boolean) => dispatch(setFacultyLoading(val)),
      getResponse: (res: any) => {
        if (res.data) dispatch(setFaculty(res.data));
        setHasFetchedFaculties(true);
      },
      getError: (err: any) => {
        dispatch(setFacultyError(err.message));
        toast.error("Failed to load faculty members");
        setHasFetchedFaculties(true);
      },
    } as any);
  }, [dispatch, toast, user]);

  const filteredFacultyList = useMemo(() => {
    let list = facultyList;
    if (user && user.role !== "super_admin" && user.branch) {
      list = list.filter((f) => {
        const branchId =
          typeof f.branch === "object" && f.branch !== null ? (f.branch as any).id : f.branch;
        return branchId === user.branch;
      });
    }
    return list;
  }, [facultyList, user]);

  useEffect(() => {
    if (!isFaculty && !summaryFacultyId && filteredFacultyList.length > 0) {
      setSummaryFacultyId(filteredFacultyList[0].id);
    }
  }, [filteredFacultyList, isFaculty, summaryFacultyId]);

  const filteredSessions = useMemo(() => {
    let list = sessions;
    if (user && user.role !== "super_admin" && user.branch) {
      list = list.filter((s) => {
        const branchId = typeof s.branch === "object" && s.branch !== null ? s.branch.id : s.branch;
        return branchId === user.branch;
      });
    }
    return list;
  }, [sessions, user]);

  const filteredLatePolicies = useMemo(() => {
    let list = allLatePolicies;
    if (user && user.role !== "super_admin" && user.branch) {
      list = list.filter((p) => {
        const branchId = typeof p.branch_id === "string" ? p.branch_id : p.branch?.id || p.branch;
        return branchId === user.branch;
      });
    }
    return list;
  }, [allLatePolicies, user]);

  const payrollRows = useMemo(() => {
    let list = payrolls;
    if (user && user.role !== "super_admin" && user.branch) {
      list = list.filter((p) => {
        const branchId =
          typeof p.branch === "object" && p.branch !== null ? p.branch.id : p.branch_id || p.branch;
        return branchId === user.branch;
      });
    }
    if (!payrollMonth || payrollMonth === "All Months") return list;
    return list.filter((p) => {
      const pMonthStr = `${monthNames[p.month - 1]} ${p.year}`;
      return pMonthStr === payrollMonth;
    });
  }, [payrolls, payrollMonth, monthNames, user]);

  const totalPayrollDue = useMemo(() => {
    return payrollRows.reduce(
      (s, p) => s + (p.status !== "disbursed" ? parseFloat(p.total_amount || 0) : 0),
      0,
    );
  }, [payrollRows]);

  const computePayroll = () => {
    toast.success(`Payroll computed for ${payrollMonth || "selected period"}.`);
  };

  const handleApprovePayroll = (payrollId: string) => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "POST",
      endPoint: `/api/v1/payroll/${payrollId}/approve/`,
      auth: true,
      getResponse: () => {
        toast.success("Payroll approved successfully.");
        fetchPayroll();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to approve payroll");
      },
    });
  };

  const handleDisbursePayroll = (payrollId: string) => {
    dispatch({
      type: dropdownActions.GET_DROPDOWN,
      method: "POST",
      endPoint: `/api/v1/payroll/${payrollId}/disburse/`,
      auth: true,
      getResponse: () => {
        toast.success("Payroll disbursed successfully.");
        fetchPayroll();
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to disburse payroll");
      },
    });
  };

  const submitApproval = () => {
    const draftRows = payrollRows.filter((r) => r.status === "draft");
    if (draftRows.length === 0) {
      toast.info("No draft payrolls to approve for this period.");
      return;
    }

    let completed = 0;
    draftRows.forEach((r) => {
      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "POST",
        endPoint: `/api/v1/payroll/${r.id}/approve/`,
        auth: true,
        getResponse: () => {
          completed++;
          if (completed === draftRows.length) {
            toast.success("All draft payrolls approved successfully.");
            fetchPayroll();
          }
        },
        getError: (err: any) => {
          toast.error(
            `Failed to approve payroll for ${r.branch_name}: ${err?.response?.data?.message || ""}`,
          );
        },
      });
    });
  };

  const approveAll = () => {
    const approvedRows = payrollRows.filter((r) => r.status === "approved" || r.status === "draft");
    if (approvedRows.length === 0) {
      toast.info("No actionable payrolls to disburse for this period.");
      setConfirmApprove(false);
      return;
    }

    let completed = 0;
    approvedRows.forEach((r) => {
      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "POST",
        endPoint: `/api/v1/payroll/${r.id}/disburse/`,
        auth: true,
        getResponse: () => {
          completed++;
          if (completed === approvedRows.length) {
            toast.success("All selected payrolls disbursed successfully.");
            fetchPayroll();
          }
        },
        getError: (err: any) => {
          toast.error(
            `Failed to disburse payroll for ${r.branch_name}: ${err?.response?.data?.message || ""}`,
          );
        },
      });
    });
    setConfirmApprove(false);
  };

  const renderSummaryTab = () => {
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

    const subjectData =
      summaryData?.by_subject?.map((s: any) => ({
        name: s.subject_name || s.name || s.subject || "Unknown",
        sessions: s.sessions || s.count || 0,
        hours: s.hours || 0,
      })) || [];

    const batchData =
      summaryData?.by_batch?.map((b: any) => ({
        name: b.batch_name || b.name || b.batch || "Unknown",
        sessions: b.sessions || b.count || 0,
        hours: b.hours || 0,
      })) || [];

    return (
      <TabsContent value="summary" className="mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold">Monthly Summary</h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!isFaculty && (
              <Select value={summaryFacultyId} onValueChange={setSummaryFacultyId}>
                <SelectTrigger className="w-full sm:w-64 bg-muted/10 border-border">
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  {filteredFacultyList.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.full_name} {f.employee_id ? `(${f.employee_id})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              type="month"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
        {summaryLoading ||
        (!summaryFetchAttempted &&
          (isFaculty || !hasFetchedFaculties || filteredFacultyList.length > 0)) ? (
          <FacultySummarySkeleton />
        ) : summaryData ? (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm text-muted-foreground mb-1">Total Sessions</div>
                <div className="text-3xl font-bold">{summaryData.total_sessions || 0}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm text-muted-foreground mb-1">Completed / In Progress</div>
                <div className="text-3xl font-bold text-success">
                  {summaryData.completed_sessions || 0}{" "}
                  <span className="text-xl text-muted-foreground">
                    / {summaryData.in_progress_sessions || 0}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm text-muted-foreground mb-1">Total Hours</div>
                <div className="text-3xl font-bold text-primary">
                  {summaryData.total_hours || 0}h
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm text-muted-foreground mb-1">Avg Completion</div>
                <div className="text-3xl font-bold">
                  {summaryData.avg_completion_percentage || 0}%
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 h-[350px] flex flex-col">
                <h4 className="font-semibold mb-4">Sessions by Subject</h4>
                {subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="sessions"
                      >
                        {subjectData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-border bg-card p-5 h-[350px] flex flex-col">
                <h4 className="font-semibold mb-4">Sessions by Batch</h4>
                {batchData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={batchData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                      <Bar
                        dataKey="sessions"
                        fill="#8884d8"
                        name="Sessions"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No summary data available for this month.
          </div>
        )}
      </TabsContent>
    );
  };

  if (isFaculty) {
    const myAttendance: any[] = [];
    const myReports: any[] = [];
    const myPayslips: any[] = [];
    return (
      <div>
        <PageHeader
          title="My Faculty Hub"
          subtitle="Attendance, sessions, leave and payroll in one place"
          actions={
            <Button
              onClick={() => {
                setSessionReportForm({
                  faculty_id: isFaculty ? user?.id || "" : "",
                  batch_id: "",
                  subject_id: "",
                  session_date: new Date().toISOString().split("T")[0],
                  chapter_covered: "",
                  topics_covered: "",
                  completion_percentage: 100,
                  status: "completed",
                  start_time: "10:00",
                  end_time: "12:00",
                  notes: "",
                });
                setSessionDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Submit Session Report
            </Button>
          }
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Hours This Month" value="64" icon={Briefcase} index={0} />
          <StatCard
            title="Sessions Logged"
            value={myReports.length}
            icon={ClipboardList}
            index={1}
          />
          <StatCard
            title="Late Days"
            value={myAttendance.filter((a) => a.late).length}
            icon={Users}
            trendType="warning"
            index={2}
          />
          <StatCard
            title="Net Payable (May)"
            value="₹52,800"
            icon={Wallet}
            trendType="up"
            index={3}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="sessions">Session Reports</TabsTrigger>
            <TabsTrigger value="payslips">My Payslips</TabsTrigger>
          </TabsList>
          {renderSummaryTab()}
          <TabsContent value="attendance" className="mt-4">
            <DataTable
              data={myAttendance}
              columns={[
                { key: "date", header: "Date" },
                { key: "checkIn", header: "Check In" },
                { key: "checkOut", header: "Check Out" },
                { key: "hours", header: "Hours" },
                {
                  key: "late",
                  header: "Late",
                  render: (r: any) =>
                    r.late ? (
                      <Badge variant="destructive">Late</Badge>
                    ) : (
                      <Badge className="bg-success/20 text-success">On time</Badge>
                    ),
                },
              ]}
            />
          </TabsContent>
          <TabsContent value="sessions" className="mt-4">
            <DataTable
              data={filteredSessions}
              loading={sessionsLoading}
              onRowClick={(row) => {
                setSelectedSessionId(row.id || row.uuid);
                setIsSessionSheetOpen(true);
              }}
              columns={[
                {
                  key: "date",
                  header: "Date",
                  render: (r: any) =>
                    r.session_date
                      ? new Date(r.session_date).toLocaleDateString()
                      : r.date
                        ? new Date(r.date).toLocaleDateString()
                        : "—",
                },
                {
                  key: "batch",
                  header: "Batch",
                  render: (r: any) => r.batch_name || r.batch?.name || r.batch || "—",
                },
                {
                  key: "subject",
                  header: "Subject",
                  render: (r: any) => r.subject_name || r.subject?.name || r.subject || "—",
                },
                {
                  key: "chapter",
                  header: "Chapter",
                  render: (r: any) => r.chapter_covered || r.chapter || "—",
                },
                {
                  key: "topic",
                  header: "Topic",
                  render: (r: any) => r.topics_covered || r.topic || "—",
                },
                {
                  key: "time",
                  header: "Time",
                  render: (r: any) =>
                    r.start_time && r.end_time
                      ? `${r.start_time.substring(0, 5)} - ${r.end_time.substring(0, 5)}`
                      : "—",
                },
                {
                  key: "completion",
                  header: "%",
                  render: (r: any) => `${r.completion_percentage || r.completionPercent || 0}%`,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r: any) => (
                    <Badge
                      variant={r.status === "completed" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {r.status_display || r.status?.replace("_", " ") || "—"}
                    </Badge>
                  ),
                },
              ]}
            />
          </TabsContent>
          <TabsContent value="payslips" className="mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPayslips.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-heading font-semibold">{p.month}</div>
                    <Badge variant="outline" className="capitalize">
                      {p.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-3xl font-heading font-bold text-primary-dark">
                    ₹{p.netPayable.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Net Payable</div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hours</span>
                      <span>{p.hoursTaught}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross</span>
                      <span>₹{p.grossAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deductions</span>
                      <span>
                        -₹{(p.lateEntryDeductions + p.absenceDeductions).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="directory">Faculty Directory</TabsTrigger>
          <TabsTrigger value="sessions">Session Reports</TabsTrigger>
          {/* {canPayroll && <TabsTrigger value="payroll">Payroll</TabsTrigger>} */}
          {/* {canPayroll && <TabsTrigger value="late-policies">Late Policies</TabsTrigger>} */}
        </TabsList>

        {renderSummaryTab()}

        <TabsContent value="directory" className="mt-4">
          <DataTable
            data={filteredFacultyList}
            loading={isLoading}
            searchable
            exportable
            pageSize={20}
            onRowClick={handleRowClick}
            columns={[
              {
                key: "full_name",
                header: "Name",
                render: (f: any) => (
                  <div className="flex items-center gap-3">
                    {f.photo_url ? (
                      <img
                        src={f.photo_url}
                        alt={f.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {f.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}
                    <span className="font-medium">{f.full_name}</span>
                  </div>
                ),
              },
              { key: "employee_id", header: "Employee ID" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone" },
              { key: "branch_name", header: "Branch" },
              {
                key: "employment_type_display",
                header: "Type",
                render: (f: any) => (
                  <Badge variant="secondary" className="capitalize">
                    {f.employment_type_display}
                  </Badge>
                ),
              },
              {
                key: "is_active",
                header: "Status",
                render: (f: any) => (
                  <Badge
                    className={
                      f.is_active
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive"
                    }
                  >
                    {f.is_active ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "",
                render: (f: any) => (
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
                          handleRowClick(f);
                        }}
                      >
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignModal(f);
                        }}
                      >
                        Assign and Remove Batch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setSessionReportForm({
                  faculty_id: isFaculty ? user?.id || "" : "",
                  batch_id: "",
                  subject_id: "",
                  session_date: new Date().toISOString().split("T")[0],
                  chapter_covered: "",
                  topics_covered: "",
                  completion_percentage: 100,
                  status: "completed",
                  start_time: "10:00",
                  end_time: "12:00",
                  notes: "",
                });
                setSessionDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Submit Session Report
            </Button>
          </div>
          <DataTable
            exportable
            data={filteredSessions}
            loading={sessionsLoading}
            onRowClick={(row) => {
              setSelectedSessionId(row.id || row.uuid);
              setIsSessionSheetOpen(true);
            }}
            columns={[
              {
                key: "date",
                header: "Date",
                render: (r: any) =>
                  r.session_date
                    ? new Date(r.session_date).toLocaleDateString()
                    : r.date
                      ? new Date(r.date).toLocaleDateString()
                      : "—",
              },
              {
                key: "faculty",
                header: "Faculty",
                render: (r: any) => r.faculty_name || r.faculty?.full_name || r.facultyId || "—",
              },
              {
                key: "batch",
                header: "Batch",
                render: (r: any) => r.batch_name || r.batch?.name || r.batch || "—",
              },
              {
                key: "subject",
                header: "Subject",
                render: (r: any) => r.subject_name || r.subject?.name || r.subject || "—",
              },
              {
                key: "chapter",
                header: "Chapter",
                render: (r: any) => r.chapter_covered || r.chapter || "—",
              },
              // {
              //   key: "topic",
              //   header: "Topic",
              //   render: (r: any) => {
              //     const topics = (r.topics_covered || r.topic || "")
              //       .split(",")
              //       .map((t: string) => t.trim())
              //       .filter(Boolean);

              //     return topics.length ? (
              //       <div className="flex flex-wrap gap-1">
              //         {topics.map((topic: string) => (
              //           <span
              //             key={topic}
              //             className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md"
              //           >
              //             {topic}
              //           </span>
              //         ))}
              //       </div>
              //     ) : (
              //       "—"
              //     );
              //   },
              // },
              {
                key: "time",
                header: "Time",
                render: (r: any) =>
                  r.start_time && r.end_time
                    ? `${r.start_time.substring(0, 5)} - ${r.end_time.substring(0, 5)}`
                    : "—",
              },
              {
                key: "completion",
                header: "%",
                render: (r: any) => `${r.completion_percentage || r.completionPercent || 0}%`,
              },
              {
                key: "status",
                header: "Status",
                render: (r: any) => (
                  <Badge
                    variant={r.status === "completed" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {r.status_display || r.status?.replace("_", " ") || "—"}
                  </Badge>
                ),
              },
              {
                key: "notes",
                header: "Notes",
                render: (r: any) => r.notes || r.remarks || "—",
              },
            ]}
          />
        </TabsContent>

        {canPayroll && (
          <TabsContent value="payroll" className="mt-4">
            <div className="flex flex-wrap gap-2 items-center mb-4">
              {payrollMonths.length > 0 && (
                <Select value={payrollMonth} onValueChange={setPayrollMonth}>
                  <SelectTrigger className="w-48 bg-muted/10 border-border">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollMonths.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* <Button variant="outline" onClick={computePayroll}>
                Compute Payroll
              </Button>
              <Button variant="outline" onClick={submitApproval}>
                Submit for Approval
              </Button>
              <Button onClick={() => setConfirmApprove(true)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Disburse
              </Button> */}
            </div>
            <DataTable
              exportable
              loading={payrollLoading}
              data={payrollRows}
              onRowClick={(row) => navigate(`/faculty/payroll/${row.id}`)}
              columns={[
                { key: "branch_name", header: "Branch" },
                {
                  key: "month",
                  header: "Period",
                  render: (r: any) => `${monthNames[r.month - 1] || r.month} ${r.year}`,
                },
                { key: "faculty_count", header: "Faculties" },
                {
                  key: "total_amount",
                  header: "Total Amount",
                  render: (r: any) => {
                    const amt = parseFloat(r.total_amount);
                    return isNaN(amt)
                      ? `₹${r.total_amount}`
                      : `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r: any) => {
                    const statusColors: Record<string, string> = {
                      draft: "bg-gray-100 text-gray-700 border-gray-200",
                      pending_approval: "bg-yellow-100 text-yellow-700 border-yellow-200",
                      approved: "bg-blue-100 text-blue-700 border-blue-200",
                      disbursed: "bg-green-100 text-green-700 border-green-200",
                    };
                    return (
                      <Badge className={statusColors[r.status] || "bg-gray-150 text-gray-800"}>
                        {r.status_display || r.status}
                      </Badge>
                    );
                  },
                },
                {
                  key: "generated_at",
                  header: "Generated At",
                  render: (r: any) =>
                    r.generated_at ? new Date(r.generated_at).toLocaleString() : "—",
                },
                {
                  key: "actions",
                  header: "",
                  render: (r: any) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {r.status === "draft" ||
                          (r.status === "pending_approval" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprovePayroll(r.id);
                              }}
                            >
                              Approve
                            </DropdownMenuItem>
                          ))}
                        {r.status === "approved" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisbursePayroll(r.id);
                            }}
                          >
                            Disburse
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/faculty/payroll/${r.id}`);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ),
                },
              ]}
            />
            <ConfirmDialog
              open={confirmApprove}
              onOpenChange={setConfirmApprove}
              title="Approve & Disburse Payroll?"
              description={`This will mark all selected branch payrolls as disbursed.`}
              onConfirm={approveAll}
            />
          </TabsContent>
        )}

        {canPayroll && (
          <TabsContent value="late-policies" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  setLatePolicyForm({
                    branch_id:
                      user && user.role === "branch_manager" && user.branch ? user.branch : "",
                    grace_period_minutes: 5,
                    deduction_per_minute: "0.00",
                    max_deduction_per_session: "0.00",
                    absence_deduction_per_day: "0.00",
                    late_entry_threshold: 3,
                    auto_halfday_deduction: true,
                  });
                  setLatePolicyDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Policy
              </Button>
            </div>
            <DataTable
              data={filteredLatePolicies}
              loading={latePolicyFetching}
              columns={[
                { key: "branch_name", header: "Branch" },
                { key: "grace_period_minutes", header: "Grace Period (m)" },
                { key: "deduction_per_minute", header: "Ded/Min (₹)" },
                { key: "max_deduction_per_session", header: "Max/Session (₹)" },
                { key: "absence_deduction_per_day", header: "Absence/Day (₹)" },
                { key: "late_entry_threshold", header: "Threshold" },
                {
                  key: "auto_halfday_deduction",
                  header: "Auto Half-Day",
                  render: (r: any) => (r.auto_halfday_deduction ? "Yes" : "No"),
                },
                {
                  key: "actions",
                  header: "",
                  render: (r: any) => (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLatePolicyForm({
                            branch_id: r.branch_id || r.branch?.id || r.branch || "",
                            grace_period_minutes: r.grace_period_minutes ?? 5,
                            deduction_per_minute: r.deduction_per_minute ?? "0.00",
                            max_deduction_per_session: r.max_deduction_per_session ?? "0.00",
                            absence_deduction_per_day: r.absence_deduction_per_day ?? "0.00",
                            late_entry_threshold: r.late_entry_threshold ?? 3,
                            auto_halfday_deduction: r.auto_halfday_deduction ?? true,
                          });
                          setLatePolicyDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletePolicyId(r.id || r.policy_id || r.uuid)}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={!!deletePolicyId}
        onOpenChange={(open) => !open && setDeletePolicyId(null)}
        title="Delete Late Policy"
        description="Are you sure you want to delete this late policy? This action cannot be undone."
        onConfirm={() => {
          if (deletePolicyId) handleDeleteLatePolicy(deletePolicyId);
          setDeletePolicyId(null);
        }}
      />

      <Dialog open={latePolicyDialogOpen} onOpenChange={setLatePolicyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Late Policy Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {user?.role === "super_admin" && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Branch
                </Label>
                <Select
                  value={latePolicyForm.branch_id || ""}
                  onValueChange={(val) =>
                    setLatePolicyForm({
                      ...latePolicyForm,
                      branch_id: val,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={branchesLoading ? "Loading branches..." : "Select Branch"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grace Period (Minutes)
              </Label>
              <Input
                type="number" min="0"
                value={latePolicyForm.grace_period_minutes}
                onChange={(e) =>
                  setLatePolicyForm({
                    ...latePolicyForm,
                    grace_period_minutes: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 5"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deduction Per Minute (₹)
              </Label>
              <Input
                type="number" min="0"
                step="0.01"
                value={latePolicyForm.deduction_per_minute}
                onChange={(e) =>
                  setLatePolicyForm({
                    ...latePolicyForm,
                    deduction_per_minute: e.target.value,
                  })
                }
                placeholder="e.g. 10.00"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Max Deduction Per Session (₹)
              </Label>
              <Input
                type="number" min="0"
                step="0.01"
                value={latePolicyForm.max_deduction_per_session}
                onChange={(e) =>
                  setLatePolicyForm({
                    ...latePolicyForm,
                    max_deduction_per_session: e.target.value,
                  })
                }
                placeholder="e.g. 200.00"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Absence Deduction Per Day (₹)
              </Label>
              <Input
                type="number" min="0"
                step="0.01"
                value={latePolicyForm.absence_deduction_per_day}
                onChange={(e) =>
                  setLatePolicyForm({
                    ...latePolicyForm,
                    absence_deduction_per_day: e.target.value,
                  })
                }
                placeholder="e.g. 500.00"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Late Entry Threshold
              </Label>
              <Input
                type="number" min="0"
                value={latePolicyForm.late_entry_threshold}
                onChange={(e) =>
                  setLatePolicyForm({
                    ...latePolicyForm,
                    late_entry_threshold: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 3"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
              <Label className="text-xs font-semibold text-text-primary cursor-pointer">
                Auto Half-Day Deduction
              </Label>
              <Switch
                checked={latePolicyForm.auto_halfday_deduction}
                onCheckedChange={(checked) =>
                  setLatePolicyForm({ ...latePolicyForm, auto_halfday_deduction: checked })
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLatePolicyDialogOpen(false)}
              disabled={latePolicySaving || latePolicyFetching}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLatePolicy}
              disabled={latePolicySaving || latePolicyFetching}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-w-[80px]"
            >
              {latePolicySaving ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacultyDetailSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        facultyId={selectedFacultyId}
      />
      <SessionDetailSheet
        open={isSessionSheetOpen}
        onOpenChange={setIsSessionSheetOpen}
        sessionId={selectedSessionId}
      />

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Batch</DialogTitle>
          </DialogHeader>
          {selectedFacultyForAssign && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Faculty Details
                </span>
                <p className="font-semibold text-text-primary text-base">
                  {selectedFacultyForAssign.full_name}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>
                    Level:{" "}
                    <strong className="capitalize">
                      {selectedFacultyForAssign.level_display ||
                        selectedFacultyForAssign.level ||
                        "N/A"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Type:{" "}
                    <strong className="capitalize">
                      {selectedFacultyForAssign.employment_type_display ||
                        selectedFacultyForAssign.employment_type ||
                        "N/A"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Current Batch Info */}
              <div className="rounded-lg bg-muted/20 border border-border/40 p-3 space-y-2">
                <span className="text-xs font-medium text-muted-foreground block">
                  Current Enrollment Status
                </span>
                {assignedBatches.length === 0 ? (
                  <p className="text-sm font-medium text-muted-foreground">No batches assigned</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {assignedBatches.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                      >
                        <p className="text-sm font-medium text-foreground">{b.name}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleRemoveFacultyFromBatch(b.id)}
                          disabled={assignLoading}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Batch Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Assign to Batch
                </label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="w-full bg-muted/10">
                    <SelectValue
                      placeholder={batchesLoading ? "Loading batches..." : "Select a batch"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableBatches.length === 0 ? (
                      <SelectItem value="no_batches" disabled>
                        No available batches
                      </SelectItem>
                    ) : (
                      assignableBatches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} ({b.course_name || "General"})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Assign New Subject Selector (Optional) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Subject (Optional)
                </label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="w-full bg-muted/10">
                    <SelectValue
                      placeholder={subjectsLoading ? "Loading subjects..." : "Select a subject"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (No subject)</SelectItem>
                    {subjects.length === 0 ? (
                      <SelectItem value="no_subjects" disabled>
                        No subjects available
                      </SelectItem>
                    ) : (
                      subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.code || "No Code"})
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
              onClick={handleAssignFacultyToBatch}
              disabled={!selectedBatchId || assignLoading}
              className="bg-primary hover:bg-primary-dark"
            >
              {assignLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6 mt-2">
            <SheetTitle>New Session Report</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4">
            {!isFaculty && (
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Faculty
                </Label>
                <Select
                  value={sessionReportForm.faculty_id}
                  onValueChange={(val) =>
                    setSessionReportForm({ ...sessionReportForm, faculty_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyList.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Batch</Label>
              <Select
                value={sessionReportForm.batch_id}
                onValueChange={(val) =>
                  setSessionReportForm({ ...sessionReportForm, batch_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Subject
              </Label>
              <Select
                value={sessionReportForm.subject_id}
                onValueChange={(val) =>
                  setSessionReportForm({ ...sessionReportForm, subject_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={sessionReportForm.session_date}
                onChange={(e) =>
                  setSessionReportForm({ ...sessionReportForm, session_date: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Status
              </Label>
              <Select
                value={sessionReportForm.status}
                onValueChange={(val) => setSessionReportForm({ ...sessionReportForm, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Start Time
              </Label>
              <Input
                type="time"
                value={sessionReportForm.start_time}
                onChange={(e) =>
                  setSessionReportForm({ ...sessionReportForm, start_time: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                End Time
              </Label>
              <Input
                type="time"
                value={sessionReportForm.end_time}
                onChange={(e) =>
                  setSessionReportForm({ ...sessionReportForm, end_time: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Chapter Covered
              </Label>
              <Select
                value={sessionReportForm.chapter_covered}
                onValueChange={(val) =>
                  setSessionReportForm({ ...sessionReportForm, chapter_covered: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.length === 0 && (
                    <SelectItem value="none" disabled>
                      No chapters available
                    </SelectItem>
                  )}
                  {chapters.map((c: any) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Topics Covered
              </Label>
              <Input
                placeholder="e.g. QuerySet, Filters"
                value={sessionReportForm.topics_covered}
                onChange={(e) =>
                  setSessionReportForm({ ...sessionReportForm, topics_covered: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Completion %
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={sessionReportForm.completion_percentage}
                onChange={(e) =>
                  setSessionReportForm({
                    ...sessionReportForm,
                    completion_percentage: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Notes/Remarks
              </Label>
              <Textarea
                placeholder="Any additional notes..."
                value={sessionReportForm.notes}
                onChange={(e) =>
                  setSessionReportForm({ ...sessionReportForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <SheetFooter className="mt-8">
            <Button
              variant="outline"
              onClick={() => setSessionDialogOpen(false)}
              disabled={submittingSession}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSessionReport}
              disabled={submittingSession}
              className="bg-primary hover:bg-primary-dark"
            >
              {submittingSession ? "Submitting..." : "Submit Report"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
