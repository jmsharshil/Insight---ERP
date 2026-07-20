import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Wallet,
  Clock,
  AlertCircle,
  RotateCcw,
  Upload,
  CheckCircle2,
  XCircle,
  Send,
  Bell,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";

import ReportsTab from "./tabs/ReportsTab";
import StructuresTab from "./tabs/StructuresTab";
import StudentFeesTab from "./tabs/StudentFeesTab";
import InstallmentsTab from "./tabs/InstallmentsTab";
import PaymentsTab from "./tabs/PaymentsTab";
import BankAccountsTab from "./tabs/BankAccountsTab";
import RefundsTab from "./tabs/RefundsTab";
import {
  RecordPaymentDialog,
  VerifyPaymentDialog,
  RejectDialog,
  RefundDialog,
  CashEntryDialog,
  FeeStructureDialog,
  ViewFeeStructureDialog,
  AssignStudentFeeDialog,
  ViewStudentFeeOverviewDialog,
  ViewInstallmentPlanDialog,
  RejectInstallmentDialog,
  BankAccountDialog,
  CreateRefundDialog,
  CreateInstallmentDialog,
} from "./dialogs";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { StudentDetailSkeleton, FeeTableSkeleton } from "@/components/common/Skeletons";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useUI } from "@/hooks/useUI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  DUMMY_FEE_TXNS,
  FEE_STATUS_META,
  FEE_STRUCTURES,
  type FeeTransaction,
  type FeeStatus,
  type PaymentMode,
} from "@/constants/dummy/fees";
import { DUMMY_STUDENTS } from "@/constants/dummy/students";
import { useDispatch, useSelector } from "react-redux";
import { feesActions, courseAction, studentActions } from "@/redux/actions";
import {
  setFeeStructure,
  addFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  setStudentFees,
  addStudentFee,
  type FeesStructure,
  type StudentFee,
} from "@/redux/slices/feesSlice";
import { setStudents, setStudentsLoading, setStudentsError } from "@/redux/slices/studentSlice";
import { setCourses } from "@/redux/slices/coursesSlice";
import { RootState, AppDispatch } from "@/store";
import { API } from "@/service/api";

