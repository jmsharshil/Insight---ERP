import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/common/StatCard";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
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
import { feesActions, courseAction, batchAction, studentActions } from "@/redux/actions";
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

  const feeStructure = useSelector((state: RootState) => state.fees.feeStructure);
  const studentFees = useSelector((state: RootState) => state.fees.studentFees);
  const { students } = useSelector((state: RootState) => state.students);
  const courses = useSelector((state: RootState) => state.courses.courses);
  const [batches, setBatches] = useState<any[]>([]);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchSummary = useCallback(() => {
    dispatch({
      type: feesActions.GET_STUDENT_FEES_SUMMARY,
      method: "GET",
      endPoint: API.FEES.STUDENT_FEES_SUMMARY,
      auth: true,
      setLoading: setSummaryLoading,
      getResponse: (res: any) => {
        setSummaryData(res?.data || res || null);
      },
      getError: (err: any) => {
        console.error("Failed to fetch student fees summary", err);
      },
    });
  }, [dispatch]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setPageTitle("Fees");
  }, [setPageTitle]);

  useEffect(() => {
    dispatch({
      type: feesActions.GET_FEE_STRUCTURES,
      method: "GET",
      endPoint: API.FEES.STRUCTURES,
      auth: true,
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
  }, [dispatch]);

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

  useEffect(() => {
    dispatch({
      type: batchAction.GET_BATCHES,
      method: "GET",
      endPoint: API.BATCHES.LIST,
      auth: true,
      getResponse: (res: any) => {
        if (res?.data) {
          setBatches(res.data);
        } else if (Array.isArray(res)) {
          setBatches(res);
        }
      },
    });
  }, [dispatch]);

  useEffect(() => {
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
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to load student fees";
        toast.error(msg);
      },
    });
  }, [dispatch]);

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

  const [createOpen, setCreateOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeesStructure | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<FeesStructure | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fsLoading, setFsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("structures");
  const [viewingStructure, setViewingStructure] = useState<FeesStructure | null>(null);
  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);

  const [installments, setInstallments] = useState<any[]>([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [createInstallmentOpen, setCreateInstallmentOpen] = useState(false);
  const [createInstallmentLoading, setCreateInstallmentLoading] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);

  const [instStudentId, setInstStudentId] = useState("");
  const [instStudentFeeId, setInstStudentFeeId] = useState("");
  const [instTotalAmount, setInstTotalAmount] = useState<number>(0);
  const [instItems, setInstItems] = useState<{ amount: string; due_date: string }[]>([]);

  const fetchInstallments = useCallback(() => {
    dispatch({
      type: feesActions.GET_INSTALLMENTS,
      method: "GET",
      endPoint: API.INSTALLMENTS.LIST,
      auth: true,
      setLoading: setInstallmentsLoading,
      getResponse: (res: any) => {
        setInstallments(res?.data || res || []);
      },
      getError: (err: any) => {
        console.error("Failed to load installments", err);
      },
    });
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "installments") {
      fetchInstallments();
    }
  }, [activeTab, fetchInstallments]);

  const [assignFeeOpen, setAssignFeeOpen] = useState(false);
  const [assignFeeLoading, setAssignFeeLoading] = useState(false);
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [filteredStudentFees, setFilteredStudentFees] = useState<StudentFee[]>([]);

  useEffect(() => {
    if (studentFilter === "all") {
      setFilteredStudentFees(studentFees);
    } else {
      dispatch({
        type: feesActions.GET_STUDENT_FEES_BY_STUDENT,
        method: "GET",
        endPoint: API.FEES.STUDENT_FEES_DETAIL(studentFilter),
        auth: true,
        getResponse: (res: any) => {
          setOverviewLoading(false);
          const data = res?.data ?? res;
          setOverviewData(data?.fees || []);
        },
        getError: (err: any) => {
          const msg =
            err?.response?.data?.message || err?.message || "Failed to load student fee overview";
          toast.error(msg);
        },
      });
    }
  }, [studentFilter, studentFees, dispatch]);

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
        fetchSummary();
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
        toast.success("Installment plan created successfully.");
        setCreateInstallmentOpen(false);
        fetchInstallments();
        fetchSummary();
      },
      getError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to create installment plan";
        toast.error(msg);
      },
    });
  }

  function handleApproveRejectInstallment(id: string, approved: boolean) {
    setApproveLoadingId(id);
    dispatch({
      type: feesActions.APPROVE_INSTALLMENT_PLAN,
      method: "POST",
      endPoint: API.INSTALLMENTS.APPROVE(id),
      body: { approved },
      auth: true,
      getResponse: (res: any) => {
        toast.success(`Installment plan ${approved ? "approved" : "rejected"} successfully.`);
        setApproveLoadingId(null);
        fetchInstallments();
        fetchSummary();
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

  const role = user?.role;
  const isStudentLike = role === "student" || role === "parent";
  const isAccountant = role === "accountant";
  const isBM = role === "branch_manager";
  const isAdmin = role === "super_admin" || isBM;
  const isAdminSr = role === "admin_senior_exec";

  // Student/Parent view ----------------------
  if (isStudentLike)
    return (
      <StudentFeesView
        txns={txns}
        setTxns={setTxns}
        uploadOpen={uploadOpen}
        setUploadOpen={setUploadOpen}
      />
    );

  const pending = txns.filter(
    (t) => t.paymentMode === "online" && (t.status === "pending" || t.status === "verified"),
  );
  const cashApprovals = txns.filter((t) => t.paymentMode === "cash" && t.status === "verified");
  const overdueStudents = DUMMY_STUDENTS.filter((s) => s.feePaid < s.feeTotal * 0.5);
  const refunds = txns.filter((t) => t.status === "refund_pending");

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

  const summaryArray = Array.isArray(summaryData)
    ? summaryData
    : summaryData && typeof summaryData === "object"
      ? [summaryData]
      : [];

  const totalBilled = summaryArray.reduce(
    (acc: number, curr: any) => acc + toNumber(curr.total_amount ?? curr.total_billed),
    0,
  );
  const totalDiscount = summaryArray.reduce(
    (acc: number, curr: any) => acc + toNumber(curr.total_discount),
    0,
  );
  const totalPaid = summaryArray.reduce((acc: number, curr: any) => acc + toNumber(curr.total_paid), 0);
  const totalOutstanding = summaryArray.reduce(
    (acc: number, curr: any) => acc + toNumber(curr.amount_due ?? curr.total_due),
    0,
  );

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Total Amount"
          value={formatCurrency(totalBilled)}
          icon={Wallet}
          trendType="up"
          index={0}
        />
        <StatCard
          title="Total Discount"
          value={formatCurrency(totalDiscount)}
          icon={Clock}
          trendType="warning"
          index={1}
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          icon={Wallet}
          trendType="up"
          index={2}
        />
        <StatCard
          title="Total Due"
          value={formatCurrency(totalOutstanding)}
          icon={AlertCircle}
          trendType="down"
          index={3}
        />
      </div>

      <div className="mb-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary-light/50 border border-primary/30">
        <Bell className="w-3.5 h-3.5 text-primary-dark" />
        <span>3 auto-reminders scheduled for today</span>
      </div>

      <Tabs defaultValue="structures" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {/* <TabsTrigger value="pending">Pending Verifications ({pending.length})</TabsTrigger> */}
          {/* <TabsTrigger value="all">All Transactions</TabsTrigger>
          {(isBM || isAdmin) && (
            <TabsTrigger value="cash">Cash Approvals ({cashApprovals.length})</TabsTrigger>
          )} */}
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          {/* <TabsTrigger value="overdue">Overdue ({overdueStudents.length})</TabsTrigger>
          <TabsTrigger value="refunds">Refunds ({refunds.length})</TabsTrigger> */}
          <TabsTrigger value="student-fees">
            Student Fees ({filteredStudentFees.length})
          </TabsTrigger>
          <TabsTrigger value="installments">
            Installment Plans ({installments.length})
          </TabsTrigger>
        </TabsList>

        {/* <TabsContent value="pending">
          <TxnTable
            data={pending}
            actions={(t) => (
              <>
                <Button size="sm" variant="ghost" onClick={() => setScreenshot(t.screenshotUrl!)}>
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={() => setApprove(t)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReject(t)}
                  className="text-destructive"
                >
                  Reject
                </Button>
              </>
            )}
          />
        </TabsContent> */}

        <TabsContent value="all">
          <TxnTable data={txns} exportable />
        </TabsContent>

        {(isBM || isAdmin) && (
          <TabsContent value="cash">
            <TxnTable
              data={cashApprovals}
              actions={(t) => (
                <>
                  <Button
                    size="sm"
                    onClick={() => setApprove(t)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReject(t)}
                    className="text-destructive"
                  >
                    Reject
                  </Button>
                </>
              )}
            />
          </TabsContent>
        )}

        <TabsContent value="structures">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {feeStructure?.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
                No fee structures found. Click &quot;Create Fee Structure&quot; to add one.
              </div>
            ) : (
              feeStructure?.map((fs, i) => (
                <motion.div
                  key={fs.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleCardClick(fs.id)}
                  className="relative rounded-xl bg-card border border-border p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  {viewLoadingId === fs.id && (
                    <div className="absolute inset-0 bg-background/50 rounded-xl flex items-center justify-center backdrop-blur-[1px] z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-heading font-semibold line-clamp-1">{fs.name}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap",
                        fs.is_active
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-muted text-muted-foreground border-muted-foreground/20",
                      )}
                    >
                      {fs.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <Row label="Course" value={fs.course_name} />
                    <Row label="Batch" value={fs.batch_name} />
                    <Row label="Total Amount" value={formatCurrency(Number(fs.total_amount))} />
                    {fs.description && (
                      <div className="text-xs text-muted-foreground mt-2 border-t pt-1.5 line-clamp-2">
                        {fs.description}
                      </div>
                    )}
                  </div>
                  {(isAccountant || isAdmin) && (
                    <div className="flex gap-2 mt-4 relative z-20">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStructure(fs);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteOpen(fs);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="overdue">
          <DataTable
            columns={[
              { key: "name", header: "Student" },
              { key: "admissionNumber", header: "Admission No", className: "font-mono text-xs" },
              {
                key: "outstanding",
                header: "Outstanding",
                render: (s: any) => formatCurrency(s.feeTotal - s.feePaid),
              },
              {
                key: "daysOverdue",
                header: "Days Overdue",
                render: () => `${Math.floor(Math.random() * 30 + 5)}d`,
              },
              {
                key: "actions",
                header: "",
                render: (s: any) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`Reminder sent to ${s.name} and parent.`)}
                  >
                    <Send className="w-3.5 h-3.5" /> Reminder
                  </Button>
                ),
              },
            ]}
            data={overdueStudents}
          />
        </TabsContent>

        <TabsContent value="refunds">
          <TxnTable
            data={refunds}
            actions={(t) => (
              <Button
                size="sm"
                onClick={() => setRefundOpen(t)}
                className="bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                Approve Refund
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="student-fees">
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Filter by Student</h3>
                <p className="text-xs text-muted-foreground">
                  Select a student to view their detailed fee overview.
                </p>
              </div>
              <div className="w-full md:w-72">
                <Select value={studentFilter} onValueChange={setStudentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.admission_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DataTable
            columns={[
              {
                key: "student",
                header: "Student",
                render: (item: StudentFee) => {
                  const s = students.find((x) => x.id === item.student);
                  return (
                    <div>
                      <div className="font-semibold">{s?.full_name || "—"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {s?.admission_number || "—"}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "fee_structure",
                header: "Fee Structure",
                render: (item: StudentFee) => {
                  const fs = feeStructure.find((x) => x.id === item.fee_structure);
                  return fs?.name || "—";
                },
              },
              {
                key: "total_amount",
                header: "Total Amount",
                render: (item: StudentFee) => formatCurrency(Number(item.total_amount)),
              },
              {
                key: "discount",
                header: "Discount",
                render: (item: StudentFee) =>
                  Number(item.discount) > 0 ? (
                    <div>
                      <div className="font-medium text-green-600">
                        -{formatCurrency(Number(item.discount))}
                      </div>
                      {item.discount_reason && (
                        <div className="text-[10px] text-muted-foreground italic line-clamp-1">
                          {item.discount_reason}
                        </div>
                      )}
                    </div>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "amount_paid",
                header: "Paid",
                render: (item: StudentFee) => formatCurrency(Number(item.amount_paid)),
              },
              {
                key: "amount_due",
                header: "Due",
                render: (item: StudentFee) => (
                  <span
                    className={
                      Number(item.amount_due) > 0 ? "font-semibold text-destructive" : "font-medium"
                    }
                  >
                    {formatCurrency(Number(item.amount_due))}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (item: StudentFee) => {
                  const statusColors = {
                    paid: "bg-green-500/10 text-green-500 border-green-500/20",
                    partially_paid: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                    unpaid: "bg-red-500/10 text-red-500 border-red-500/20",
                  };
                  return (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize",
                        statusColors[item.status] ||
                          "bg-muted text-muted-foreground border-muted-foreground/20",
                      )}
                    >
                      {item.status?.replace("_", " ") || "unpaid"}
                    </span>
                  );
                },
              },
              {
                key: "due_date",
                header: "Due Date",
                render: (item: StudentFee) => formatDate(item.due_date),
              },
              {
                key: "actions",
                header: "",
                render: (item: StudentFee) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewOverview(item.student);
                    }}
                    className="text-primary hover:text-primary-dark hover:bg-primary-light"
                  >
                    View Overview
                  </Button>
                ),
              },
            ]}
            data={filteredStudentFees}
            onRowClick={(row) => handleViewOverview(row.student)}
          />
        </TabsContent>

        <TabsContent value="installments">
          <DataTable
            loading={installmentsLoading}
            columns={[
              {
                key: "student_name",
                header: "Student",
                render: (item: any) => {
                  return (
                    <div>
                      <div className="font-semibold">{item.student_name || item.student?.full_name || "—"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {item.admission_number || item.student?.admission_number || "—"}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "fee_structure_name",
                header: "Fee Structure",
                render: (item: any) =>
                  item.fee_structure_name || item.student_fee?.fee_structure_name || "—",
              },
              {
                key: "total_amount",
                header: "Total Amount",
                render: (item: any) => {
                  const val =
                    item.total_amount ??
                    item.student_fee?.total_amount ??
                    item.items?.reduce((acc: number, curr: any) => acc + toNumber(curr.amount), 0) ??
                    0;
                  return formatCurrency(Number(val));
                },
              },
              {
                key: "installments_count",
                header: "Installments",
                render: (item: any) => {
                  const itemsCount = item.items?.length || 0;
                  return `${itemsCount} installment${itemsCount !== 1 ? "s" : ""}`;
                },
              },
              {
                key: "status",
                header: "Status",
                render: (item: any) => {
                  const statusColors: any = {
                    approved: "bg-green-500/10 text-green-500 border-green-500/20",
                    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
                  };
                  const displayStatus = item.status || "pending";
                  return (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize",
                        statusColors[displayStatus] ||
                          "bg-muted text-muted-foreground border-muted-foreground/20",
                      )}
                    >
                      {displayStatus}
                    </span>
                  );
                },
              },
              {
                key: "actions",
                header: "",
                render: (item: any) => {
                  const isPending = (item.status || "pending") === "pending";
                  const canApprove = isPending && (isAccountant || isAdmin);
                  if (!canApprove) return null;
                  const isLoading = approveLoadingId === item.id;
                  return (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveRejectInstallment(item.id, true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveRejectInstallment(item.id, false);
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        Reject
                      </Button>
                    </div>
                  );
                },
              },
            ]}
            data={installments}
          />
        </TabsContent>
      </Tabs>

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
        batches={batches}
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

      <Dialog open={createInstallmentOpen} onOpenChange={setCreateInstallmentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Installment Plan</DialogTitle>
            <DialogDescription>
              Set up a multi-part payment schedule for a student's assigned fee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-semibold">Select Student</Label>
              <Select
                value={instStudentId}
                onValueChange={(val) => {
                  setInstStudentId(val);
                  setInstStudentFeeId("");
                  setInstItems([]);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent className="max-h-56 overflow-y-auto">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} ({s.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {instStudentId && (
              <div>
                <Label className="text-xs font-semibold">Select Student Fee Record</Label>
                <Select
                  value={instStudentFeeId}
                  onValueChange={(val) => {
                    setInstStudentFeeId(val);
                    const selectedSf = studentFees.find((sf) => sf.id === val);
                    const totalDue = selectedSf ? Number(selectedSf.amount_due) : 0;
                    setInstTotalAmount(totalDue);
                    setInstItems([
                      { amount: String(Math.floor(totalDue / 2)), due_date: "" },
                      { amount: String(totalDue - Math.floor(totalDue / 2)), due_date: "" },
                    ]);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select assigned fee" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {studentFees
                      .filter((sf) => sf.student === instStudentId)
                      .map((sf) => {
                        const fs = feeStructure.find((x) => x.id === sf.fee_structure);
                        return (
                          <SelectItem key={sf.id} value={sf.id}>
                            {fs?.name || "Assigned Fee"} — Due: {formatCurrency(Number(sf.amount_due))}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {instStudentFeeId && (
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Installment Breakdown (Total: {formatCurrency(instTotalAmount)})
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setInstItems((prev) => [...prev, { amount: "0", due_date: "" }]);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Installment
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {instItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Label className="text-[10px] text-muted-foreground">Amount (₹)</Label>
                        <Input
                          type="number"
                          placeholder="Amount"
                          className="h-8 text-xs mt-0.5"
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...instItems];
                            newItems[idx].amount = e.target.value;
                            setInstItems(newItems);
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-[10px] text-muted-foreground">Due Date</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs mt-0.5"
                          value={item.due_date}
                          onChange={(e) => {
                            const newItems = [...instItems];
                            newItems[idx].due_date = e.target.value;
                            setInstItems(newItems);
                          }}
                        />
                      </div>
                      {instItems.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive mt-4"
                          onClick={() => {
                            setInstItems(instItems.filter((_, i) => i !== idx));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {(() => {
                  const sum = instItems.reduce((acc, curr) => acc + toNumber(curr.amount), 0);
                  const isCorrect = Math.abs(sum - instTotalAmount) < 0.01;
                  return (
                    <div className="flex justify-between items-center text-xs mt-2 border-t pt-2">
                      <span className="text-muted-foreground">Sum of installments:</span>
                      <span
                        className={cn("font-bold", isCorrect ? "text-green-600" : "text-destructive")}
                      >
                        {formatCurrency(sum)} / {formatCurrency(instTotalAmount)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateInstallmentOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                createInstallmentLoading ||
                !instStudentId ||
                !instStudentFeeId ||
                instItems.length === 0 ||
                instItems.some((x) => !x.due_date || toNumber(x.amount) <= 0) ||
                Math.abs(
                  instItems.reduce((acc, curr) => acc + toNumber(curr.amount), 0) - instTotalAmount,
                ) >= 0.01
              }
              onClick={() => {
                const payload = {
                  student: instStudentId,
                  student_fee_id: instStudentFeeId,
                  total_amount: instTotalAmount,
                  items: instItems.map((it) => ({
                    amount: toNumber(it.amount),
                    due_date: it.due_date,
                  })),
                };
                handleCreateInstallmentPlan(payload);
              }}
            >
              {createInstallmentLoading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --- Sub views --- */
function StudentFeesView({
  txns,
  setTxns,
  uploadOpen,
  setUploadOpen,
}: {
  txns: FeeTransaction[];
  setTxns: React.Dispatch<React.SetStateAction<FeeTransaction[]>>;
  uploadOpen: boolean;
  setUploadOpen: (b: boolean) => void;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const student = DUMMY_STUDENTS[0];
  const my = txns.filter((t) => t.studentId === student.id);
  const outstanding = student.feeTotal - student.feePaid;

  return (
    <div>
      <PageHeader
        title="My Fees"
        subtitle={`Account: ${student.name}`}
        actions={
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            <Upload className="w-4 h-4" /> Upload Payment Screenshot
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-br from-navy to-navy-light text-white p-5 mb-4"
      >
        <p className="text-xs uppercase tracking-wider opacity-80">My Fee Summary</p>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-xs opacity-80">Total</p>
            <p className="text-xl font-heading font-bold">{formatCurrency(student.feeTotal)}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Paid</p>
            <p className="text-xl font-heading font-bold text-primary">
              {formatCurrency(student.feePaid)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">Outstanding</p>
            <p className="text-xl font-heading font-bold">{formatCurrency(outstanding)}</p>
          </div>
        </div>
        <p className="text-xs mt-3 opacity-80">
          Next due: <b>15 Oct 2024</b>
        </p>
      </motion.div>

      <h3 className="font-heading font-semibold mb-2">Payment History</h3>
      <TxnTable data={my} />

      <UploadPaymentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={(data) => {
          setTxns((prev) => [
            {
              id: `RCP-2024-${String(prev.length + 1).padStart(3, "0")}`,
              studentId: student.id,
              studentName: student.name,
              amount: data.amount,
              paymentMode: data.mode,
              status: "pending",
              screenshotUrl: "https://placehold.co/600x400?text=Uploaded",
              submittedBy: user?.name ?? student.name,
              submittedAt: new Date().toISOString(),
              remarks: data.remarks,
            },
            ...prev,
          ]);
          toast.success("Payment submitted for verification. You'll be notified once approved.");
          setUploadOpen(false);
        }}
      />
    </div>
  );
}

function TxnTable({
  data,
  actions,
  exportable,
}: {
  data: FeeTransaction[];
  actions?: (t: FeeTransaction) => React.ReactNode;
  exportable?: boolean;
}) {
  const cols: DataTableColumn<FeeTransaction>[] = [
    { key: "id", header: "Receipt", className: "font-mono text-xs" },
    { key: "studentName", header: "Student" },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    {
      key: "paymentMode",
      header: "Mode",
      render: (r) => <span className="uppercase text-xs">{r.paymentMode}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const m = FEE_STATUS_META[r.status];
        return (
          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", m.bg, m.color)}>
            {m.label}
          </span>
        );
      },
    },
    { key: "submittedAt", header: "Date", render: (r) => formatDate(r.submittedAt) },
    ...(actions
      ? [
          {
            key: "actions",
            header: "",
            render: (r: FeeTransaction) => <div className="flex gap-1">{actions(r)}</div>,
          },
        ]
      : []),
  ];
  return <DataTable columns={cols} data={data} exportable={exportable} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function RejectDialog({
  txn,
  onClose,
  onSubmit,
}: {
  txn: FeeTransaction | null;
  onClose: () => void;
  onSubmit: (r: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    setReason("");
  }, [txn?.id]);
  return (
    <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Reject Payment</DialogTitle>
          <DialogDescription>
            {txn?.studentName} · {txn && formatCurrency(txn.amount)}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Reason for rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => onSubmit(reason)}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({
  txn,
  onClose,
  onApprove,
}: {
  txn: FeeTransaction | null;
  onClose: () => void;
  onApprove: (r: string) => void;
}) {
  const [ref, setRef] = useState("");
  useEffect(() => {
    setRef("");
  }, [txn?.id]);
  return (
    <Dialog open={!!txn} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Approve Refund</DialogTitle>
          <DialogDescription>
            {txn?.studentName} · {txn && formatCurrency(txn.amount)}
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Transaction Ref *</Label>
          <Input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="mt-1"
            placeholder="TXN..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!ref.trim()}
            onClick={() => onApprove(ref)}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Process Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CashEntryDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { studentId: string; amount: number; remarks: string }) => void;
}) {
  const toast = useToast();
  const [studentId, setStudentId] = useState(DUMMY_STUDENTS[0].id);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Add Cash Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DUMMY_STUDENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const n = Number(amount);
              if (!n) {
                toast.error("Please fix the errors before submitting.");
                return;
              }
              onSubmit({ studentId, amount: n, remarks });
            }}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadPaymentDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: { amount: number; mode: PaymentMode; remarks: string }) => void;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("online");
  const [remarks, setRemarks] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Upload Payment Screenshot</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Payment Mode *</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Upload className="w-6 h-6 mx-auto mb-1" />
            Tap to upload screenshot (demo)
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const n = Number(amount);
              if (!n) {
                toast.error("Please fix the errors before submitting.");
                return;
              }
              onSubmit({ amount: n, mode, remarks });
            }}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeeStructureDialog({
  open,
  onClose,
  onSubmit,
  structure,
  courses,
  batches,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  structure: FeesStructure | null;
  courses: any[];
  batches: any[];
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (structure) {
      setName(structure.name || "");
      setCourse(structure.course || "");
      setBatch(structure.batch || "");
      setTotalAmount(String(structure.total_amount) || "");
      setDescription(structure.description || "");
      setIsActive(structure.is_active !== false);
    } else {
      setName("");
      setCourse("");
      setBatch("");
      setTotalAmount("");
      setDescription("");
      setIsActive(true);
    }
  }, [structure, open]);

  const isEdit = !!structure;

  const handleSave = () => {
    if (!name.trim() || !course || !batch || !totalAmount) {
      return;
    }

    const payload: any = {
      name,
      course,
      batch,
      total_amount: parseFloat(totalAmount),
      description,
      is_active: isActive,
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? "Edit Fee Structure" : "Create Fee Structure"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modify the details for this fee structure."
              : "Set up a new fee structure for a course and batch combination."}
          </DialogDescription>
        </DialogHeader>
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
              <Label>Batch *</Label>
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
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

          <div>
            <Label htmlFor="fs-amount">Total Amount *</Label>
            <Input
              id="fs-amount"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="e.g., 50000.00"
              className="mt-1"
            />
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !name.trim() || !course || !batch || !totalAmount}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewFeeStructureDialog({
  open,
  onClose,
  structure,
}: {
  open: boolean;
  onClose: () => void;
  structure: FeesStructure | null;
}) {
  if (!structure) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Fee Structure Details</DialogTitle>
          <DialogDescription>
            Detailed information retrieved from the server for this structure.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-3 border-y border-border my-2 text-sm">
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Status</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold border",
                structure.is_active
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-muted text-muted-foreground border-muted-foreground/20",
              )}
            >
              {structure.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex justify-between items-start pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium shrink-0">Name</span>
            <span className="font-semibold text-right max-w-[280px] break-words">
              {structure.name}
            </span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Course</span>
            <span className="font-semibold">{structure.course_name}</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Batch</span>
            <span className="font-semibold">{structure.batch_name}</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-border/50">
            <span className="text-muted-foreground font-medium">Total Amount</span>
            <span className="font-semibold text-primary">
              {formatCurrency(Number(structure.total_amount))}
            </span>
          </div>
          {structure.description && (
            <div className="pt-1.5">
              <span className="text-muted-foreground font-medium block mb-1">Description</span>
              <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border leading-relaxed">
                {structure.description}
              </p>
            </div>
          )}
          {structure.created_at && (
            <div className="flex justify-between items-center pt-1.5 text-xs text-muted-foreground">
              <span>Created At</span>
              <span>{formatDate(structure.created_at)}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignStudentFeeDialog({
  open,
  onClose,
  onSubmit,
  students,
  feeStructures,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  students: any[];
  feeStructures: FeesStructure[];
  loading: boolean;
}) {
  const [studentId, setStudentId] = useState("");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [discountReason, setDiscountReason] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (feeStructureId) {
      const selectedFs = feeStructures.find((fs) => fs.id === feeStructureId);
      if (selectedFs) {
        setTotalAmount(String(selectedFs.total_amount));
      }
    } else {
      setTotalAmount("");
    }
  }, [feeStructureId, feeStructures]);

  useEffect(() => {
    if (open) {
      setStudentId("");
      setFeeStructureId("");
      setTotalAmount("");
      setDiscount("0");
      setDiscountReason("");
      setDueDate("");
    }
  }, [open]);

  const handleSave = () => {
    if (!studentId || !feeStructureId || !totalAmount || !dueDate) {
      return;
    }
    onSubmit({
      student: studentId,
      fee_structure: feeStructureId,
      total_amount: parseFloat(totalAmount),
      discount: parseFloat(discount) || 0,
      discount_reason: discountReason || undefined,
      due_date: dueDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Assign Student Fee</DialogTitle>
          <DialogDescription>
            Assign a fee structure to a student and optionally configure a discount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="student">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Select student..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name} ({s.admission_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee_structure">Fee Structure</Label>
            <Select value={feeStructureId} onValueChange={setFeeStructureId}>
              <SelectTrigger id="fee_structure">
                <SelectValue placeholder="Select fee structure..." />
              </SelectTrigger>
              <SelectContent>
                {feeStructures.map((fs) => (
                  <SelectItem key={fs.id} value={fs.id}>
                    {fs.name} ({formatCurrency(Number(fs.total_amount))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount Amount</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discount_reason">Discount Reason</Label>
            <Input
              id="discount_reason"
              placeholder="e.g. Early bird discount, Scholarship"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              disabled={parseFloat(discount) <= 0}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !studentId || !feeStructureId || !totalAmount || !dueDate}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Assigning..." : "Assign Fee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewStudentFeeOverviewDialog({
  open,
  onClose,
  studentId,
  students,
  feeStructures,
  overviewData,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  students: any[];
  feeStructures: FeesStructure[];
  overviewData: any;
  loading: boolean;
}) {
  const student = students.find((s) => s.id === studentId);
  const displayName = student?.full_name || overviewData?.student_name || "—";
  const displayAdmission = student?.admission_number || "—";

  const firstFee = overviewData?.fees?.[0];
  const displayCourseBatch = student
    ? `${student.batch_name || student.course || "—"}`
    : firstFee
      ? `${firstFee.batch_name || ""} ${firstFee.course_name ? `/ ${firstFee.course_name}` : ""}`.trim() ||
        "—"
      : "—";

  const displayStatus = student?.status || "—";

  const summary = overviewData?.summary;
  const totalAllocated = summary?.total_billed ?? 0;
  const totalDiscount = summary?.total_discount ?? 0;
  const totalPaid = summary?.total_paid ?? 0;
  const totalDue = summary?.total_due ?? 0;

  const fees = overviewData?.fees || [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Student Fee Overview</DialogTitle>
          <DialogDescription>
            Detailed billing history, outstanding amounts, and discounts for the student.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Retrieving fee details...</p>
          </div>
        ) : (
          <div className="space-y-6 py-3">
            <div className="bg-muted/40 border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Student Name</span>
                <span className="font-semibold text-foreground">{displayName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Admission Number</span>
                <span className="font-semibold font-mono text-foreground">{displayAdmission}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Batch / Course</span>
                <span className="font-semibold text-foreground">{displayCourseBatch}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Status</span>
                <span className="capitalize font-semibold text-foreground">{displayStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Total Allocated</span>
                <span className="text-lg font-bold font-heading">
                  {formatCurrency(totalAllocated)}
                </span>
              </div>
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Total Discount</span>
                <span className="text-lg font-bold font-heading text-green-600">
                  {formatCurrency(totalDiscount)}
                </span>
              </div>
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Total Paid</span>
                <span className="text-lg font-bold font-heading text-primary">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Net Due</span>
                <span className="text-lg font-bold font-heading text-destructive">
                  {formatCurrency(totalDue)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-heading font-semibold text-sm">Linked Fee Structures</h4>
              {fees.length === 0 ? (
                <div className="border border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground">
                  No fee structures assigned to this student.
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden bg-card">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border font-medium">
                        <th className="p-3">Fee Structure</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Paid</th>
                        <th className="p-3">Due</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fees.map((item: any) => {
                        const fs = feeStructures.find((x) => x.id === item.fee_structure);
                        const statusColors: Record<string, string> = {
                          paid: "bg-green-500/10 text-green-500 border-green-500/20",
                          partially_paid: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                          unpaid: "bg-red-500/10 text-red-500 border-red-500/20",
                          approval_pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
                        };
                        return (
                          <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3 font-medium">{fs?.name || item.fee_name || "—"}</td>
                            <td className="p-3">{formatCurrency(toNumber(item.total_amount))}</td>
                            <td className="p-3">
                              {Number(item.discount) > 0 ? (
                                <div>
                                  <div className="text-green-600 font-medium">
                                    -{formatCurrency(toNumber(item.discount))}
                                  </div>
                                  {item.discount_reason && (
                                    <div className="text-[10px] text-muted-foreground italic">
                                      {item.discount_reason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-3">{formatCurrency(toNumber(item.amount_paid))}</td>
                            <td className="p-3 font-semibold text-destructive">
                              {formatCurrency(toNumber(item.amount_due))}
                            </td>
                            <td className="p-3">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap",
                                  statusColors[item.status] ||
                                    "bg-muted text-muted-foreground border-muted-foreground/20",
                                )}
                              >
                                {item.status?.replace("_", " ") || "unpaid"}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {formatDate(item.due_date)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
