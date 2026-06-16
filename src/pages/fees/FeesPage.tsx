import { useEffect, useMemo, useState } from "react";
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
import {
  DUMMY_FEE_TXNS,
  FEE_STATUS_META,
  FEE_STRUCTURES,
  type FeeTransaction,
  type FeeStatus,
  type PaymentMode,
} from "@/constants/dummy/fees";
import { DUMMY_STUDENTS } from "@/constants/dummy/students";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { feesActions, studentActions } from "@/redux/actions";
import { setFeeStructure } from "@/redux/slices/feesSlice";
import type { FeesStructure } from "@/redux/slices/feesSlice";
import { RootState } from "@/store";
import { API } from "@/service/api";

export default function FeesPage() {
  const { setPageTitle } = useUI();
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useDispatch();

  const feeStructure = useSelector((state: RootState) => state.fees.feeStructure);

  useEffect(() => {
    setPageTitle("Fees");
  }, [setPageTitle]);

  useEffect(() => {
    dispatch({
      type: feesActions.GET_FEE_STRUCTURES,
      method: "get",
      endPoint: "/api/v1/fee-structures/",
      auth: true,
      getResponse: (response: any) => {
        if (response) {
          dispatch(setFeeStructure(response.data));
        }
      },
      onError: (error) => {
        toast.error(error);
      },
    });
  }, [dispatch]);

  const [txns, setTxns] = useState<FeeTransaction[]>(DUMMY_FEE_TXNS);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [reject, setReject] = useState<FeeTransaction | null>(null);
  const [approve, setApprove] = useState<FeeTransaction | null>(null);
  const [refundOpen, setRefundOpen] = useState<FeeTransaction | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);

  const role = user?.role;
  const isStudentLike = role === "student" || role === "parent" || role === "parents";
  const isAccountant = role === "accountant";
  const isBM = role === "branch_manager";
  const isAdmin = role === "super_admin" || isBM;
  const isAdminSr = role === "admin_senior_exec";

  // Fetch student detail for student/parent role
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  useEffect(() => {
    const targetStudentId = user?.linked_student || user?.id;
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
  }, [isStudentLike, user?.linked_student, dispatch]);

  // Filter fee structures for the student's course/batch
  const studentFeeStructures = useMemo(() => {
    if (!isStudentLike || !studentDetail || !feeStructure) return [];
    return feeStructure.filter((fs) => {
      const matchesCourseId = studentDetail.course && String(fs.course) === String(studentDetail.course);
      const matchesCourseName = studentDetail.course_name && fs.course_name === studentDetail.course_name;
      const matchesCourseString = studentDetail.course && fs.course_name && fs.course_name.toLowerCase().replace(/[^a-z0-9]/g, "") === String(studentDetail.course).toLowerCase().replace(/[^a-z0-9]/g, "");
      const matchesCourse = matchesCourseId || matchesCourseName || matchesCourseString;

      const matchesBatchId = studentDetail.batch && String(fs.batch) === String(studentDetail.batch);
      const matchesBatchName = studentDetail.batch_name && fs.batch_name === studentDetail.batch_name;
      const matchesCurrentBatchName = studentDetail.current_batch_name && fs.batch_name === studentDetail.current_batch_name;
      const matchesBatch = matchesBatchId || matchesBatchName || matchesCurrentBatchName;
      
      // Match by course, or by batch, or by both
      return matchesCourse || matchesBatch;
    });
  }, [isStudentLike, studentDetail, feeStructure]);

  // Student/Parent view ----------------------
  if (isStudentLike)
    return (
      <StudentFeesView
        txns={txns}
        setTxns={setTxns}
        uploadOpen={uploadOpen}
        setUploadOpen={setUploadOpen}
        studentDetail={studentDetail}
        studentDetailLoading={studentDetailLoading}
        feeStructures={studentFeeStructures}
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

  return (
    <div>
      <PageHeader
        title="Fees Management"
        subtitle="Track collections, verifications and refunds."
        actions={
          isAdminSr ? (
            <Button
              onClick={() => setCashOpen(true)}
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              <Wallet className="w-4 h-4" /> Add Cash Entry
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Collected This Month"
          value={formatCurrency(totalThisMonth)}
          icon={Wallet}
          trendType="up"
          index={0}
        />
        <StatCard
          title="Pending Verifications"
          value={pending.length}
          icon={Clock}
          trendType="warning"
          index={1}
        />
        <StatCard
          title="Overdue"
          value={overdueStudents.length}
          icon={AlertCircle}
          trendType="down"
          index={2}
        />
        <StatCard title="Refunds Pending" value={refunds.length} icon={RotateCcw} index={3} />
      </div>

      <div className="mb-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary-light/50 border border-primary/30">
        <Bell className="w-3.5 h-3.5 text-primary-dark" />
        <span>3 auto-reminders scheduled for today</span>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Verifications ({pending.length})</TabsTrigger>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          {(isBM || isAdmin) && (
            <TabsTrigger value="cash">Cash Approvals ({cashApprovals.length})</TabsTrigger>
          )}
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueStudents.length})</TabsTrigger>
          <TabsTrigger value="refunds">Refunds ({refunds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
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
        </TabsContent>

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
            {feeStructure?.map((fs, i) => (
              <motion.div
                key={fs.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card border border-border p-4 cursor-pointer"
              >
                <h3 className="font-heading font-semibold">{fs.name}</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <Row label="Course" value={fs.course_name} />
                  <Row label="Batch" value={fs.batch_name} />
                  <Row label="Total Amount" value={fs.total_amount} />
                </div>
                {(isAccountant || isAdmin) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => toast.info("Edit fee structure (not implemented).")}
                  >
                    Edit
                  </Button>
                )}
              </motion.div>
            ))}
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
    </div>
  );
}

/* --- Sub views --- */
function StudentFeesView({
  txns,
  setTxns,
  uploadOpen,
  setUploadOpen,
  studentDetail,
  studentDetailLoading,
  feeStructures,
}: {
  txns: FeeTransaction[];
  setTxns: React.Dispatch<React.SetStateAction<FeeTransaction[]>>;
  uploadOpen: boolean;
  setUploadOpen: (b: boolean) => void;
  studentDetail: any;
  studentDetailLoading: boolean;
  feeStructures: FeesStructure[];
}) {
  const toast = useToast();
  const { user } = useAuth();

  // Derive student info from real API data, fallback to dummy if not loaded yet
  const studentName = studentDetail?.full_name || user?.name || "Loading...";
  const studentId = studentDetail?.id || user?.linked_student || user?.id || "";
  const courseName = studentDetail?.course_name || studentDetail?.course || "";
  const batchName = studentDetail?.current_batch_name || studentDetail?.batch_name || "";

  // Calculate fee totals from fee structures
  const totalFee = feeStructures.reduce((sum, fs) => sum + Number(fs.total_amount || 0), 0);
  // For paid amount, sum approved transactions for this student
  const paidAmount = txns
    .filter((t) => t.studentId === studentId && t.status === "approved")
    .reduce((sum, t) => sum + t.amount, 0);
  const outstanding = totalFee - paidAmount;

  const my = txns.filter((t) => t.studentId === studentId);

  if (studentDetailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your fee details...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Fees"
        subtitle={`Account: ${studentName}`}
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
        {courseName && (
          <p className="text-xs opacity-70 mt-1">
            {courseName}{batchName ? ` — ${batchName}` : ""}
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-xs opacity-80">Total</p>
            <p className="text-xl font-heading font-bold">{formatCurrency(totalFee)}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Paid</p>
            <p className="text-xl font-heading font-bold text-primary">
              {formatCurrency(paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">Outstanding</p>
            <p className="text-xl font-heading font-bold">{formatCurrency(outstanding > 0 ? outstanding : 0)}</p>
          </div>
        </div>
      </motion.div>

      {/* My Fee Structures */}
      {feeStructures.length > 0 && (
        <div className="mb-4">
          <h3 className="font-heading font-semibold mb-2">My Fee Structure</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feeStructures.map((fs) => (
              <motion.div
                key={fs.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card border border-border p-4"
              >
                <h4 className="font-heading font-semibold">{fs.name}</h4>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course</span>
                    <span className="font-medium">{fs.course_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batch</span>
                    <span className="font-medium">{fs.batch_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-medium">{fs.total_amount}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-heading font-semibold mb-2">Payment History</h3>
      <TxnTable data={my} />

      <UploadPaymentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={(data) => {
          setTxns((prev) => [
            {
              id: `RCP-2024-${String(prev.length + 1).padStart(3, "0")}`,
              studentId: studentId,
              studentName: studentName,
              amount: data.amount,
              paymentMode: data.mode,
              status: "pending",
              screenshotUrl: "https://placehold.co/600x400?text=Uploaded",
              submittedBy: user?.name ?? studentName,
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
