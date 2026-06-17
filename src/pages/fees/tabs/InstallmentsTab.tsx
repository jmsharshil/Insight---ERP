import { MoreVertical } from "lucide-react";
import DataTable from "@/components/common/DataTable";
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

interface InstallmentsTabProps {
  installments: any[];
  installmentsLoading: boolean;
  setViewingInstallment: (inst: any) => void;
  handleApproveRejectInstallment: (id: string, status: string) => void;
  setRejectInstallment: (inst: any) => void;
  approveLoadingId: string | null;
  isAccountant: boolean;
  isAdmin: boolean;
  instStudentName: string;
  setInstStudentName: (s: string) => void;
  instStatus: string;
  setInstStatus: (s: string) => void;
}

export default function InstallmentsTab({
  installments,
  installmentsLoading,
  setViewingInstallment,
  handleApproveRejectInstallment,
  setRejectInstallment,
  approveLoadingId,
  isAccountant,
  isAdmin,
  instStudentName,
  setInstStudentName,
  instStatus,
  setInstStatus,
}: InstallmentsTabProps) {
  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Filter Installment Plans</h3>
            <p className="text-xs text-muted-foreground">
              Search installments by student name and approval status.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
              placeholder="Search student name..."
              value={instStudentName}
              onChange={(e) => setInstStudentName(e.target.value)}
              className="w-full sm:w-48 h-9"
            />
            <Select value={instStatus} onValueChange={setInstStatus}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {installmentsLoading ? (
        <FeeTableSkeleton columns={5} rows={5} hasFilter={false} />
      ) : (
      <DataTable
        columns={[
          {
            key: "student",
            header: "Student",
            render: (item: any) => {
              return (
                <div>
                  <div className="font-semibold">
                    {item.student_name || item.student?.full_name || "—"}
                  </div>
                </div>
              );
            },
          },
          {
            key: "total_amount",
            header: "Total Amount",
            render: (item: any) => {
              const val =
                item.total_amount ??
                item.student_fee?.total_amount ??
                item.items?.reduce(
                  (acc: number, curr: any) => acc + Number(curr.amount || 0),
                  0
                ) ??
                0;
              return formatCurrency(Number(val));
            },
          },
          {
            key: "items",
            header: "Schedule Breakdown",
            render: (item: any) => {
              const items = item.items || [];
              if (items.length === 0) return "—";
              return (
                <div className="flex flex-col gap-1 my-1">
                  {items.map((it: any, idx: number) => (
                    <div
                      key={it.id || idx}
                      className="text-[11px] flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span className="text-muted-foreground font-medium">#{idx + 1}:</span>
                      <span className="font-semibold">{formatCurrency(Number(it.amount))}</span>
                      <span className="text-muted-foreground">({formatDate(it.due_date)})</span>
                      <span
                        className={cn(
                          "px-1 py-0 rounded text-[9px] font-semibold border capitalize",
                          it.is_paid
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                      >
                        {it.is_paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  ))}
                </div>
              );
            },
          },
          {
            key: "created_at",
            header: "Created At",
            render: (item: any) => formatDate(item.created_at),
          },
          {
            key: "status",
            header: "Status",
            render: (item: any) => {
              const statusColors: any = {
                approved: "bg-green-500/10 text-green-500 border-green-500/20",
                pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                pending_approval: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                rejected: "bg-red-500/10 text-red-500 border-red-500/20",
              };
              const displayStatus = item.status_display || item.status || "pending";
              return (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize",
                    statusColors[item.status] ||
                      "bg-muted text-muted-foreground border-muted-foreground/20"
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
              const displayStatus = item.status || "pending";
              const isPending =
                displayStatus === "pending" || displayStatus === "pending_approval";
              const canApprove = isPending && (isAccountant || isAdmin);
              if (!canApprove) return null;
              const isLoading = approveLoadingId === item.id;
              return (
                <div className="flex" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading}
                        className="h-8 w-8"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          handleApproveRejectInstallment(item.id, "approved");
                        }}
                        className="text-green-600 hover:text-green-700 hover:bg-green-500/10 cursor-pointer"
                      >
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRejectInstallment(item);
                        }}
                        className="text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            },
          },
        ]}
        data={installments}
        onRowClick={(row) => setViewingInstallment(row)}
      />
      )}
    </>
  );
}
