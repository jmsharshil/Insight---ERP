import { MoreVertical, Eye, ImageIcon } from "lucide-react";
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
        return fee ? fee.fee_structure_name || fee.name || "Fee Allocation" : "Fee Allocation";
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
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap", statusColors[r.status] || "bg-muted text-muted-foreground border-muted-foreground/20")}>
            {label?.replace("_", " ")}
          </span>
        );
      },
    },
  ];

  const hasPending = data.some((r) => r.status === "pending_verification");
  if (hasPending) {
    cols.push({
      key: "actions",
      header: "Actions",
      render: (r) => {
        if (r.status === "verified" || r.status === "rejected") return null;

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
    });
  }

  return <DataTable columns={cols} data={data} />;
}