const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function FeesPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();

  // API Query Filters
  const [sfStudentName, setSfStudentName] = useState("");
  const [debouncedSfStudentName, setDebouncedSfStudentName] = useState("");
  const [sfStatus, setSfStatus] = useState("all");

  const [payStudentName, setPayStudentName] = useState("");
  const [debouncedPayStudentName, setDebouncedPayStudentName] = useState("");
  const [payStatus, setPayStatus] = useState("all");

  const [instStudentName, setInstStudentName] = useState("");
  const [debouncedInstStudentName, setDebouncedInstStudentName] = useState("");
  const [instStatus, setInstStatus] = useState("all");

  // Debounce hook effects
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSfStudentName(sfStudentName);
    }, 400);
    return () => clearTimeout(handler);
  }, [sfStudentName]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPayStudentName(payStudentName);
    }, 400);
    return () => clearTimeout(handler);
  }, [payStudentName]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInstStudentName(instStudentName);
    }, 400);
    return () => clearTimeout(handler);
  }, [instStudentName]);

  const role = user?.role;

  const isStudentLike = role === "student" || role === "parent" || role === "parents";
  const isAccountant = role === "accountant";
  const isBM = role === "branch_manager";
  const isAdmin = ["super_admin", "branch_manager"].includes(role as string);
  const isAdminSr = role === "admin_senior_executive";

  const feeStructure = useSelector((state: RootState) => state.fees.feeStructure);
  const studentFees = useSelector((state: RootState) => state.fees.studentFees);
  const { students } = useSelector((state: RootState) => state.students);
  const courses = useSelector((state: RootState) => state.courses.courses);


  useEffect(() => {
    setPageTitle("Fees");
  }, [setPageTitle]);

  useEffect(() => {
    if (courses.length === 0) {
      dispatch({
        type: courseAction.GET_COURSES,
        method: "GET",
        endPoint: API.COURSES.LIST,
        auth: true,
        getResponse: (res: any) => {
          if (res?.data) {
            dispatch(setCourses(res.data));
          } else if (Array.isArray(res)) {
            dispatch(setCourses(res));
          }
        },
      });
    }
  }, [dispatch, courses.length]);



  const fetchStudentFees = useCallback(
    (studentName?: string, status?: string) => {
      let url: string = API.FEES.STUDENT_FEES_LIST;
      const params = new URLSearchParams();
      if (studentName?.trim()) params.append("search", studentName.trim());
      if (status && status !== "all") params.append("status", status);

      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }

      dispatch({
        type: feesActions.GET_STUDENT_FEES,
        method: "GET",
        endPoint: url,
        auth: true,
        setLoading: setStudentFeesLoading,
        getResponse: (res: any) => {
          const data = res?.data ?? res;
          if (Array.isArray(data)) {
            dispatch(setStudentFees(data));
          }
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to load student fees";
          toast.error(msg);
        },
      });
    },
    [dispatch],
  );
  useEffect(() => {
    if (students.length === 0) {
      dispatch({
        type: studentActions.GET_STUDENTS,
        method: "GET",
        endPoint: API.STUDENTS.LIST,
        auth: true,
        setLoading: (loading: boolean) => dispatch(setStudentsLoading(loading)),
        getResponse: (res: any) => {
          const payload = Array.isArray(res?.data)
            ? { data: res.data, count: res.count || res.data.length }
            : Array.isArray(res)
              ? { data: res, count: res.length }
              : { data: res?.results || [], count: res?.count || 0 };
          dispatch(setStudents(payload));
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to load students";
          dispatch(setStudentsError(msg));
        },
      });
    }
  }, [dispatch, students.length]);

  const [txns, setTxns] = useState<FeeTransaction[]>(DUMMY_FEE_TXNS);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [reject, setReject] = useState<FeeTransaction | null>(null);
  const [approve, setApprove] = useState<FeeTransaction | null>(null);
  const [refundOpen, setRefundOpen] = useState<FeeTransaction | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);

  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<any | null>(null);
  const [verifyPaymentLoading, setVerifyPaymentLoading] = useState(false);
  const [recordPaymentLoading, setRecordPaymentLoading] = useState(false);
  const [adminRecordPaymentOpen, setAdminRecordPaymentOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<any | null>(null);
  const [deleteBankAccountOpen, setDeleteBankAccountOpen] = useState<any | null>(null);
  const [deleteBankAccountLoading, setDeleteBankAccountLoading] = useState(false);
  const [bankAccountFormLoading, setBankAccountFormLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeesStructure | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<FeesStructure | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fsLoading, setFsLoading] = useState(false);
  const [feeStructuresLoading, setFeeStructuresLoading] = useState(false);
  const [feeStructuresFetched, setFeeStructuresFetched] = useState(false);
  const [studentFeesLoading, setStudentFeesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("reports");
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [viewingStructure, setViewingStructure] = useState<FeesStructure | null>(null);
  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);

  const [installments, setInstallments] = useState<any[]>([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [createInstallmentOpen, setCreateInstallmentOpen] = useState(false);
  const [createInstallmentLoading, setCreateInstallmentLoading] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);
  const [viewingInstallment, setViewingInstallment] = useState<any | null>(null);
  const [installmentCreatedMessage, setInstallmentCreatedMessage] = useState<string | null>(null);
  const [rejectInstallment, setRejectInstallment] = useState<any | null>(null);

  const [instStudentId, setInstStudentId] = useState("");
  const [instStudentFeeId, setInstStudentFeeId] = useState("");
  const [instTotalAmount, setInstTotalAmount] = useState<number>(0);
  const [instItems, setInstItems] = useState<{ amount: string; due_date: string }[]>([]);

  // Refund states
  const [refunds, setRefunds] = useState<any[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refStudentName, setRefStudentName] = useState("");
  const [debouncedRefStudentName, setDebouncedRefStudentName] = useState("");
  const [refStatus, setRefStatus] = useState("all");
  const [createRefundOpen, setCreateRefundOpen] = useState(false);
  const [createRefundLoading, setCreateRefundLoading] = useState(false);

  const fetchInstallments = useCallback(
    (studentName?: string, status?: string) => {
      let url: string = API.INSTALLMENTS.LIST;
      const params = new URLSearchParams();
      if (studentName?.trim()) params.append("search", studentName.trim());
      if (status && status !== "all") params.append("status", status);

      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }

      dispatch({
        type: feesActions.GET_INSTALLMENTS,
        method: "GET",
        endPoint: url,
        auth: true,
        setLoading: setInstallmentsLoading,
        getResponse: (res: any) => {
          setInstallments(res?.data || res || []);
        },
        getError: (err: any) => {
          console.error("Failed to load installments", err);
        },
      });
    },
    [dispatch],
  );

  const fetchPayments = useCallback(
    (studentName?: string, status?: string) => {
      let url: string = API.PAYMENTS.LIST;
      const params = new URLSearchParams();
      if (studentName?.trim()) params.append("search", studentName.trim());
      if (status && status !== "all") params.append("status", status);

      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }

      dispatch({
        type: feesActions.GET_PAYMENTS,
        method: "GET",
        endPoint: url,
        auth: true,
        setLoading: setPaymentsLoading,
        getResponse: (res: any) => {
          setPayments(res?.data || res || []);
        },
        getError: (err: any) => {
          console.error("Failed to load payments", err);
        },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRefStudentName(refStudentName);
    }, 400);
    return () => clearTimeout(handler);
  }, [refStudentName]);

  useEffect(() => {
    if (
      activeTab === "installments" ||
      role === "student" ||
      role === "parent" ||
      role === "parents"
    ) {
      fetchInstallments(debouncedInstStudentName, instStatus);
    }
  }, [activeTab, role, fetchInstallments, debouncedInstStudentName, instStatus]);

  useEffect(() => {
    if (activeTab === "payments" || role === "student" || role === "parent" || role === "parents") {
      fetchPayments(debouncedPayStudentName, payStatus);
    }
  }, [activeTab, role, fetchPayments, debouncedPayStudentName, payStatus]);

  useEffect(() => {
    if (createRefundOpen) {
      fetchPayments(undefined, "verified");
    }
  }, [createRefundOpen, fetchPayments]);

  useEffect(() => {
    if (
      (activeTab === "structures" || 
       activeTab === "student-fees" || 
       role === "student" || 
       role === "parent" || 
       role === "parents") && 
      !feeStructuresFetched
    ) {
      setFeeStructuresFetched(true);
      dispatch({
        type: feesActions.GET_FEE_STRUCTURES,
        method: "GET",
        endPoint: API.FEES.STRUCTURES,
        auth: true,
        setLoading: setFeeStructuresLoading,
        getResponse: (response: any) => {
          if (response?.data) {
            dispatch(setFeeStructure(response.data));
          } else if (Array.isArray(response)) {
            dispatch(setFeeStructure(response));
          }
        },
        getError: (error: any) => {
          const msg =
            error?.response?.data?.message || error?.message || "Failed to load fee structures";
          toast.error(msg);
        },
      });
    }
  }, [dispatch, activeTab, feeStructuresFetched, role]);

  useEffect(() => {
    if (activeTab === "student-fees" || role === "student" || role === "parent" || role === "parents") {
      fetchStudentFees(debouncedSfStudentName, sfStatus);
    }
  }, [fetchStudentFees, debouncedSfStudentName, sfStatus, activeTab, role]);

  const fetchRefunds = useCallback(
    (studentName?: string, status?: string) => {
      let url: string = API.REFUNDS.LIST;
      const params = new URLSearchParams();
      if (studentName?.trim()) params.append("search", studentName.trim());
      if (status && status !== "all") params.append("status", status);

      const queryString = params.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }

      dispatch({
        type: feesActions.GET_REFUNDS,
        method: "GET",
        endPoint: url,
        auth: true,
        setLoading: setRefundsLoading,
        getResponse: (res: any) => {
          setRefunds(res?.data || res || []);
        },
        getError: (err: any) => {
          console.error("Failed to load refunds", err);
        },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    if (activeTab === "refunds" || role === "student" || role === "parent" || role === "parents") {
      fetchRefunds(debouncedRefStudentName, refStatus);
    }
  }, [activeTab, role, fetchRefunds, debouncedRefStudentName, refStatus]);

  function handleUpdateRefundStatus(id: string, status: "completed" | "rejected", payload?: any) {
    dispatch({
      type: feesActions.UPDATE_REFUND,
      method: "PATCH",
      endPoint: API.REFUNDS.UPDATE(id),
      body: { status, ...payload },
      auth: true,
      getResponse: (res: any) => {
        toast.success(`Refund status updated to ${status}.`);
        fetchRefunds(debouncedRefStudentName, refStatus);
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to update refund status";
        toast.error(msg);
      },
    });
  }

  function handleCreateRefund(payload: any) {
    dispatch({
      type: feesActions.CREATE_REFUND,
      method: "POST",
      endPoint: API.REFUNDS.CREATE,
      body: payload,
      auth: true,
      setLoading: setCreateRefundLoading,
      getResponse: (res: any) => {
        toast.success(res?.message || "Refund request created successfully.");
        setCreateRefundOpen(false);
        fetchRefunds(debouncedRefStudentName, refStatus);
      },
      getError: (err: any) => {
        let msg = err?.response?.data?.message || err?.message || "Failed to create refund request";
        const errObj = err?.response?.data?.errors;
        if (errObj && typeof errObj === "object") {
          const firstKey = Object.keys(errObj)[0];
          if (firstKey) {
            const firstErr = errObj[firstKey as keyof typeof errObj];
            if (Array.isArray(firstErr) && firstErr.length > 0) {
              msg = firstErr[0];
            } else if (typeof firstErr === "string") {
              msg = firstErr;
            }
          }
        }
        toast.error(msg);
      },
    });
  }

  const fetchBankAccounts = useCallback(() => {
    dispatch({
      type: feesActions.GET_BANK_ACCOUNTS,
      method: "GET",
      endPoint: API.BANK_ACCOUNTS.LIST,
      auth: true,
      setLoading: setBankAccountsLoading,
      getResponse: (res: any) => {
        setBankAccounts(res?.data || res || []);
      },
      getError: (err: any) => {
        console.error("Failed to load bank accounts", err);
      },
    });
  }, [dispatch]);

  useEffect(() => {
    if (
      activeTab === "bank-accounts" ||
      activeTab === "payments" ||
      adminRecordPaymentOpen ||
      uploadOpen
    ) {
      fetchBankAccounts();
    }
  }, [activeTab, adminRecordPaymentOpen, uploadOpen, fetchBankAccounts]);

  const fetchReportData = useCallback(() => {
    dispatch({
      type: feesActions.GET_FEE_REPORT,
      method: "GET",
      endPoint: API.FEES.REPORT(reportMonth, reportYear),
      auth: true,
      setLoading: setReportLoading,
      getResponse: (res: any) => {
        setReportData(res?.data || res || null);
      },
      getError: (err: any) => {
        console.error("Failed to load fee report", err);
      },
    });
  }, [dispatch, reportMonth, reportYear]);

  useEffect(() => {
    if (activeTab === "reports" && (isAccountant || isAdmin)) {
      fetchReportData();
    }
  }, [activeTab, fetchReportData, isAccountant, isAdmin]);

  const [assignFeeOpen, setAssignFeeOpen] = useState(false);
  const [assignFeeLoading, setAssignFeeLoading] = useState(false);
  const filteredStudentFees = studentFees;

  function handleAssignStudentFee(payload: any) {
    dispatch({
      type: feesActions.CREATE_STUDENT_FEE,
      method: "POST",
      endPoint: API.FEES.STUDENT_FEES_LIST,
      body: payload,
      auth: true,
      setLoading: setAssignFeeLoading,
      getResponse: (res: any) => {
        const created = res?.data ?? res;
        dispatch(addStudentFee(created));
        toast.success("Student fee assigned successfully.");
        setAssignFeeOpen(false);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to assign student fee";
        toast.error(msg);
      },
    });
  }

  function handleCreateInstallmentPlan(payload: any) {
    dispatch({
      type: feesActions.CREATE_INSTALLMENT_PLAN,
      method: "POST",
      endPoint: API.INSTALLMENTS.CREATE_PLAN,
      body: payload,
      auth: true,
      setLoading: setCreateInstallmentLoading,
      getResponse: (res: any) => {
        toast.success(res?.message || "Installment plan created successfully.");
        setCreateInstallmentOpen(false);
        setViewingInstallment(res?.data || res);
        setInstallmentCreatedMessage(res?.message || null);
        fetchInstallments();
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to create installment plan";
        toast.error(msg);
      },
    });
  }

  function handleApproveRejectInstallment(id: string, status: string, rejection_reason = "") {
    setApproveLoadingId(id);
    dispatch({
      type: feesActions.APPROVE_INSTALLMENT_PLAN,
      method: "POST",
      endPoint: API.INSTALLMENTS.APPROVE(id),
      body: { status, rejection_reason },
      auth: true,
      getResponse: (res: any) => {
        toast.success(
          `Installment plan ${status === "approved" ? "approved" : "rejected"} successfully.`,
        );
        setApproveLoadingId(null);
        fetchInstallments();
      },
      getError: (err: any) => {
        setApproveLoadingId(null);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update installment plan status";
        toast.error(msg);
      },
    });
  }

  const handleRejectSubmit = (reason: string) => {
    if (rejectInstallment) {
      handleApproveRejectInstallment(rejectInstallment.id, "rejected", reason);
      setRejectInstallment(null);
    }
  };

  const [overviewStudentId, setOverviewStudentId] = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewResponse, setOverviewResponse] = useState<any>(null);
  const [overviewDialogOpen, setOverviewDialogOpen] = useState(false);

  function handleViewOverview(studentId: string) {
    setOverviewStudentId(studentId);
    setOverviewLoading(true);
    setOverviewDialogOpen(true);
    dispatch({
      type: feesActions.GET_STUDENT_FEES_BY_STUDENT,
      method: "GET",
      endPoint: API.FEES.STUDENT_FEES_DETAIL(studentId),
      auth: true,
      getResponse: (res: any) => {
        setOverviewLoading(false);
        setOverviewResponse(res?.data || res || null);
      },
      getError: (err: any) => {
        setOverviewLoading(false);
        const msg =
          err?.response?.data?.message || err?.message || "Failed to load student fee overview";
        toast.error(msg);
      },
    });
  }

  function handleCardClick(id: string) {
    setViewLoadingId(id);
    dispatch({
      type: feesActions.GET_FEE_STRUCTURE_DETAIL,
      method: "GET",
      endPoint: API.FEES.STRUCTURE_DETAIL(id),
      auth: true,
      getResponse: (response: any) => {
        setViewLoadingId(null);
        const detail = response?.data ?? response;
        setViewingStructure(detail);
      },
      getError: (error: any) => {
        setViewLoadingId(null);
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load fee structure details";
        toast.error(msg);
      },
    });
  }

  function handleDeleteFeeStructure() {
    if (!deleteOpen) return;
    dispatch({
      type: feesActions.DELETE_FEE_STRUCTURES,
      method: "DELETE",
      endPoint: API.FEES.STRUCTURE_DETAIL(deleteOpen.id),
      auth: true,
      setLoading: setDeleteLoading,
      getResponse: () => {
        dispatch(deleteFeeStructure(deleteOpen.id));
        toast.success("Fee structure deleted successfully.");
        setDeleteOpen(null);
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to delete fee structure";
        toast.error(msg);
      },
    });
  }

  function handleSaveFeeStructure(payload: any) {
    if (editingStructure) {
      dispatch({
        type: feesActions.UPDATE_FEE_STRUCTURES,
        method: "PATCH",
        endPoint: API.FEES.STRUCTURE_DETAIL(editingStructure.id),
        body: payload,
        auth: true,
        setLoading: setFsLoading,
        getResponse: (res: any) => {
          const updated = res?.data ?? res;
          dispatch(updateFeeStructure(updated));
          toast.success("Fee structure updated successfully.");
          setEditingStructure(null);
        },
        getError: (err: any) => {
          const msg =
            err?.response?.data?.message || err?.message || "Failed to update fee structure";
          toast.error(msg);
        },
      });
    } else {
      dispatch({
        type: feesActions.CREATE_FEE_STRUCTURES,
        method: "POST",
        endPoint: API.FEES.STRUCTURES,
        body: payload,
        auth: true,
        setLoading: setFsLoading,
        getResponse: (res: any) => {
          const created = res?.data ?? res;
          dispatch(addFeeStructure(created));
          toast.success("Fee structure created successfully.");
          setCreateOpen(false);
        },
        getError: (err: any) => {
          const msg =
            err?.response?.data?.message || err?.message || "Failed to create fee structure";
          toast.error(msg);
        },
      });
    }
  }

  function handleSaveBankAccount(payload: any) {
    if (editingBankAccount) {
      dispatch({
        type: feesActions.UPDATE_BANK_ACCOUNT,
        method: "PATCH",
        endPoint: API.BANK_ACCOUNTS.DETAIL(editingBankAccount.id),
        body: payload,
        auth: true,
        setLoading: setBankAccountFormLoading,
        getResponse: (res: any) => {
          toast.success("Bank account updated successfully.");
          setBankAccountDialogOpen(false);
          setEditingBankAccount(null);
          fetchBankAccounts();
        },
        getError: (err: any) => {
          const msg =
            err?.response?.data?.message || err?.message || "Failed to update bank account";
          toast.error(msg);
        },
      });
    } else {
      dispatch({
        type: feesActions.CREATE_BANK_ACCOUNT,
        method: "POST",
        endPoint: API.BANK_ACCOUNTS.CREATE,
        body: payload,
        auth: true,
        setLoading: setBankAccountFormLoading,
        getResponse: (res: any) => {
          toast.success("Bank account created successfully.");
          setBankAccountDialogOpen(false);
          fetchBankAccounts();
        },
        getError: (err: any) => {
          const msg =
            err?.response?.data?.message || err?.message || "Failed to create bank account";
          toast.error(msg);
        },
      });
    }
  }

  function handleDeleteBankAccount() {
    if (!deleteBankAccountOpen) return;
    dispatch({
      type: feesActions.DELETE_BANK_ACCOUNT,
      method: "DELETE",
      endPoint: API.BANK_ACCOUNTS.DETAIL(deleteBankAccountOpen.id),
      auth: true,
      setLoading: setDeleteBankAccountLoading,
      getResponse: () => {
        toast.success("Bank account deleted successfully.");
        setDeleteBankAccountOpen(null);
        fetchBankAccounts();
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete bank account";
        toast.error(msg);
      },
    });
  }

  // Fetch student detail for student/parent role
  const [selectedLinkedStudentId, setSelectedLinkedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  useEffect(() => {
    if (user?.linked_students && user.linked_students.length > 0 && !selectedLinkedStudentId) {
      setSelectedLinkedStudentId(user.linked_students[0]);
    }
  }, [user?.linked_students, selectedLinkedStudentId]);

  useEffect(() => {
    const targetStudentId = selectedLinkedStudentId || user?.linked_students?.[0] || user?.id;
    if (isStudentLike && targetStudentId) {
      setStudentDetailLoading(true);
      dispatch({
        type: studentActions.GET_STUDENT_DETAIL,
        method: "GET",
        endPoint: API.STUDENTS.GET(targetStudentId),
        auth: true,
        setLoading: (val: boolean) => setStudentDetailLoading(val),
        getResponse: (res: any) => {
          const data = res?.data ?? res;
          setStudentDetail(data);
          setStudentDetailLoading(false);
        },
        getError: () => {
          setStudentDetailLoading(false);
        },
      });
    }
  }, [isStudentLike, user?.linked_students, dispatch]);

  // Filter fee structures for the student's course/batch
  const studentFeeStructures = useMemo(() => {
    if (!isStudentLike || !studentDetail || !feeStructure) return [];
    return feeStructure.filter((fs) => {
      const matchesCourseId =
        studentDetail.course && String(fs.course) === String(studentDetail.course);
      const matchesCourseName =
        studentDetail.course_name && fs.course_name === studentDetail.course_name;
      const matchesCourseString =
        studentDetail.course &&
        fs.course_name &&
        fs.course_name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          String(studentDetail.course)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
      const matchesCourse = matchesCourseId || matchesCourseName || matchesCourseString;

      const matchesBatchId =
        studentDetail.batch && String(fs.batch) === String(studentDetail.batch);
      const matchesBatchName =
        studentDetail.batch_name && fs.batch_name === studentDetail.batch_name;
      const matchesCurrentBatchName =
        studentDetail.current_batch_name && fs.batch_name === studentDetail.current_batch_name;
      const matchesBatch = matchesBatchId || matchesBatchName || matchesCurrentBatchName;

      // Match by course, or by batch, or by both
      return matchesCourse || matchesBatch;
    });
  }, [isStudentLike, studentDetail, feeStructure]);

  const studentId = isStudentLike
    ? studentDetail?.id || selectedLinkedStudentId || user?.linked_students?.[0] || user?.id || ""
    : "";

  const myStudentFees = useMemo(() => {
    if (!studentId) return [];
    return studentFees.filter((sf) => String(sf.student) === String(studentId));
  }, [studentFees, studentId]);

  const myPayments = useMemo(() => {
    if (!studentId) return [];
    return payments.filter((p) => String(p.student) === String(studentId));
  }, [payments, studentId]);

  function handleRecordPayment(payload: any) {
    dispatch({
      type: feesActions.RECORD_PAYMENT,
      method: "POST",
      endPoint: API.PAYMENTS.RECORD,
      body: payload,
      auth: true,
      setLoading: setRecordPaymentLoading,
      getResponse: (res: any) => {
        toast.success(res?.message || "Payment recorded successfully.");
        setUploadOpen(false);
        setAdminRecordPaymentOpen(false);
        fetchPayments();
        dispatch({
          type: feesActions.GET_STUDENT_FEES,
          method: "GET",
          endPoint: API.FEES.STUDENT_FEES_LIST,
          auth: true,
          getResponse: (res: any) => {
            const data = res?.data ?? res;
            if (Array.isArray(data)) {
              dispatch(setStudentFees(data));
            }
          },
        });
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to record payment";
        toast.error(msg);
      },
    });
  }

  function handleVerifyPayment(payload: { status: string; note: string }) {
    if (!verifyingPayment) return;
    dispatch({
      type: feesActions.VERIFY_PAYMENT,
      method: "POST",
      endPoint: API.PAYMENTS.VERIFY(verifyingPayment.id),
      body: payload,
      auth: true,
      setLoading: setVerifyPaymentLoading,
      getResponse: (res: any) => {
        toast.success(res?.message || `Payment status updated successfully.`);
        setVerifyingPayment(null);
        fetchPayments();
        if (activeTab === "reports") {
          fetchReportData();
        }
        dispatch({
          type: feesActions.GET_STUDENT_FEES,
          method: "GET",
          endPoint: API.FEES.STUDENT_FEES_LIST,
          auth: true,
          getResponse: (res: any) => {
            const data = res?.data ?? res;
            if (Array.isArray(data)) {
              dispatch(setStudentFees(data));
            }
          },
        });
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to verify payment";
        toast.error(msg);
      },
    });
  }

  // Student/Parent view ----------------------
  if (isStudentLike)
    return (
      <StudentFeesView
        studentFees={myStudentFees}
        installments={installments}
        uploadOpen={uploadOpen}
        setUploadOpen={setUploadOpen}
        studentDetail={studentDetail}
        studentDetailLoading={studentDetailLoading}
        feeStructures={studentFeeStructures}
        onSubmitPayment={handleRecordPayment}
        paymentHistory={myPayments}
        paymentHistoryLoading={paymentsLoading}
        bankAccounts={bankAccounts}
        selectedLinkedStudentId={selectedLinkedStudentId}
        setSelectedLinkedStudentId={setSelectedLinkedStudentId}
        linkedStudents={user?.linked_students || []}
        students={students}
      />
    );

  const pending = txns.filter(
    (t) => t.paymentMode === "online" && (t.status === "pending" || t.status === "verified"),
  );
  const cashApprovals = txns.filter((t) => t.paymentMode === "cash" && t.status === "verified");
  const overdueStudents = DUMMY_STUDENTS.filter((s) => s.feePaid < s.feeTotal * 0.5);

  const totalThisMonth = txns
    .filter(
      (t) =>
        t.status === "approved" && new Date(t.submittedAt) > new Date(Date.now() - 30 * 86400000),
    )
    .reduce((a, t) => a + t.amount, 0);

  function approvePayment(t: FeeTransaction) {
    setTxns((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? {
              ...x,
              status: "approved",
              approvedBy: user?.name,
              approvedAt: new Date().toISOString(),
            }
          : x,
      ),
    );
    toast.success(
      `Payment of ${formatCurrency(t.amount)} approved for ${t.studentName}. Receipt generated.`,
    );
    setApprove(null);
  }
  function rejectPayment(t: FeeTransaction, reason: string) {
    setTxns((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: "rejected", remarks: reason } : x)),
    );
    toast.info("Payment rejected. Student notified.");
    setReject(null);
  }
  function approveRefund(t: FeeTransaction, txnRef: string) {
    setTxns((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: "refunded", transactionRef: txnRef } : x)),
    );
    toast.success(`Refund processed for ${t.studentName}.`);
    setRefundOpen(null);
  }

  const billed = Number(reportData?.total_billed ?? 0);
  const collected = Number(reportData?.total_collected ?? 0);
  const pendingVal = Number(reportData?.total_pending ?? 0);
  const discountVal = Number(reportData?.total_discount ?? 0);
  const overdueVal = Number(reportData?.total_overdue ?? 0);
  const partialVal = Number(reportData?.total_partial ?? 0);
  const approvalPendingVal = Number(
    reportData?.total_approval_pending ?? 0,
  );

  const trendChartData = useMemo(() => {
    const rawTrend = reportData?.monthly_trend ?? [];
    return rawTrend.map((t: any) => ({
      name: t.month || "—",
      amount: Number(t.collected || 0),
    }));
  }, [reportData]);

  const modeChartData = useMemo(() => {
    const rawModes = reportData?.collection_by_mode ?? {};
    return Object.entries(rawModes)
      .map(([mode, val]) => ({
        name: mode,
        value: Number(val || 0),
      }))
      .filter((item) => item.value > 0);
  }, [reportData]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div>
      <PageHeader
        title="Fees Management"
        subtitle="Track collections, verifications and refunds."
        actions={
          activeTab === "structures" && (isAccountant || isAdmin) ? (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Fee Structure
            </Button>
          ) : activeTab === "student-fees" && (isAccountant || isAdmin) ? (
            <Button
              onClick={() => setAssignFeeOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Plus className="w-4 h-4" /> Assign Student Fee
            </Button>
          ) : activeTab === "installments" && (isAccountant || isAdmin) ? (
            <Button
              onClick={() => setCreateInstallmentOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Installment Plan
            </Button>
          ) : activeTab === "payments" && (isAccountant || isAdmin) ? (
            <Button
              onClick={() => setAdminRecordPaymentOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Payment
            </Button>
          ) : activeTab === "bank-accounts" && (isAccountant || isAdmin) ? (
            <Button
              onClick={() => {
                setEditingBankAccount(null);
                setBankAccountDialogOpen(true);
              }}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Bank Account
            </Button>
          ) : activeTab === "refunds" && (isAccountant || isAdmin) ? (
            <Button
              onClick={() => setCreateRefundOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Refund
            </Button>
          ) : isAdminSr ? (
            <Button
              onClick={() => setCashOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Wallet className="w-4 h-4" /> Add Cash Entry
            </Button>
          ) : undefined
        }
      />
      <Tabs defaultValue="reports" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {(isAccountant || isAdmin) && (
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          )}
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="student-fees">
            Student Fees
          </TabsTrigger>
          <TabsTrigger value="installments">Installment Plans</TabsTrigger>
          <TabsTrigger value="payments">Payments </TabsTrigger>
          {(isAccountant || isAdmin) && (
            <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
          )}
          {(isAccountant || isAdmin) && (
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
          )}
        </TabsList>
        {(isAccountant || isAdmin) && (
          <TabsContent value="reports">
            <ReportsTab
              reportLoading={reportLoading}
              reportMonth={reportMonth}
              setReportMonth={setReportMonth}
              reportYear={reportYear}
              setReportYear={setReportYear}
              fetchReportData={fetchReportData}
              billed={billed}
              collected={collected}
              pendingVal={pendingVal}
              discountVal={discountVal}
              overdueVal={overdueVal}
              partialVal={partialVal}
              approvalPendingVal={approvalPendingVal}
              trendChartData={trendChartData}
              modeChartData={modeChartData}
              COLORS={COLORS}
            />
          </TabsContent>
        )}

        <TabsContent value="structures">
          <StructuresTab
            feeStructure={feeStructure}
            loading={feeStructuresLoading}
            viewLoadingId={viewLoadingId}
            handleCardClick={handleCardClick}
            isAccountant={isAccountant}
            isAdmin={isAdmin}
            setEditingStructure={setEditingStructure}
            setDeleteOpen={setDeleteOpen}
          />
        </TabsContent>

        <TabsContent value="student-fees">
          <StudentFeesTab
            sfStudentName={sfStudentName}
            setSfStudentName={setSfStudentName}
            sfStatus={sfStatus}
            setSfStatus={setSfStatus}
            filteredStudentFees={filteredStudentFees}
            students={students}
            feeStructure={feeStructure}
            handleViewOverview={handleViewOverview}
            loading={studentFeesLoading}
          />
        </TabsContent>

        <TabsContent value="installments">
          <InstallmentsTab
            instStudentName={instStudentName}
            setInstStudentName={setInstStudentName}
            instStatus={instStatus}
            setInstStatus={setInstStatus}
            installments={installments}
            installmentsLoading={installmentsLoading}
            approveLoadingId={approveLoadingId}
            handleApproveRejectInstallment={handleApproveRejectInstallment}
            setRejectInstallment={setRejectInstallment}
            setViewingInstallment={setViewingInstallment}
            isAccountant={isAccountant}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab
            payments={payments}
            paymentsLoading={paymentsLoading}
            setVerifyingPayment={setVerifyingPayment}
            students={students}
            studentFees={studentFees}
            payStudentName={payStudentName}
            setPayStudentName={setPayStudentName}
            payStatus={payStatus}
            setPayStatus={setPayStatus}
          />
        </TabsContent>

        {(isAccountant || isAdmin) && (
          <TabsContent value="bank-accounts">
            <BankAccountsTab
              data={bankAccounts}
              onEdit={(account) => {
                setEditingBankAccount(account);
                setBankAccountDialogOpen(true);
              }}
              onDelete={(account) => {
                setDeleteBankAccountOpen(account);
              }}
              loading={bankAccountsLoading}
            />
          </TabsContent>
        )}

        {(isAccountant || isAdmin) && (
          <TabsContent value="refunds">
            <RefundsTab
              refunds={refunds}
              refundsLoading={refundsLoading}
              onUpdateStatus={handleUpdateRefundStatus}
              students={students}
              payments={payments}
              refStudentName={refStudentName}
              setRefStudentName={setRefStudentName}
              refStatus={refStatus}
              setRefStatus={setRefStatus}
              isAccountant={isAccountant}
              isAdmin={isAdmin}
            />
          </TabsContent>
        )}
      </Tabs>

      <VerifyPaymentDialog
        open={!!verifyingPayment}
        onClose={() => setVerifyingPayment(null)}
        payment={verifyingPayment}
        onSubmit={handleVerifyPayment}
        loading={verifyPaymentLoading}
      />

      {/* Screenshot modal */}
      <Dialog open={!!screenshot} onOpenChange={(o) => !o && setScreenshot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Payment Screenshot</DialogTitle>
          </DialogHeader>
          {screenshot && <img src={screenshot} alt="screenshot" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!approve}
        onOpenChange={(o) => !o && setApprove(null)}
        title="Approve payment?"
        description={approve ? `${formatCurrency(approve.amount)} for ${approve.studentName}` : ""}
        confirmLabel="Approve"
        onConfirm={() => approve && approvePayment(approve)}
      />

      <RejectDialog
        txn={reject}
        onClose={() => setReject(null)}
        onSubmit={(reason) => reject && rejectPayment(reject, reason)}
      />

      <RefundDialog
        txn={refundOpen}
        onClose={() => setRefundOpen(null)}
        onApprove={(ref) => refundOpen && approveRefund(refundOpen, ref)}
      />

      <CashEntryDialog
        open={cashOpen}
        onClose={() => setCashOpen(false)}
        onSubmit={(data) => {
          setTxns((prev) => [
            {
              id: `RCP-2024-${String(prev.length + 1).padStart(3, "0")}`,
              studentId: data.studentId,
              studentName: DUMMY_STUDENTS.find((s) => s.id === data.studentId)?.name ?? "—",
              amount: data.amount,
              paymentMode: "cash",
              status: "verified",
              submittedBy: user?.name ?? "—",
              submittedAt: new Date().toISOString(),
              remarks: data.remarks,
            },
            ...prev,
          ]);
          toast.success("Cash entry submitted for Branch Manager approval.");
          setCashOpen(false);
        }}
      />

      <FeeStructureDialog
        open={createOpen || !!editingStructure}
        onClose={() => {
          setCreateOpen(false);
          setEditingStructure(null);
        }}
        onSubmit={handleSaveFeeStructure}
        structure={editingStructure}
        courses={courses}
        loading={fsLoading}
      />

      <ConfirmDialog
        open={!!deleteOpen}
        onOpenChange={(o) => !o && setDeleteOpen(null)}
        title="Delete Fee Structure?"
        description={
          deleteOpen
            ? `Are you sure you want to delete the fee structure "${deleteOpen.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteFeeStructure}
      />

      <ViewFeeStructureDialog
        open={!!viewingStructure}
        onClose={() => setViewingStructure(null)}
        structure={viewingStructure}
      />

      <AssignStudentFeeDialog
        open={assignFeeOpen}
        onClose={() => setAssignFeeOpen(false)}
        onSubmit={handleAssignStudentFee}
        students={students}
        feeStructures={feeStructure}
        loading={assignFeeLoading}
      />

      <ViewStudentFeeOverviewDialog
        open={overviewDialogOpen}
        onClose={() => setOverviewDialogOpen(false)}
        studentId={overviewStudentId}
        students={students}
        feeStructures={feeStructure}
        overviewData={overviewResponse}
        loading={overviewLoading}
      />

      <ViewInstallmentPlanDialog
        open={!!viewingInstallment}
        onClose={() => {
          setViewingInstallment(null);
          setInstallmentCreatedMessage(null);
        }}
        installment={viewingInstallment}
        message={installmentCreatedMessage}
      />

      <RejectInstallmentDialog
        installment={rejectInstallment}
        onClose={() => setRejectInstallment(null)}
        onSubmit={handleRejectSubmit}
      />

      <RecordPaymentDialog
        open={adminRecordPaymentOpen}
        onClose={() => setAdminRecordPaymentOpen(false)}
        onSubmit={(payload) => {
          handleRecordPayment(payload);
        }}
        studentFees={studentFees}
        installments={installments}
        students={students}
        bankAccounts={bankAccounts}
        loading={recordPaymentLoading}
      />

      <BankAccountDialog
        open={bankAccountDialogOpen}
        onClose={() => {
          setBankAccountDialogOpen(false);
          setEditingBankAccount(null);
        }}
        onSubmit={handleSaveBankAccount}
        account={editingBankAccount}
        loading={bankAccountFormLoading}
      />

      <ConfirmDialog
        open={!!deleteBankAccountOpen}
        onOpenChange={(o) => !o && setDeleteBankAccountOpen(null)}
        title="Delete Bank Account?"
        description={
          deleteBankAccountOpen
            ? `Are you sure you want to delete the bank account "${deleteBankAccountOpen.bank_name} - ${deleteBankAccountOpen.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel={deleteBankAccountLoading ? "Deleting..." : "Delete"}
        onConfirm={handleDeleteBankAccount}
      />

      <CreateRefundDialog
        open={createRefundOpen}
        onClose={() => setCreateRefundOpen(false)}
        onSubmit={handleCreateRefund}
        payments={payments}
        students={students}
        loading={createRefundLoading}
      />

      <CreateInstallmentDialog
        open={createInstallmentOpen}
        onClose={() => setCreateInstallmentOpen(false)}
        onSubmit={handleCreateInstallmentPlan}
        students={students}
        studentFees={studentFees}
        feeStructure={feeStructure}
        loading={createInstallmentLoading}
      />
    </div>
  );
}

/* --- Sub views --- */
function StudentFeesView({
  studentFees,
  installments,
  uploadOpen,
  setUploadOpen,
  studentDetail,
  studentDetailLoading,
  feeStructures,
  onSubmitPayment,
  paymentHistory,
  paymentHistoryLoading,
  bankAccounts = [],
  selectedLinkedStudentId,
  setSelectedLinkedStudentId,
  linkedStudents,
  students,
}: {
  studentFees: StudentFee[];
  installments: any[];
  uploadOpen: boolean;
  setUploadOpen: (b: boolean) => void;
  studentDetail: any;
  studentDetailLoading: boolean;
  feeStructures: FeesStructure[];
  onSubmitPayment: (payload: any) => void;
  paymentHistory: any[];
  paymentHistoryLoading: boolean;
  bankAccounts?: any[];
  selectedLinkedStudentId: string | null;
  setSelectedLinkedStudentId: (id: string) => void;
  linkedStudents: string[];
  students: any[];
}) {
  const toast = useToast();
  const { user } = useAuth();

  // Derive student info from real API data, fallback to dummy if not loaded yet
  const studentName = studentDetail?.full_name || user?.name || "Loading...";
  const studentId = studentDetail?.id || selectedLinkedStudentId || user?.linked_students?.[0] || user?.id || "";
  const courseName = studentDetail?.course_name || studentDetail?.course || "";
  const batchName = studentDetail?.current_batch_name || studentDetail?.batch_name || "";

  // Calculate fee totals from assigned studentFees
  const totalFee = studentFees.reduce((sum, sf) => sum + Number(sf.total_amount || 0), 0);
  const paidAmount = studentFees.reduce((sum, sf) => sum + Number(sf.amount_paid || 0), 0);
  const outstanding = studentFees.reduce((sum, sf) => sum + Number(sf.amount_due || 0), 0);

  if (studentDetailLoading) {
    return <StudentDetailSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title="My Fees"
        subtitle={`Account: ${studentName}`}
        actions={
          <div className="flex gap-2 items-center">
            {linkedStudents.length > 1 && (
              <Select value={selectedLinkedStudentId || ""} onValueChange={setSelectedLinkedStudentId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {linkedStudents.map((id) => {
                    const stu = students.find((s) => s.id === id);
                    return (
                      <SelectItem key={id} value={id}>
                        {stu ? stu.full_name || stu.first_name : `Student (${id.slice(0, 4)})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => setUploadOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground gap-1.5"
            >
              <Wallet className="w-4 h-4" /> Record Payment
            </Button>
          </div>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-sidebar text-white p-5 mb-4"
      >
        <p className="text-xs uppercase tracking-wider opacity-80">My Fee Summary</p>
        {courseName && (
          <p className="text-xs opacity-70 mt-1">
            {courseName}
            {batchName ? ` — ${batchName}` : ""}
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-xs opacity-80">Total Billed</p>
            <p className="text-xl font-heading font-bold">{formatCurrency(totalFee)}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Total Paid</p>
            <p className="text-xl font-heading font-bold text-primary">
              {formatCurrency(paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">Outstanding</p>
            <p className="text-xl font-heading font-bold text-rose-400">
              {formatCurrency(outstanding > 0 ? outstanding : 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* My Fee Allocations */}
      {studentFees.length > 0 && (
        <div className="mb-4">
          <h3 className="font-heading font-semibold mb-2">My Fee Allocations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studentFees.map((sf) => (
              <motion.div
                key={sf.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card border border-border p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-heading font-semibold text-sm">
                    {sf.fee_name || sf.id}
                  </h4>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize",
                      sf.status === "paid"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : sf.status === "partially_paid"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20",
                    )}
                  >
                    {sf.status?.replace("_", " ") || "unpaid"}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fee</span>
                    <span className="font-medium">{formatCurrency(Number(sf.total_amount))}</span>
                  </div>
                  {Number(sf.discount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({sf.discount_reason || "Scholarship"})</span>
                      <span>-{formatCurrency(Number(sf.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(Number(sf.amount_paid))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-muted-foreground font-medium">Due Amount</span>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(Number(sf.amount_due))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>Due Date</span>
                    <span>{formatDate(sf.due_date)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-heading font-semibold mb-2 mt-6">Payment History</h3>
      {paymentHistoryLoading ? (
        <FeeTableSkeleton columns={6} rows={3} hasFilter={false} />
      ) : paymentHistory.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground bg-muted/10 border border-dashed rounded-xl">
          No payments recorded yet.
        </div>
      ) : (
        <PaymentsHistoryTable data={paymentHistory} studentFees={studentFees} />
      )}

      <RecordPaymentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={onSubmitPayment}
        studentFees={studentFees}
        installments={installments}
        studentId={studentId}
        bankAccounts={bankAccounts}
        loading={false}
      />
    </div>
  );
}

function PaymentsTable({
  data,
  onVerify,
  loading,
  students,
  studentFees,
}: {
  data: any[];
  onVerify: (payment: any) => void;
  loading: boolean;
  students: any[];
  studentFees: any[];
}) {
  const cols: DataTableColumn<any>[] = [
    {
      key: "receipt_number",
      header: "Receipt #",
      className: "font-mono text-xs font-semibold",
      render: (r) => r.receipt_number || "—",
    },
    {
      key: "student",
      header: "Student",
      render: (r) => {
        if (r.student_name) return r.student_name;
        const student = students.find((s) => s.id === r.student);
        return student ? student.full_name : r.student;
      },
    },
    {
      key: "student_fee",
      header: "Fee Allocation",
      render: (r) => {
        const fee = studentFees.find((f) => f.id === r.student_fee);
        return fee ? fee.fee_structure_name || fee.name || "-" : "-";
      },
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => formatCurrency(Number(r.amount)),
    },
    {
      key: "payment_mode",
      header: "Mode",
      render: (r) => (
        <span className="uppercase text-xs font-semibold">{r.payment_mode?.replace("_", " ")}</span>
      ),
    },
    {
      key: "transaction_ref",
      header: "Txn Ref",
      render: (r) => <span className="font-mono text-xs">{r.transaction_ref || "—"}</span>,
    },
    {
      key: "payment_date",
      header: "Payment Date",
      render: (r) => formatDate(r.payment_date),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const statusColors: Record<string, string> = {
          pending_verification: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          verified: "bg-green-500/10 text-green-500 border-green-500/20",
          rejected: "bg-red-500/10 text-red-500 border-red-500/20",
        };
        const label = r.status === "pending_verification" ? "Pending Verification" : r.status;
        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap",
              statusColors[r.status] || "bg-muted text-muted-foreground border-muted-foreground/20",
            )}
          >
            {label?.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const canVerify = r.status === "pending_verification";
        // if (!canVerify) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onVerify(r)}
                  className="text-primary hover:bg-primary/10 cursor-pointer font-medium"
                >
                  Verify Payment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={cols} data={data} />;
}

function PaymentsHistoryTable({ data, studentFees }: { data: any[]; studentFees: StudentFee[] }) {
  const cols: DataTableColumn<any>[] = [
    { key: "receipt_number", header: "Receipt #", className: "font-mono text-xs" },
    {
      key: "student_fee",
      header: "Fee Allocation",
      render: (r) => {
        const sf = studentFees.find((f) => f.id === r.student_fee);
        return sf?.fee_name || r.student_fee;
      },
    },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(Number(r.amount)) },
    {
      key: "payment_mode",
      header: "Mode",
      render: (r) => (
        <span className="uppercase text-xs font-semibold">{r.payment_mode?.replace("_", " ")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const statusColors: Record<string, string> = {
          pending_verification: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          verified: "bg-green-500/10 text-green-500 border-green-500/20",
          rejected: "bg-red-500/10 text-red-500 border-red-500/20",
        };
        const label = r.status === "pending_verification" ? "Pending Verification" : r.status;
        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap",
              statusColors[r.status] || "bg-muted text-muted-foreground border-muted-foreground/20",
            )}
          >
            {label?.replace("_", " ")}
          </span>
        );
      },
    },
    { key: "payment_date", header: "Date", render: (r) => formatDate(r.payment_date) },
  ];
  return <DataTable columns={cols} data={data} />;
}
