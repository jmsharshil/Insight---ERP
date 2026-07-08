import { MoreVertical, CheckCircle, XCircle } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";

interface RefundsTabProps {
  refunds: any[];
  refundsLoading: boolean;
  onUpdateStatus: (id: string, status: "completed" | "rejected", payload?: any) => void;
  students: any[];
  payments: any[];
  refStudentName: string;
  setRefStudentName: (s: string) => void;
  refStatus: string;
  setRefStatus: (s: string) => void;
  isAccountant: boolean;
  isAdmin: boolean;
}

export default function RefundsTab({
  refunds,
  refundsLoading,
  onUpdateStatus,
  students,
  payments,
  refStudentName,
  setRefStudentName,
  refStatus,
  setRefStatus,
  isAccountant,
  isAdmin,
}: RefundsTabProps) {
  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Filter Refunds</h3>
            <p className="text-xs text-muted-foreground">
              Search refunds by student name and approval/refund status.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
              placeholder="Search student name..."
              value={refStudentName}
              onChange={(e) => setRefStudentName(e.target.value)}
              className="w-full sm:w-48 h-9"
            />
            <Select value={refStatus} onValueChange={setRefStatus}>
              <SelectTrigger className="w-full sm:w-48 h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approval_pending">Approval Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {refundsLoading ? (
        <FeeTableSkeleton columns={7} rows={5} hasFilter={false} />
      ) : refunds.length === 0 ? (
        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
          No refunds recorded yet.
        </div>
      ) : (
        <RefundsTable
          data={refunds}
          onUpdateStatus={onUpdateStatus}
          loading={refundsLoading}
          students={students}
          payments={payments}
          isAccountant={isAccountant}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

function RefundsTable({
  data,
  onUpdateStatus,
  loading,
  students,
  payments,
  isAccountant,
  isAdmin,
}: {
  data: any[];
  onUpdateStatus: (id: string, status: "completed" | "rejected", payload?: any) => void;
  loading: boolean;
  students: any[];
  payments: any[];
  isAccountant: boolean;
  isAdmin: boolean;
}) {
  const [approveDialogId, setApproveDialogId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");

  const handleApproveSubmit = () => {
    if (!approveDialogId || !transactionId.trim()) return;
    onUpdateStatus(approveDialogId, "completed", { transaction_id: transactionId.trim() });
    setApproveDialogId(null);
    setTransactionId("");
  };

  const cols: DataTableColumn<any>[] = [
    {
      key: "id",
      header: "Refund ID",
      className: "font-mono text-xs font-semibold",
      render: (r) => r.id?.substring(0, 8) || "—",
    },
    {
      key: "student",
      header: "Student",
      render: (r) => {
        // Find the payment
        const payment = payments.find((p) => p.id === r.payment);
        if (!payment) return "—";
        const student = students.find((s) => s.id === payment.student);
        return student ? student.full_name : "—";
      },
    },
    {
      key: "payment",
      header: "Payment Receipt #",
      render: (r) => {
        const payment = payments.find((p) => p.id === r.payment);
        return payment ? (
          <span className="font-mono text-xs font-medium">{payment.receipt_number || "—"}</span>
        ) : (
          "—"
        );
      },
    },
    {
      key: "amount",
      header: "Refund Amount",
      render: (r) => (
        <span className="font-bold text-destructive">
          {formatCurrency(Number(r.amount))}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="text-xs text-muted-foreground">{r.reason || "—"}</span>,
    },
    {
      key: "created_at",
      header: "Created Date",
      render: (r) => formatDate(r.created_at || r.submittedAt),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const statusColors: Record<string, string> = {
          approval_pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          completed: "bg-green-500/10 text-green-500 border-green-500/20",
          rejected: "bg-red-500/10 text-red-500 border-red-500/20",
        };
        return (
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap", statusColors[r.status] || "bg-muted text-muted-foreground border-muted-foreground/20")}>
            {r.status?.replace("_", " ")}
          </span>
        );
      },
    },
  ];

  const hasPending = data.some((r) => r.status === "approval_pending");
  if (hasPending && isAdmin) {
    cols.push({
      key: "actions",
      header: "Actions",
      render: (r) => {
        const canApprove = r.status === "approval_pending" && isAdmin;
        if (!canApprove) return null;

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
                  onClick={() => {
                    setTransactionId("");
                    setApproveDialogId(r.id);
                  }}
                  className="text-green-600 hover:bg-green-500/10 cursor-pointer font-medium gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Complete Refund
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(r.id, "rejected")}
                  className="text-red-600 hover:bg-red-500/10 cursor-pointer font-medium gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Refund
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    });
  }

  return (
    <>
      <DataTable columns={cols} data={data} />
      
      <Dialog open={!!approveDialogId} onOpenChange={(o) => !o && setApproveDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Please provide the transaction ID or Cheque Number to complete this refund.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Transaction ID / Cheque Number *</Label>
              <Input
                placeholder="e.g. TXN123456789"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogId(null)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApproveSubmit}
              disabled={!transactionId.trim()}
            >
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
