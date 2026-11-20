import { useState } from "react";
import { MoreVertical, Eye, ImageIcon, FileText } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { FeeTableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type StudentFee } from "@/redux/slices/feesSlice";

interface PaymentsTabProps {
  payments: any[];
  paymentsLoading: boolean;
  setVerifyingPayment: (p: any) => void;
  students: any[];
  studentFees: StudentFee[];
  payStudentName: string;
  setPayStudentName: (s: string) => void;
  payStatus: string;
  setPayStatus: (s: string) => void;
}

export default function PaymentsTab({
  payments,
  paymentsLoading,
  setVerifyingPayment,
  students,
  studentFees,
  payStudentName,
  setPayStudentName,
  payStatus,
  setPayStatus,
}: PaymentsTabProps) {
  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Filter Payments</h3>
            <p className="text-xs text-muted-foreground">
              Search recorded payments by student name and verification status.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
              placeholder="Search student name..."
              value={payStudentName}
              onChange={(e) => setPayStudentName(e.target.value)}
              className="w-full sm:w-48 h-9"
            />
            <Select value={payStatus} onValueChange={setPayStatus}>
              <SelectTrigger className="w-full sm:w-48 h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {paymentsLoading ? (
        <FeeTableSkeleton columns={8} rows={6} hasFilter={false} />
      ) : payments.length === 0 ? (
        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
          No payments recorded yet.
        </div>
      ) : (
        <PaymentsTable
          data={payments}
          onVerify={(p) => setVerifyingPayment(p)}
          loading={paymentsLoading}
          students={students}
          studentFees={studentFees}
        />
      )}
    </>
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
  const [viewingPayment, setViewingPayment] = useState<any>(null);

  const getStudentName = (studentId: any) => {
    const student = students.find((s) => s.id === studentId);
    return student ? student.full_name : studentId;
  };

  const getFeeName = (feeId: any) => {
    const fee = studentFees.find((f) => f.id === feeId);
    return fee ? fee.fee_structure_name || fee.name || "Fee Allocation" : "Fee Allocation";
  };

  const statusColors: Record<string, string> = {
    pending_verification: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    approval_pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    verified: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  };

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
        return getStudentName(r.student);
      },
    },
    {
      key: "student_fee",
      header: "Fee Allocation",
      render: (r) => getFeeName(r.student_fee),
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => formatCurrency(Number(r.amount)),
    },
    {
      key: "payment_mode",
      header: "Mode",
      render: (r) => <span className="uppercase text-xs font-semibold">{r.payment_mode?.replace("_", " ")}</span>,
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
      key: "payment_proof",
      header: "Proof",
      render: (r) => {
        if (r.payment_proof) {
          return (
            <a
              href={r.payment_proof}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </a>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "payment_document",
      header: "Document",
      render: (r) => {
        if (r.payment_document) {
          return (
            <a
              href={r.payment_document}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              View
            </a>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const label =
          r.status === "pending_verification"
            ? "Pending Verification"
            : r.status === "approval_pending"
            ? "Approval Pending"
            : r.status;
        return (
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap", statusColors[r.status] || "bg-muted text-muted-foreground border-muted-foreground/20")}>
            {label?.replace("_", " ")}
          </span>
        );
      },
    },
  ];

  cols.push({
    key: "actions",
    header: "Actions",
    render: (r) => {
      const isPending = r.status === "approval_pending" || r.status === "pending_verification";

      return (
        <div className="flex" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPending ? (
                <DropdownMenuItem
                  onClick={() => onVerify(r)}
                  className="text-primary hover:bg-primary/10 cursor-pointer font-medium"
                >
                  Verify Payment
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setViewingPayment(r)}
                  className="cursor-pointer font-medium"
                >
                  View Details
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  });

  return (
    <>
      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        onRowClick={(row) => {
          if (row.status === "pending_verification" || row.status === "approval_pending") {
            onVerify(row);
          } else {
            setViewingPayment(row);
          }
        }}
      />

      {/* Read-Only Payment Details Sheet */}
      {viewingPayment && (
        <Sheet open={!!viewingPayment} onOpenChange={(o) => !o && setViewingPayment(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-heading">Payment Details</SheetTitle>
              <SheetDescription>
                Viewing recorded information for receipt {viewingPayment.receipt_number || "—"}.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-3 text-sm">
              <div className="flex justify-between items-center bg-muted/40 p-3 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-medium">Status</span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize",
                    statusColors[viewingPayment.status] || "bg-muted text-muted-foreground border-muted-foreground/20",
                  )}
                >
                  {(viewingPayment.status_display || viewingPayment.status)?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                <div>
                  <span className="text-xs text-muted-foreground block">Receipt Number</span>
                  <span className="font-mono font-semibold text-foreground text-sm">{viewingPayment.receipt_number || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Amount</span>
                  <span className="font-bold text-primary text-base">{formatCurrency(Number(viewingPayment.amount))}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Student</span>
                  <span className="font-medium text-foreground">
                    {viewingPayment.student_name || getStudentName(viewingPayment.student)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Fee Allocation</span>
                  <span className="font-medium text-foreground">{getFeeName(viewingPayment.student_fee)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Payment Mode</span>
                  <span className="capitalize font-medium text-foreground">
                    {viewingPayment.payment_mode?.replace("_", " ") || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Payment Date</span>
                  <span className="font-medium text-foreground">
                    {viewingPayment.payment_date ? formatDate(viewingPayment.payment_date) : "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground block">Transaction Ref</span>
                  <span className="font-mono font-medium text-foreground">{viewingPayment.transaction_ref || "—"}</span>
                </div>
                {viewingPayment.bank_account_name && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Bank Account</span>
                    <span className="font-medium text-foreground">{viewingPayment.bank_account_name}</span>
                  </div>
                )}
                {viewingPayment.note && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Note</span>
                    <p className="text-xs italic bg-background p-2.5 rounded-lg border mt-1 text-muted-foreground">
                      {viewingPayment.note}
                    </p>
                  </div>
                )}
                {viewingPayment.remarks && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Remarks</span>
                    <p className="text-xs bg-background p-2.5 rounded-lg border mt-1 text-foreground">
                      {viewingPayment.remarks}
                    </p>
                  </div>
                )}
                {viewingPayment.rejection_reason && (
                  <div className="col-span-2">
                    <span className="text-xs text-red-500 font-medium block">Rejection Reason</span>
                    <p className="text-xs bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-200 mt-1">
                      {viewingPayment.rejection_reason}
                    </p>
                  </div>
                )}
                {(viewingPayment.payment_proof || viewingPayment.payment_document) && (
                  <div className="col-span-2 flex flex-wrap gap-3 pt-2 border-t border-border/50">
                    {viewingPayment.payment_proof && (
                      <a
                        href={viewingPayment.payment_proof}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-background px-3 py-1.5 rounded-md border"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Payment Proof
                      </a>
                    )}
                    {viewingPayment.payment_document && (
                      <a
                        href={viewingPayment.payment_document}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-background px-3 py-1.5 rounded-md border"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Document
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <SheetFooter className="mt-4">
              <Button variant="outline" onClick={() => setViewingPayment(null)}>
                Close
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
